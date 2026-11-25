import Error "mo:core/Error";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import EmailClient "mo:caffeineai-email/emailClient";

import Common "../types/common";
import Bookings "../types/bookings";
import Venues "../types/venues";
import Guests "../types/guests";
import Floorplan "../types/floorplan";
import Notifications "../types/notifications";
import BookingsLib "../lib/bookings";
import NotificationsLib "../lib/notifications";

mixin (
  venues : Map.Map<Common.VenueId, Venues.Venue>,
  teamMembers : Map.Map<Principal, Venues.TeamMember>,
  roomTables : Map.Map<Common.TableId, Floorplan.RoomTable>,
  guests : Map.Map<Common.GuestId, Guests.Guest>,
  bookings : Map.Map<Common.BookingId, Bookings.Booking>,
  counters : {
    var nextGuestId : Nat;
    var nextBookingId : Nat;
    var nextTemplateId : Nat;
    var nextAuditId : Nat;
  },
  emailTemplates : Map.Map<Common.TemplateId, Notifications.EmailTemplate>,
  rateState : BookingsLib.RateState,
) {
  transient let deps : BookingsLib.Deps = {
    venues;
    teamMembers;
    roomTables;
    guests;
    bookings;
    counters;
  };

  // Send the transactional email matching a booking lifecycle event. A guest
  // without an email address is skipped silently; a failed send never traps.
  func sendLifecycleEmail(booking : Bookings.Booking, kind : Notifications.TemplateKind) : async () {
    let guest = guests.get(booking.guestId);
    let ?g = guest else return;
    let ?recipient = g.email else return;
    let venue = venues.get(booking.venueId);
    let language = NotificationsLib.guestLanguage(guest);
    let template = NotificationsLib.getOrSeedTemplate(emailTemplates, counters, booking.venueId, kind, language);
    let ctx = NotificationsLib.contextFor(booking, guest, venue);
    let subject = NotificationsLib.render(template.subject, ctx);
    let body = NotificationsLib.render(template.body, ctx);
    ignore await EmailClient.sendServiceEmail("no-reply", [recipient], subject, body);
  };

  // ---- Staff operations (scoped to the caller's venue) ----

  func requireMember(caller : Principal) : Venues.TeamMember {
    switch (BookingsLib.memberOf(deps, caller)) {
      case (?m) { m };
      case null { Runtime.trap("not a venue member") };
    };
  };

  func requireVenue(venueId : Common.VenueId) : Venues.Venue {
    switch (BookingsLib.venueOf(deps, venueId)) {
      case (?v) { v };
      case null { Runtime.trap("unknown venue") };
    };
  };

  public shared ({ caller }) func createBooking(input : BookingsLib.CreateInput) : async {
    #ok : BookingsLib.BookingView;
    #err : BookingsLib.BookingError;
  } {
    let member = requireMember(caller);
    let venue = requireVenue(member.venueId);
    switch (BookingsLib.createBooking(deps, venue, input, ?caller)) {
      case (#ok(b)) {
        await sendLifecycleEmail(b, #confirmation);
        #ok(BookingsLib.toView(deps, b));
      };
      case (#err(e)) { #err(e) };
    };
  };

  public shared ({ caller }) func modifyBooking(
    bookingId : Common.BookingId,
    input : BookingsLib.ModifyInput,
  ) : async { #ok : BookingsLib.BookingView; #err : BookingsLib.BookingError } {
    let member = requireMember(caller);
    switch (deps.bookings.get(bookingId)) {
      case (?b) {
        if (b.venueId != member.venueId) { return #err(#notAuthorized) };
        let venue = requireVenue(member.venueId);
        switch (BookingsLib.modifyBooking(deps, venue, b, input, ?caller)) {
          case (#ok(updated)) {
            await sendLifecycleEmail(updated, #modification);
            #ok(BookingsLib.toView(deps, updated));
          };
          case (#err(e)) { #err(e) };
        };
      };
      case null { #err(#notFound) };
    };
  };

  public shared ({ caller }) func changeBookingStatus(
    bookingId : Common.BookingId,
    status : Bookings.BookingStatus,
  ) : async { #ok : BookingsLib.BookingView; #err : BookingsLib.BookingError } {
    let member = requireMember(caller);
    switch (deps.bookings.get(bookingId)) {
      case (?b) {
        if (b.venueId != member.venueId) { return #err(#notAuthorized) };
        switch (BookingsLib.changeStatus(deps, b, status, ?caller)) {
          case (#ok(updated)) {
            if (status == #cancelled) { await sendLifecycleEmail(updated, #cancellation) };
            #ok(BookingsLib.toView(deps, updated));
          };
          case (#err(e)) { #err(e) };
        };
      };
      case null { #err(#notFound) };
    };
  };

  public query ({ caller }) func listBookingsForDate(date : Text) : async [BookingsLib.BookingView] {
    let member = switch (BookingsLib.memberOf(deps, caller)) {
      case (?m) { m };
      case null { return [] };
    };
    let ?day = BookingsLib.dayOfDate(date) else return [];
    let dayStart = day * 86_400_000_000_000;
    let dayEnd = dayStart + 86_400_000_000_000;
    deps.bookings.values()
      .filter(func b = b.venueId == member.venueId and b.startAt >= dayStart and b.startAt < dayEnd)
      .map(func b = BookingsLib.toView(deps, b))
      .toArray();
  };

  public query ({ caller }) func getBooking(bookingId : Common.BookingId) : async ?BookingsLib.BookingView {
    let member = switch (BookingsLib.memberOf(deps, caller)) {
      case (?m) { m };
      case null { return null };
    };
    switch (deps.bookings.get(bookingId)) {
      case (?b) {
        if (b.venueId != member.venueId) { return null };
        ?BookingsLib.toView(deps, b);
      };
      case null { null };
    };
  };

  public query ({ caller }) func getAvailability(date : Text, partySize : Nat) : async ?BookingsLib.Availability {
    let member = switch (BookingsLib.memberOf(deps, caller)) {
      case (?m) { m };
      case null { return null };
    };
    switch (BookingsLib.venueOf(deps, member.venueId)) {
      case (?venue) { ?BookingsLib.availability(deps, venue, date, partySize) };
      case null { null };
    };
  };

  // ---- Public booking (no account) ----

  public query func getPublicVenuePage(slug : Text) : async ?BookingsLib.PublicVenuePage {
    switch (BookingsLib.venueBySlug(deps, slug)) {
      case (?venue) { ?BookingsLib.publicPage(venue) };
      case null { null };
    };
  };

  public query func getPublicAvailability(slug : Text, date : Text, partySize : Nat) : async ?BookingsLib.Availability {
    switch (BookingsLib.venueBySlug(deps, slug)) {
      case (?venue) { ?BookingsLib.availability(deps, venue, date, partySize) };
      case null { null };
    };
  };

  public shared func createPublicBooking(
    slug : Text,
    guestName : Text,
    guestPhone : Text,
    guestEmail : ?Text,
    partySize : Nat,
    startAt : Common.Timestamp,
    notes : ?Text,
    honeypot : Text,
  ) : async BookingsLib.PublicBookingResult {
    // Honeypot: a filled hidden field means a bot.
    if (honeypot != "") { return #unavailable({ message = "invalid request" }) };
    let now = Time.now();
    if (not BookingsLib.allowRate(rateState, now, 10, 60_000_000_000)) {
      return #unavailable({ message = "too many requests" });
    };
    let venue = switch (BookingsLib.venueBySlug(deps, slug)) {
      case (?v) { v };
      case null { return #unavailable({ message = "unknown venue" }) };
    };
    if (partySize == 0 or partySize > venue.bookingDefaults.maxOnlinePartySize) {
      return #unavailable({ message = "party size not allowed" });
    };
    let input : BookingsLib.CreateInput = {
      guestName;
      guestPhone;
      guestEmail;
      partySize;
      startAt;
      notes;
      source = #online;
      tableId = null;
    };
    switch (BookingsLib.createBooking(deps, venue, input, null)) {
      case (#ok(b)) {
        await sendLifecycleEmail(b, #confirmation);
        #confirmed({ cancelToken = b.cancelToken; startAt = b.startAt; endAt = b.endAt });
      };
      case (#err(#slotUnavailable)) {
        #waitlisted({ message = "no table available for this slot; you have been added to the waitlist" });
      };
      case (#err(_)) {
        #unavailable({ message = "booking could not be created" });
      };
    };
  };

  // ---- Public manage flow by cancel token ----

  func findByToken(token : Text) : ?Bookings.Booking {
    deps.bookings.values().find(func b = b.cancelToken == token);
  };

  public query func getPublicBooking(token : Text) : async ?BookingsLib.PublicManageView {
    switch (findByToken(token)) {
      case (?b) {
        switch (BookingsLib.venueOf(deps, b.venueId)) {
          case (?venue) {
            ?BookingsLib.publicManageView(venue, b, deps.guests.get(b.guestId), Time.now());
          };
          case null { null };
        };
      };
      case null { null };
    };
  };

  public shared func modifyPublicBooking(
    token : Text,
    partySize : ?Nat,
    startAt : ?Common.Timestamp,
    notes : ?Text,
  ) : async { #ok : BookingsLib.PublicManageView; #err : BookingsLib.BookingError } {
    let now = Time.now();
    switch (findByToken(token)) {
      case (?b) {
        if (not BookingsLib.canModifyPublic(b, now)) { return #err(#pastCutoff) };
        switch (BookingsLib.venueOf(deps, b.venueId)) {
          case (?venue) {
            let input : BookingsLib.ModifyInput = {
              guestName = null;
              guestPhone = null;
              guestEmail = null;
              partySize;
              startAt;
              notes;
              tableId = null;
            };
            switch (BookingsLib.modifyBooking(deps, venue, b, input, null)) {
              case (#ok(updated)) {
                await sendLifecycleEmail(updated, #modification);
                #ok(BookingsLib.publicManageView(venue, updated, deps.guests.get(updated.guestId), now));
              };
              case (#err(e)) { #err(e) };
            };
          };
          case null { #err(#notFound) };
        };
      };
      case null { #err(#notFound) };
    };
  };

  public shared func cancelPublicBooking(token : Text) : async {
    #ok : BookingsLib.PublicManageView;
    #err : BookingsLib.BookingError;
  } {
    let now = Time.now();
    switch (findByToken(token)) {
      case (?b) {
        if (not BookingsLib.canModifyPublic(b, now)) { return #err(#pastCutoff) };
        switch (BookingsLib.venueOf(deps, b.venueId)) {
          case (?venue) {
            switch (BookingsLib.changeStatus(deps, b, #cancelled, null)) {
              case (#ok(updated)) {
                await sendLifecycleEmail(updated, #cancellation);
                #ok(BookingsLib.publicManageView(venue, updated, deps.guests.get(updated.guestId), now));
              };
              case (#err(e)) { #err(e) };
            };
          };
          case null { #err(#notFound) };
        };
      };
      case null { #err(#notFound) };
    };
  };
};
