import Array "mo:core/Array";
import Char "mo:core/Char";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Bookings "../types/bookings";
import Venues "../types/venues";
import Guests "../types/guests";
import Floorplan "../types/floorplan";

module {
  public type Booking = Bookings.Booking;
  public type BookingStatus = Bookings.BookingStatus;
  public type BookingSource = Bookings.BookingSource;
  public type StatusHistoryEntry = Bookings.StatusHistoryEntry;
  public type Venue = Venues.Venue;
  public type Guest = Guests.Guest;
  public type RoomTable = Floorplan.RoomTable;

  public type BookingError = {
    #notFound;
    #notAuthorized;
    #invalidInput : Text;
    #slotUnavailable;
    #pastCutoff;
    #invalidStatus;
  };

  public type Slot = { startAt : Common.Timestamp; endAt : Common.Timestamp };

  public type Availability = {
    date : Text;
    slots : [Slot];
  };

  public type BookingView = {
    id : Common.BookingId;
    venueId : Common.VenueId;
    guestId : Common.GuestId;
    guestName : Text;
    guestPhone : Text;
    guestEmail : ?Text;
    tableId : ?Common.TableId;
    tableName : ?Text;
    startAt : Common.Timestamp;
    endAt : Common.Timestamp;
    partySize : Nat;
    status : BookingStatus;
    source : BookingSource;
    notes : ?Text;
    cancelToken : Text;
    statusHistory : [StatusHistoryEntry];
    createdAt : Common.Timestamp;
  };

  public type PublicVenuePage = {
    venueId : Common.VenueId;
    name : Text;
    description : Text;
    address : Text;
    phone : Text;
    logo : ?Text;
    timezone : Common.Timezone;
    openingHours : [Venues.DayHours];
    closedDates : [Text];
    services : [Venues.ServiceWindow];
    maxOnlinePartySize : Nat;
    defaultTableDurationMinutes : Nat;
  };

  public type PublicBookingResult = {
    #confirmed : { cancelToken : Text; startAt : Common.Timestamp; endAt : Common.Timestamp };
    #waitlisted : { message : Text };
    #unavailable : { message : Text };
  };

  public type PublicManageView = {
    venueName : Text;
    guestName : Text;
    startAt : Common.Timestamp;
    endAt : Common.Timestamp;
    partySize : Nat;
    status : BookingStatus;
    notes : ?Text;
    canModify : Bool;
    canCancel : Bool;
  };

  public type CreateInput = {
    guestName : Text;
    guestPhone : Text;
    guestEmail : ?Text;
    partySize : Nat;
    startAt : Common.Timestamp;
    notes : ?Text;
    source : BookingSource;
    tableId : ?Common.TableId;
  };

  public type ModifyInput = {
    guestName : ?Text;
    guestPhone : ?Text;
    guestEmail : ?Text;
    partySize : ?Nat;
    startAt : ?Common.Timestamp;
    notes : ?Text;
    tableId : ?Common.TableId;
  };

  public type Deps = {
    venues : Map.Map<Common.VenueId, Venue>;
    teamMembers : Map.Map<Principal, Venues.TeamMember>;
    roomTables : Map.Map<Common.TableId, RoomTable>;
    guests : Map.Map<Common.GuestId, Guest>;
    bookings : Map.Map<Common.BookingId, Booking>;
    counters : {
      var nextGuestId : Nat;
      var nextBookingId : Nat;
    };
  };

  // ---- Time helpers (UTC, nanoseconds) ----

  let nsPerMinute : Int = 60_000_000_000;
  let nsPerDay : Int = 86_400_000_000_000;

  /// Days since the Unix epoch for a UTC timestamp.
  public func dayIndex(ts : Common.Timestamp) : Int {
    let d = ts / nsPerDay;
    if (ts < 0 and ts % nsPerDay != 0) { d - 1 } else { d };
  };

  /// Minutes since UTC midnight for a timestamp.
  public func minuteOfDay(ts : Common.Timestamp) : Nat {
    let rem = ts - dayIndex(ts) * nsPerDay;
    (rem / nsPerMinute).toNat();
  };

  /// Weekday index 0 = Monday … 6 = Sunday for a day index.
  public func weekdayOf(day : Int) : Nat {
    // 1970-01-01 was a Thursday (index 3).
    let w = (day + 3) % 7;
    let w2 = if (w < 0) { w + 7 } else { w };
    w2.toNat();
  };

  /// UTC date string "YYYY-MM-DD" for a day index.
  public func dateOfDay(day : Int) : Text {
    let (y, m, d) = civilFromDays(day);
    pad4(y) # "-" # pad2(m) # "-" # pad2(d);
  };

  /// Day index for a "YYYY-MM-DD" date string, or null when malformed.
  public func dayOfDate(date : Text) : ?Int {
    let parts = date.split(#char '-').toArray();
    if (parts.size() != 3) { return null };
    let ?y = Int.fromText(parts[0]) else return null;
    let ?m = Int.fromText(parts[1]) else return null;
    let ?d = Int.fromText(parts[2]) else return null;
    if (m < 1 or m > 12 or d < 1 or d > 31) { return null };
    ?daysFromCivil(y, m, d);
  };

  func pad2(n : Int) : Text {
    let t = n.toText();
    if (t.size() < 2) { "0" # t } else { t };
  };

  func pad4(n : Int) : Text {
    let t = n.toText();
    if (t.size() < 4) { "0" # t } else { t };
  };

  // Howard Hinnant's civil-from-days / days-from-civil algorithms.
  func civilFromDays(z0 : Int) : (Int, Int, Int) {
    let z = z0 + 719468;
    let era = (if (z >= 0) { z } else { z - 146096 }) / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) { mp + 3 } else { mp - 9 };
    let yy = if (m <= 2) { y + 1 } else { y };
    (yy, m, d);
  };

  func daysFromCivil(y0 : Int, m : Int, d : Int) : Int {
    let y = if (m <= 2) { y0 - 1 } else { y0 };
    let era = (if (y >= 0) { y } else { y - 399 }) / 400;
    let yoe = y - era * 400;
    let mp = if (m > 2) { m - 3 } else { m + 9 };
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468;
  };

  // ---- Venue / membership helpers ----

  public func memberOf(deps : Deps, caller : Principal) : ?Venues.TeamMember {
    deps.teamMembers.get(caller);
  };

  public func venueOf(deps : Deps, venueId : Common.VenueId) : ?Venue {
    deps.venues.get(venueId);
  };

  public func venueBySlug(deps : Deps, slug : Text) : ?Venue {
    deps.venues.values().find(func v = v.publicSlug == slug);
  };

  // ---- Availability ----

  func isClosedOn(venue : Venue, date : Text) : Bool {
    venue.closures.any(func c = c.date == date);
  };

  func servicesForDay(venue : Venue, weekday : Nat) : [Venues.ServiceWindow] {
    switch (venue.openingHours.find(func h = h.weekday == weekday)) {
      case (?h) { h.services };
      case null { [] };
    };
  };

  func overlaps(aStart : Int, aEnd : Int, bStart : Int, bEnd : Int) : Bool {
    aStart < bEnd and bStart < aEnd;
  };

  /// True when the table has no active booking overlapping [start, end).
  public func tableFree(deps : Deps, tableId : Common.TableId, start : Int, end : Int) : Bool {
    not deps.bookings.values().any(func b =
      switch (b.tableId) {
        case (?tid) {
          tid == tableId
            and (b.status == #pending or b.status == #confirmed or b.status == #seated)
            and overlaps(b.startAt, b.endAt, start, end);
        };
        case null { false };
      }
    );
  };

  /// Free start times for a date and party size, derived from services,
  /// closures, table capacity and the default table duration.
  public func availability(deps : Deps, venue : Venue, date : Text, partySize : Nat) : Availability {
    let ?day = dayOfDate(date) else return { date; slots = [] };
    if (isClosedOn(venue, date)) { return { date; slots = [] } };
    let weekday = weekdayOf(day);
    let services = servicesForDay(venue, weekday);
    let duration = venue.bookingDefaults.defaultTableDurationMinutes;
    let dayStart = day * nsPerDay;
    let tables = deps.roomTables.values().filter(func t =
      t.venueId == venue.id and t.active and t.maxSeats >= partySize
    ).toArray();
    if (tables.size() == 0) { return { date; slots = [] } };
    let slots = Array.flatten(services.map(func s = do {
      let count = if (s.closeMinute > s.openMinute + duration) {
        (s.closeMinute - duration - s.openMinute) / 30 + 1;
      } else { 0 };
      Array.tabulate(count, func i = do {
        let startMin = s.openMinute + i * 30;
        let startAt = dayStart + startMin.toInt() * nsPerMinute;
        let endAt = startAt + duration.toInt() * nsPerMinute;
        { startAt; endAt };
      });
    }));
    let free = slots.filter(func slot =
      tables.any(func t = tableFree(deps, t.id, slot.startAt, slot.endAt))
    );
    { date; slots = free };
  };

  /// Smallest free table able to seat the party for the slot.
  public func suggestTable(deps : Deps, venue : Venue, partySize : Nat, start : Int, end : Int) : ?Common.TableId {
    let candidates = deps.roomTables.values().filter(func t =
      t.venueId == venue.id and t.active and t.maxSeats >= partySize
        and tableFree(deps, t.id, start, end)
    ).toArray();
    if (candidates.size() == 0) { return null };
    let sorted = candidates.sort(func(a, b) = Nat.compare(a.maxSeats, b.maxSeats));
    ?sorted[0].id;
  };

  // ---- Guest matching ----

  func normalizePhone(phone : Text) : Text {
    Text.fromIter(phone.toIter().filter(func c = c != ' ' and c != '-' and c != '(' and c != ')'));
  };

  public func findGuest(deps : Deps, venueId : Common.VenueId, phone : Text, email : ?Text) : ?Guest {
    let p = normalizePhone(phone);
    let byPhone = deps.guests.values().find(func g =
      g.venueId == venueId and normalizePhone(g.phone) == p
    );
    switch (byPhone) {
      case (?g) { ?g };
      case null {
        switch (email) {
          case (?e) {
            deps.guests.values().find(func g = g.venueId == venueId and g.email == ?e);
          };
          case null { null };
        };
      };
    };
  };

  public func upsertGuest(deps : Deps, venueId : Common.VenueId, name : Text, phone : Text, email : ?Text) : Common.GuestId {
    switch (findGuest(deps, venueId, phone, email)) {
      case (?g) {
        let updated : Guest = {
          id = g.id;
          venueId = g.venueId;
          name = if (name == "") { g.name } else { name };
          phone = if (phone == "") { g.phone } else { phone };
          email = switch (email) { case (?e) { ?e }; case null { g.email } };
          tags = g.tags;
          vip = g.vip;
          allergies = g.allergies;
          preferences = g.preferences;
          notes = g.notes;
          marketingOptIn = g.marketingOptIn;
          marketingOptInAt = g.marketingOptInAt;
          visitCount = g.visitCount;
          noShowCount = g.noShowCount;
          lastVisitAt = g.lastVisitAt;
          createdAt = g.createdAt;
        };
        deps.guests.add(g.id, updated);
        g.id;
      };
      case null {
        let id = deps.counters.nextGuestId;
        deps.counters.nextGuestId := id + 1;
        let guest : Guest = {
          id;
          venueId;
          name;
          phone;
          email;
          tags = [];
          vip = false;
          allergies = null;
          preferences = null;
          notes = null;
          marketingOptIn = false;
          marketingOptInAt = null;
          visitCount = 0;
          noShowCount = 0;
          lastVisitAt = null;
          createdAt = Time.now();
        };
        deps.guests.add(id, guest);
        id;
      };
    };
  };

  // ---- Booking creation ----

  func newToken() : Text {
    let now = Time.now();
    let raw = now.toText() # "-" # now.toText();
    var h : Nat = 5381;
    for (c in raw.chars()) {
      h := (h * 33 + c.toNat32().toNat()) % 2_147_483_647;
    };
    h.toText();
  };

  /// Create a booking, re-checking table availability at the data layer.
  /// Returns #slotUnavailable when the chosen table is taken.
  public func createBooking(
    deps : Deps,
    venue : Venue,
    input : CreateInput,
    by : ?Principal,
  ) : { #ok : Booking; #err : BookingError } {
    if (input.partySize == 0) { return #err(#invalidInput("party size must be positive")) };
    if (input.startAt <= 0) { return #err(#invalidInput("invalid start time")) };
    let duration = venue.bookingDefaults.defaultTableDurationMinutes;
    let endAt = input.startAt + duration.toInt() * nsPerMinute;
    let tableId = switch (input.tableId) {
      case (?tid) {
        switch (deps.roomTables.get(tid)) {
          case (?t) {
            if (t.venueId != venue.id or not t.active or t.maxSeats < input.partySize) {
              return #err(#invalidInput("table cannot seat this party"));
            };
            if (not tableFree(deps, tid, input.startAt, endAt)) {
              return #err(#slotUnavailable);
            };
            ?tid;
          };
          case null { return #err(#invalidInput("unknown table")) };
        };
      };
      case null { suggestTable(deps, venue, input.partySize, input.startAt, endAt) };
    };
    let guestId = upsertGuest(deps, venue.id, input.guestName, input.guestPhone, input.guestEmail);
    let id = deps.counters.nextBookingId;
    deps.counters.nextBookingId := id + 1;
    let now = Time.now();
    let booking : Booking = {
      id;
      venueId = venue.id;
      guestId;
      tableId;
      startAt = input.startAt;
      endAt;
      partySize = input.partySize;
      status = #confirmed;
      source = input.source;
      notes = input.notes;
      cancelToken = newToken();
      statusHistory = [{ status = #confirmed; at = now; by }];
      createdAt = now;
    };
    deps.bookings.add(id, booking);
    #ok(booking);
  };

  // ---- Status transitions ----

  func statusAllowed(from : BookingStatus, to : BookingStatus) : Bool {
    switch (from, to) {
      case (#pending, #confirmed) { true };
      case (#pending, #cancelled) { true };
      case (#confirmed, #seated) { true };
      case (#confirmed, #noShow) { true };
      case (#confirmed, #cancelled) { true };
      case (#seated, #finished) { true };
      case (#seated, #cancelled) { true };
      case _ { false };
    };
  };

  /// Apply a status change, appending a history entry and updating guest counters.
  public func changeStatus(
    deps : Deps,
    booking : Booking,
    to : BookingStatus,
    by : ?Principal,
  ) : { #ok : Booking; #err : BookingError } {
    if (not statusAllowed(booking.status, to)) { return #err(#invalidStatus) };
    let now = Time.now();
    let updated : Booking = {
      id = booking.id;
      venueId = booking.venueId;
      guestId = booking.guestId;
      tableId = booking.tableId;
      startAt = booking.startAt;
      endAt = booking.endAt;
      partySize = booking.partySize;
      status = to;
      source = booking.source;
      notes = booking.notes;
      cancelToken = booking.cancelToken;
      statusHistory = booking.statusHistory.concat([{ status = to; at = now; by }]);
      createdAt = booking.createdAt;
    };
    deps.bookings.add(booking.id, updated);
    switch (to) {
      case (#finished) { bumpGuest(deps, booking.guestId, true) };
      case (#noShow) { bumpGuest(deps, booking.guestId, false) };
      case _ {};
    };
    #ok(updated);
  };

  func bumpGuest(deps : Deps, guestId : Common.GuestId, visited : Bool) {
    switch (deps.guests.get(guestId)) {
      case (?g) {
        let updated : Guest = {
          id = g.id;
          venueId = g.venueId;
          name = g.name;
          phone = g.phone;
          email = g.email;
          tags = g.tags;
          vip = g.vip;
          allergies = g.allergies;
          preferences = g.preferences;
          notes = g.notes;
          marketingOptIn = g.marketingOptIn;
          marketingOptInAt = g.marketingOptInAt;
          visitCount = if (visited) { g.visitCount + 1 } else { g.visitCount };
          noShowCount = if (visited) { g.noShowCount } else { g.noShowCount + 1 };
          lastVisitAt = if (visited) { ?Time.now() } else { g.lastVisitAt };
          createdAt = g.createdAt;
        };
        deps.guests.add(guestId, updated);
      };
      case null {};
    };
  };

  /// Modify a booking's fields, re-checking table availability when the slot changes.
  public func modifyBooking(
    deps : Deps,
    venue : Venue,
    booking : Booking,
    input : ModifyInput,
    by : ?Principal,
  ) : { #ok : Booking; #err : BookingError } {
    let partySize = input.partySize ?? booking.partySize;
    let startAt = input.startAt ?? booking.startAt;
    let duration = venue.bookingDefaults.defaultTableDurationMinutes;
    let endAt = startAt + duration.toInt() * nsPerMinute;
    let tableId = switch (input.tableId) {
      case (?tid) { ?tid };
      case null { booking.tableId };
    };
    switch (tableId) {
      case (?tid) {
        switch (deps.roomTables.get(tid)) {
          case (?t) {
            if (t.venueId != venue.id or not t.active or t.maxSeats < partySize) {
              return #err(#invalidInput("table cannot seat this party"));
            };
          };
          case null { return #err(#invalidInput("unknown table")) };
        };
        // Exclude this booking itself from the overlap check.
        let taken = deps.bookings.values().any(func b =
          b.id != booking.id
            and b.tableId == ?tid
            and (b.status == #pending or b.status == #confirmed or b.status == #seated)
            and overlaps(b.startAt, b.endAt, startAt, endAt)
        );
        if (taken) { return #err(#slotUnavailable) };
      };
      case null {};
    };
    let now = Time.now();
    let updated : Booking = {
      id = booking.id;
      venueId = booking.venueId;
      guestId = booking.guestId;
      tableId;
      startAt;
      endAt;
      partySize;
      status = booking.status;
      source = booking.source;
      notes = switch (input.notes) { case (?n) { ?n }; case null { booking.notes } };
      cancelToken = booking.cancelToken;
      statusHistory = booking.statusHistory.concat([{ status = booking.status; at = now; by }]);
      createdAt = booking.createdAt;
    };
    deps.bookings.add(booking.id, updated);
    // Keep the guest record in sync with edited contact details.
    switch (input.guestName, input.guestPhone, input.guestEmail) {
      case (null, null, null) {};
      case (name, phone, email) {
        switch (deps.guests.get(booking.guestId)) {
          case (?g) {
            let updatedGuest : Guest = {
              id = g.id;
              venueId = g.venueId;
              name = name ?? g.name;
              phone = phone ?? g.phone;
              email = switch (email) { case (?e) { ?e }; case null { g.email } };
              tags = g.tags;
              vip = g.vip;
              allergies = g.allergies;
              preferences = g.preferences;
              notes = g.notes;
              marketingOptIn = g.marketingOptIn;
              marketingOptInAt = g.marketingOptInAt;
              visitCount = g.visitCount;
              noShowCount = g.noShowCount;
              lastVisitAt = g.lastVisitAt;
              createdAt = g.createdAt;
            };
            deps.guests.add(g.id, updatedGuest);
          };
          case null {};
        };
      };
    };
    #ok(updated);
  };

  // ---- Views ----

  public func toView(deps : Deps, b : Booking) : BookingView {
    let guest = deps.guests.get(b.guestId);
    let tableName = switch (b.tableId) {
      case (?tid) {
        switch (deps.roomTables.get(tid)) {
          case (?t) { ?t.name };
          case null { null };
        };
      };
      case null { null };
    };
    {
      id = b.id;
      venueId = b.venueId;
      guestId = b.guestId;
      guestName = switch (guest) { case (?g) { g.name }; case null { "" } };
      guestPhone = switch (guest) { case (?g) { g.phone }; case null { "" } };
      guestEmail = switch (guest) { case (?g) { g.email }; case null { null } };
      tableId = b.tableId;
      tableName;
      startAt = b.startAt;
      endAt = b.endAt;
      partySize = b.partySize;
      status = b.status;
      source = b.source;
      notes = b.notes;
      cancelToken = b.cancelToken;
      statusHistory = b.statusHistory;
      createdAt = b.createdAt;
    };
  };

  public func publicPage(venue : Venue) : PublicVenuePage {
    let services = venue.openingHours.map(func h = h.services).flatten();
    let texts = switch (venue.texts.find(func t = t.language == #fr)) {
      case (?t) { t };
      case null {
        switch (venue.texts.find(func t = t.language == #en)) {
          case (?t) { t };
          case null { { language = #fr; name = venue.name; description = "" } };
        };
      };
    };
    {
      venueId = venue.id;
      name = texts.name;
      description = texts.description;
      address = venue.address;
      phone = venue.phone;
      logo = venue.logo;
      timezone = venue.timezone;
      openingHours = venue.openingHours;
      closedDates = venue.closures.map(func c = c.date);
      services;
      maxOnlinePartySize = venue.bookingDefaults.maxOnlinePartySize;
      defaultTableDurationMinutes = venue.bookingDefaults.defaultTableDurationMinutes;
    };
  };

  /// Cut-off in nanoseconds before the booking start after which public changes are refused.
  let publicCutoffNs : Int = 120_000_000_000;

  public func canModifyPublic(booking : Booking, now : Int) : Bool {
    (booking.status == #pending or booking.status == #confirmed)
      and booking.startAt - now > publicCutoffNs;
  };

  public func publicManageView(venue : Venue, booking : Booking, guest : ?Guest, now : Int) : PublicManageView {
    let modifiable = canModifyPublic(booking, now);
    {
      venueName = venue.name;
      guestName = switch (guest) { case (?g) { g.name }; case null { "" } };
      startAt = booking.startAt;
      endAt = booking.endAt;
      partySize = booking.partySize;
      status = booking.status;
      notes = booking.notes;
      canModify = modifiable;
      canCancel = modifiable;
    };
  };

  // ---- Rate limiting (transient, in-memory) ----

  public type RateState = {
    var windowStart : Int;
    var count : Nat;
  };

  public func allowRate(state : RateState, now : Int, limit : Nat, windowNs : Int) : Bool {
    if (now - state.windowStart >= windowNs) {
      state.windowStart := now;
      state.count := 0;
    };
    if (state.count >= limit) { return false };
    state.count := state.count + 1;
    true;
  };
};
