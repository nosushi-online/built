import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Common "../types/common";
import Venues "../types/venues";
import Bookings "../types/bookings";
import Floorplan "../types/floorplan";
import Audit "../types/audit";

module {
  public type Counters = {
    var nextVenueId : Nat;
    var nextTableId : Nat;
    var nextGuestId : Nat;
    var nextBookingId : Nat;
    var nextTemplateId : Nat;
    var nextAuditId : Nat;
  };

  public type State = {
    venues : Map.Map<Common.VenueId, Venues.Venue>;
    teamMembers : Map.Map<Principal, Venues.TeamMember>;
    roomTables : Map.Map<Common.TableId, Floorplan.RoomTable>;
    bookings : Map.Map<Common.BookingId, Bookings.Booking>;
    auditLog : Map.Map<Common.AuditId, Audit.AuditEntry>;
    counters : Counters;
  };

  // ---- Authorization ----

  /// The venue the caller belongs to, or `null` when unregistered.
  public func callerVenue(state : State, caller : Principal) : ?Common.VenueId {
    switch (state.teamMembers.get(caller)) {
      case (?member) { ?member.venueId };
      case null { null };
    };
  };

  /// The caller's venue, trapping when the caller is not a team member.
  public func requireVenue(state : State, caller : Principal) : Common.VenueId {
    callerVenue(state, caller) ?? Runtime.trap("Not a member of any venue");
  };

  /// The caller's venue, requiring owner or manager role.
  public func requireManager(state : State, caller : Principal) : Common.VenueId {
    let member = state.teamMembers.get(caller)
      ?? Runtime.trap("Not a member of any venue");
    switch (member.role) {
      case (#owner or #manager) { member.venueId };
      case (#staff) { Runtime.trap("Owner or manager role required") };
    };
  };

  // ---- Audit ----

  func recordAudit(
    state : State,
    venueId : Common.VenueId,
    caller : Principal,
    action : Text,
    entity : Text,
    before : ?Text,
    after : ?Text,
  ) {
    let id = state.counters.nextAuditId;
    state.counters.nextAuditId := id + 1;
    state.auditLog.add(id, {
      id;
      venueId;
      actorPrincipal = caller;
      action;
      entity;
      before;
      after;
      at = Time.now();
    });
  };

  // ---- Serialization for audit snapshots ----

  func positionText(p : Floorplan.FloorPosition) : Text {
    let shape = switch (p.shape) {
      case (#round) { "round" };
      case (#square) { "square" };
      case (#rectangle) { "rectangle" };
    };
    "x=" # p.x.toText() # ",y=" # p.y.toText()
      # ",w=" # p.width.toText() # ",h=" # p.height.toText()
      # ",rot=" # p.rotation.toText() # ",shape=" # shape;
  };

  func tableText(t : Floorplan.RoomTable) : Text {
    "name=" # t.name # ",room=" # t.room
      # ",min=" # t.minSeats.toText() # ",max=" # t.maxSeats.toText()
      # ",combinable=" # (if (t.combinable) { "true" } else { "false" })
      # ",active=" # (if (t.active) { "true" } else { "false" })
      # ",position={" # positionText(t.position) # "}";
  };

  // ---- Validation ----

  func validatePosition(p : Floorplan.FloorPosition) : ?Text {
    if (p.width == 0 or p.height == 0) {
      ?"Table width and height must be greater than zero";
    } else {
      null;
    };
  };

  func validateSeats(minSeats : Nat, maxSeats : Nat) : ?Text {
    if (maxSeats == 0) {
      ?"Maximum seats must be greater than zero";
    } else if (minSeats > maxSeats) {
      ?"Minimum seats cannot exceed maximum seats";
    } else {
      null;
    };
  };

  // ---- Queries ----

  /// All tables of a venue, for the floor plan editor.
  public func listTables(state : State, venueId : Common.VenueId) : Floorplan.FloorPlan {
    let tables = state.roomTables.values()
      .filter(func t = t.venueId == venueId)
      .toArray();
    { venueId; tables };
  };

  /// The live floor view for a date ("YYYY-MM-DD") and service label.
  public func floorView(
    state : State,
    venueId : Common.VenueId,
    date : Text,
    service : Text,
  ) : Floorplan.FloorView {
    let tables = state.roomTables.values()
      .filter(func t = t.venueId == venueId and t.active)
      .toArray();

    let dayBookings = state.bookings.values()
      .filter(func b = b.venueId == venueId and bookingOnDate(b, date))
      .toArray();

    let rows = tables.map(
      func t = do {
        let attached = dayBookings.find(func b = b.tableId == ?t.id);
        let status = switch (attached) {
          case (?b) { statusOf(b.status) };
          case null { #free };
        };
        { table = t; status; booking = attached };
      }
    );
    { venueId; date; service; tables = rows };
  };

  func statusOf(status : Bookings.BookingStatus) : Floorplan.TableStatus {
    switch (status) {
      case (#seated) { #seated };
      case (#finished) { #finished };
      case (#pending or #confirmed) { #booked };
      case (#noShow or #cancelled) { #free };
    };
  };

  /// Whether a booking's start timestamp falls on the given UTC date.
  func bookingOnDate(b : Bookings.Booking, date : Text) : Bool {
    let dayNs : Int = 86_400_000_000_000;
    let dayStart = b.startAt / dayNs * dayNs;
    dateOf(dayStart) == date;
  };

  /// Format a nanosecond timestamp as a UTC "YYYY-MM-DD" date.
  func dateOf(ns : Int) : Text {
    let dayNs : Int = 86_400_000_000_000;
    var days = ns / dayNs;
    if (days < 0) { days := 0 };
    // Civil-from-days (Howard Hinnant's algorithm).
    let z = days + 719_468;
    let era = z / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) { mp + 3 } else { mp - 9 };
    let year = if (m <= 2) { y + 1 } else { y };
    pad(year, 4) # "-" # pad(m, 2) # "-" # pad(d, 2);
  };

  func pad(n : Int, width : Nat) : Text {
    var s = n.toText();
    while (s.size() < width) {
      s := "0" # s;
    };
    s;
  };

  // ---- Mutations ----

  /// Create a table in the caller's venue.
  public func createTable(
    state : State,
    caller : Principal,
    input : Floorplan.TableInput,
  ) : { #ok : Floorplan.RoomTable; #err : Floorplan.FloorError } {
    let venueId = requireManager(state, caller);

    switch (validateSeats(input.minSeats, input.maxSeats)) {
      case (?msg) { return #err(#invalidInput(msg)) };
      case null {};
    };
    switch (validatePosition(input.position)) {
      case (?msg) { return #err(#invalidInput(msg)) };
      case null {};
    };

    let id = state.counters.nextTableId;
    state.counters.nextTableId := id + 1;
    let table : Floorplan.RoomTable = {
      id;
      venueId;
      name = input.name;
      room = input.room;
      minSeats = input.minSeats;
      maxSeats = input.maxSeats;
      combinable = input.combinable;
      active = true;
      position = input.position;
    };
    state.roomTables.add(id, table);
    recordAudit(state, venueId, caller, "create", "table", null, ?tableText(table));
    #ok(table);
  };

  /// Update a table of the caller's venue.
  public func updateTable(
    state : State,
    caller : Principal,
    tableId : Common.TableId,
    update : Floorplan.TableUpdate,
  ) : { #ok : Floorplan.RoomTable; #err : Floorplan.FloorError } {
    let venueId = requireManager(state, caller);
    let existing = switch (state.roomTables.get(tableId)) {
      case (?t) { t };
      case null { return #err(#notFound(tableId)) };
    };
    if (existing.venueId != venueId) {
      return #err(#notFound(tableId));
    };

    let minSeats = update.minSeats ?? existing.minSeats;
    let maxSeats = update.maxSeats ?? existing.maxSeats;
    switch (validateSeats(minSeats, maxSeats)) {
      case (?msg) { return #err(#invalidInput(msg)) };
      case null {};
    };
    let position = update.position ?? existing.position;
    switch (validatePosition(position)) {
      case (?msg) { return #err(#invalidInput(msg)) };
      case null {};
    };

    let updated : Floorplan.RoomTable = {
      id = existing.id;
      venueId = existing.venueId;
      name = update.name ?? existing.name;
      room = update.room ?? existing.room;
      minSeats;
      maxSeats;
      combinable = update.combinable ?? existing.combinable;
      active = update.active ?? existing.active;
      position;
    };
    state.roomTables.add(tableId, updated);
    recordAudit(
      state,
      venueId,
      caller,
      "update",
      "table",
      ?tableText(existing),
      ?tableText(updated),
    );
    #ok(updated);
  };

  /// Deactivate a table of the caller's venue.
  public func deactivateTable(
    state : State,
    caller : Principal,
    tableId : Common.TableId,
  ) : { #ok : Floorplan.RoomTable; #err : Floorplan.FloorError } {
    let venueId = requireManager(state, caller);
    let existing = switch (state.roomTables.get(tableId)) {
      case (?t) { t };
      case null { return #err(#notFound(tableId)) };
    };
    if (existing.venueId != venueId) {
      return #err(#notFound(tableId));
    };
    let updated : Floorplan.RoomTable = { existing with active = false };
    state.roomTables.add(tableId, updated);
    recordAudit(
      state,
      venueId,
      caller,
      "deactivate",
      "table",
      ?tableText(existing),
      ?tableText(updated),
    );
    #ok(updated);
  };

  /// Delete a table of the caller's venue.
  public func deleteTable(
    state : State,
    caller : Principal,
    tableId : Common.TableId,
  ) : { #ok : (); #err : Floorplan.FloorError } {
    let venueId = requireManager(state, caller);
    let existing = switch (state.roomTables.get(tableId)) {
      case (?t) { t };
      case null { return #err(#notFound(tableId)) };
    };
    if (existing.venueId != venueId) {
      return #err(#notFound(tableId));
    };
    state.roomTables.remove(tableId);
    recordAudit(
      state,
      venueId,
      caller,
      "delete",
      "table",
      ?tableText(existing),
      null,
    );
    #ok(());
  };

  // ---- Booking status transitions from the floor view ----

  func transitionBooking(
    state : State,
    caller : Principal,
    venueId : Common.VenueId,
    bookingId : Common.BookingId,
    target : Bookings.BookingStatus,
    action : Text,
  ) : { #ok : Bookings.Booking; #err : Floorplan.FloorError } {
    let existing = switch (state.bookings.get(bookingId)) {
      case (?b) { b };
      case null { return #err(#notFound(bookingId)) };
    };
    if (existing.venueId != venueId) {
      return #err(#notFound(bookingId));
    };
    let updated : Bookings.Booking = {
      existing with
      status = target;
      statusHistory = existing.statusHistory.concat([
        { status = target; at = Time.now(); by = ?caller }
      ]);
    };
    state.bookings.add(bookingId, updated);
    recordAudit(
      state,
      venueId,
      caller,
      action,
      "booking",
      ?statusText(existing.status),
      ?statusText(target),
    );
    #ok(updated);
  };

  func statusText(s : Bookings.BookingStatus) : Text {
    switch (s) {
      case (#pending) { "pending" };
      case (#confirmed) { "confirmed" };
      case (#seated) { "seated" };
      case (#finished) { "finished" };
      case (#noShow) { "noShow" };
      case (#cancelled) { "cancelled" };
    };
  };

  /// Seat a booking from the floor view.
  public func seatBooking(
    state : State,
    caller : Principal,
    bookingId : Common.BookingId,
  ) : { #ok : Bookings.Booking; #err : Floorplan.FloorError } {
    let venueId = requireVenue(state, caller);
    transitionBooking(state, caller, venueId, bookingId, #seated, "seat");
  };

  /// Finish a booking from the floor view.
  public func finishBooking(
    state : State,
    caller : Principal,
    bookingId : Common.BookingId,
  ) : { #ok : Bookings.Booking; #err : Floorplan.FloorError } {
    let venueId = requireVenue(state, caller);
    transitionBooking(state, caller, venueId, bookingId, #finished, "finish");
  };
};
