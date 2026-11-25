import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import OQL "mo:caffeineai-oql";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

import VenuesMixin "mixins/venues";
import FloorplanMixin "mixins/floorplan";
import GuestsMixin "mixins/guests";
import BookingsMixin "mixins/bookings";
import NotificationsMixin "mixins/notifications";
import ApiDocMixin "mixins/api-doc";

import Common "types/common";
import Venues "types/venues";
import Bookings "types/bookings";
import Guests "types/guests";
import Floorplan "types/floorplan";
import Notifications "types/notifications";
import Audit "types/audit";

import BookingsLib "lib/bookings";

actor {
  let accessControlState : AccessControl.AccessControlState;

  // Venues and team membership.
  let venues : Map.Map<Common.VenueId, Venues.Venue>;
  let teamMembers : Map.Map<Principal, Venues.TeamMember>;
  let teamInvites : Map.Map<Text, Venues.TeamInvite>;

  // Floor plan.
  let roomTables : Map.Map<Common.TableId, Floorplan.RoomTable>;

  // Guests and bookings.
  let guests : Map.Map<Common.GuestId, Guests.Guest>;
  let bookings : Map.Map<Common.BookingId, Bookings.Booking>;

  // Notifications.
  let emailTemplates : Map.Map<Common.TemplateId, Notifications.EmailTemplate>;
  let reminderLogs : Map.Map<Common.BookingId, Notifications.ReminderLog>;

  // Append-only audit log.
  let auditLog : Map.Map<Common.AuditId, Audit.AuditEntry>;

  // Monotonic id counters.
  let counters : {
    var nextVenueId : Nat;
    var nextTableId : Nat;
    var nextGuestId : Nat;
    var nextBookingId : Nat;
    var nextTemplateId : Nat;
    var nextAuditId : Nat;
  };

  // Transient public-booking rate limiter (rebuilt on every start).
  transient let rateState : BookingsLib.RateState = { var windowStart = 0; var count = 0 };

  include MixinAuthorization(accessControlState, null);
  include VenuesMixin(venues, teamMembers, teamInvites, roomTables, guests, bookings, auditLog, counters);
  include FloorplanMixin(venues, teamMembers, roomTables, bookings, auditLog, counters);
  include GuestsMixin(guests, bookings, teamMembers, auditLog, counters);
  include BookingsMixin(venues, teamMembers, roomTables, guests, bookings, counters, emailTemplates, rateState);
  include NotificationsMixin(accessControlState, venues, teamMembers, guests, bookings, emailTemplates, reminderLogs, auditLog, counters);
  include ApiDocMixin();

  // ---- OQL: queryable entities ----
  // Every persisted, non-transient collection is exposed. Venue-scoped data is
  // readable by controllers and by signed-in callers scoped to their own venue
  // membership; the audit log and email templates are controller-only.

  func isVenueMember(caller : Principal, venueId : OQL.Value) : Bool {
    switch (teamMembers.get(caller)) {
      case (?m) { venueId == #nat(m.venueId) };
      case null { false };
    };
  };

  include Expose({
    entities = [
      venues.toEntityManual("venue", "Venue", "id")
        .sample({
          id = 0;
          venueType = #restaurant;
          name = "";
          address = "";
          phone = "";
          timezone = "";
          logo = ?"";
          publicSlug = "";
          bookingDefaults = { defaultTableDurationMinutes = 0; maxOnlinePartySize = 0; spaDefaultBufferMinutes = 0 };
          onboarding = { venueTypeDone = false; hoursDone = false; bookingDefaultsDone = false; slugDone = false; completedAt = ?0 };
          texts = [];
          openingHours = [];
          closures = [];
          createdAt = 0;
        })
        .payload("id", func v = v.id)
        .payload("venueType", func v = switch (v.venueType) { case (#restaurant) "restaurant"; case (#spa) "spa" })
        .payload("name", func v = v.name)
        .payload("address", func v = v.address)
        .payload("phone", func v = v.phone)
        .payload("timezone", func v = v.timezone)
        .payload("publicSlug", func v = v.publicSlug)
        .payload("defaultTableDurationMinutes", func v = v.bookingDefaults.defaultTableDurationMinutes)
        .payload("maxOnlinePartySize", func v = v.bookingDefaults.maxOnlinePartySize)
        .payload("spaDefaultBufferMinutes", func v = v.bookingDefaults.spaDefaultBufferMinutes)
        .payload("onboardingCompletedAt", func v = v.onboarding.completedAt)
        .payload("createdAt", func v = v.createdAt)
        .ownedByWith("id", isVenueMember)
        .controllerOrScoped()
        .build(),

      teamMembers.toEntityManual("teamMember", "TeamMember", "principal")
        .sample({ venueId = 0; principal = Principal.fromText("aaaaa-aa"); email = ""; role = #staff; joinedAt = 0 })
        .payload("principal", func m = m.principal)
        .payload("venueId", func m = m.venueId)
        .payload("email", func m = m.email)
        .payload("role", func m = switch (m.role) { case (#owner) "owner"; case (#manager) "manager"; case (#staff) "staff" })
        .payload("joinedAt", func m = m.joinedAt)
        .ownedByWith("venueId", isVenueMember)
        .controllerOrScoped()
        .build(),

      roomTables.toEntityManual("roomTable", "RoomTable", "id")
        .sample({
          id = 0;
          venueId = 0;
          name = "";
          room = "";
          minSeats = 0;
          maxSeats = 0;
          combinable = false;
          active = false;
          position = { x = 0; y = 0; width = 0; height = 0; rotation = 0; shape = #round };
        })
        .payload("id", func t = t.id)
        .payload("venueId", func t = t.venueId)
        .payload("name", func t = t.name)
        .payload("room", func t = t.room)
        .payload("minSeats", func t = t.minSeats)
        .payload("maxSeats", func t = t.maxSeats)
        .payload("combinable", func t = t.combinable)
        .payload("active", func t = t.active)
        .ownedByWith("venueId", isVenueMember)
        .controllerOrScoped()
        .build(),

      guests.toEntityManual("guest", "Guest", "id")
        .sample({
          id = 0;
          venueId = 0;
          name = "";
          phone = "";
          email = ?"";
          tags = [];
          vip = false;
          allergies = ?"";
          preferences = ?"";
          notes = ?"";
          marketingOptIn = false;
          marketingOptInAt = ?0;
          visitCount = 0;
          noShowCount = 0;
          lastVisitAt = ?0;
          createdAt = 0;
        })
        .payload("id", func g = g.id)
        .payload("venueId", func g = g.venueId)
        .payload("name", func g = g.name)
        .payload("phone", func g = g.phone)
        .payload("email", func g = g.email)
        .payload("tags", func g = g.tags.values().join(", "))
        .payload("vip", func g = g.vip)
        .payload("allergies", func g = g.allergies)
        .payload("preferences", func g = g.preferences)
        .payload("notes", func g = g.notes)
        .payload("marketingOptIn", func g = g.marketingOptIn)
        .payload("marketingOptInAt", func g = g.marketingOptInAt)
        .payload("visitCount", func g = g.visitCount)
        .payload("noShowCount", func g = g.noShowCount)
        .payload("lastVisitAt", func g = g.lastVisitAt)
        .payload("createdAt", func g = g.createdAt)
        .ownedByWith("venueId", isVenueMember)
        .controllerOrScoped()
        .build(),

      bookings.toEntityManual("booking", "Booking", "id")
        .sample({
          id = 0;
          venueId = 0;
          guestId = 0;
          tableId = ?0;
          startAt = 0;
          endAt = 0;
          partySize = 0;
          status = #confirmed;
          source = #staff;
          notes = ?"";
          cancelToken = "";
          statusHistory = [];
          createdAt = 0;
        })
        .payload("id", func b = b.id)
        .payload("venueId", func b = b.venueId)
        .payload("guestId", func b = b.guestId)
        .payload("tableId", func b = b.tableId)
        .payload("startAt", func b = b.startAt)
        .payload("endAt", func b = b.endAt)
        .payload("partySize", func b = b.partySize)
        .payload("status", func b = switch (b.status) {
          case (#pending) "pending";
          case (#confirmed) "confirmed";
          case (#seated) "seated";
          case (#finished) "finished";
          case (#noShow) "noShow";
          case (#cancelled) "cancelled";
        })
        .payload("source", func b = switch (b.source) {
          case (#online) "online";
          case (#phone) "phone";
          case (#walkIn) "walkIn";
          case (#staff) "staff";
        })
        .payload("notes", func b = b.notes)
        .payload("createdAt", func b = b.createdAt)
        .edge("guestId", "guest")
        .edge("tableId", "roomTable")
        .ownedByWith("venueId", isVenueMember)
        .controllerOrScoped()
        .build(),

      emailTemplates.toEntityManual("emailTemplate", "EmailTemplate", "id")
        .sample({ id = 0; venueId = 0; kind = #confirmation; language = #fr; subject = ""; body = "" })
        .payload("id", func t = t.id)
        .payload("venueId", func t = t.venueId)
        .payload("kind", func t = switch (t.kind) {
          case (#confirmation) "confirmation";
          case (#modification) "modification";
          case (#cancellation) "cancellation";
          case (#reminder) "reminder";
        })
        .payload("language", func t = switch (t.language) { case (#fr) "fr"; case (#en) "en" })
        .payload("subject", func t = t.subject)
        .payload("body", func t = t.body)
        .controllerOnly()
        .build(),

      auditLog.toEntityManual("auditEntry", "AuditEntry", "id")
        .sample({
          id = 0;
          venueId = 0;
          actorPrincipal = Principal.fromText("aaaaa-aa");
          action = "";
          entity = "";
          before = ?"";
          after = ?"";
          at = 0;
        })
        .payload("id", func a = a.id)
        .payload("venueId", func a = a.venueId)
        .payload("actorPrincipal", func a = a.actorPrincipal)
        .payload("action", func a = a.action)
        .payload("entity", func a = a.entity)
        .payload("before", func a = a.before)
        .payload("after", func a = a.after)
        .payload("at", func a = a.at)
        .controllerOnly()
        .build(),
    ];
  });
};
