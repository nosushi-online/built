import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Common "../types/common";
import Venues "../types/venues";
import Bookings "../types/bookings";
import Floorplan "../types/floorplan";
import Audit "../types/audit";
import FloorplanLib "../lib/floorplan";

mixin (
  venues : Map.Map<Common.VenueId, Venues.Venue>,
  teamMembers : Map.Map<Principal, Venues.TeamMember>,
  roomTables : Map.Map<Common.TableId, Floorplan.RoomTable>,
  bookings : Map.Map<Common.BookingId, Bookings.Booking>,
  auditLog : Map.Map<Common.AuditId, Audit.AuditEntry>,
  counters : FloorplanLib.Counters,
) {
  func floorplanState() : FloorplanLib.State = {
    venues;
    teamMembers;
    roomTables;
    bookings;
    auditLog;
    counters;
  };

  /// Rooms and tables of the caller's venue, for the floor plan editor.
  public query ({ caller }) func getFloorPlan() : async Floorplan.FloorPlan {
    let venueId = FloorplanLib.requireVenue(floorplanState(), caller);
    FloorplanLib.listTables(floorplanState(), venueId);
  };

  /// Live floor view for a date ("YYYY-MM-DD") and service label.
  public query ({ caller }) func getFloorView(
    date : Text,
    service : Text,
  ) : async Floorplan.FloorView {
    let venueId = FloorplanLib.requireVenue(floorplanState(), caller);
    FloorplanLib.floorView(floorplanState(), venueId, date, service);
  };

  /// Create a table in the caller's venue (owner or manager only).
  public shared ({ caller }) func createTable(
    input : Floorplan.TableInput,
  ) : async { #ok : Floorplan.RoomTable; #err : Floorplan.FloorError } {
    FloorplanLib.createTable(floorplanState(), caller, input);
  };

  /// Update a table of the caller's venue (owner or manager only).
  public shared ({ caller }) func updateTable(
    tableId : Common.TableId,
    update : Floorplan.TableUpdate,
  ) : async { #ok : Floorplan.RoomTable; #err : Floorplan.FloorError } {
    FloorplanLib.updateTable(floorplanState(), caller, tableId, update);
  };

  /// Deactivate a table of the caller's venue (owner or manager only).
  public shared ({ caller }) func deactivateTable(
    tableId : Common.TableId,
  ) : async { #ok : Floorplan.RoomTable; #err : Floorplan.FloorError } {
    FloorplanLib.deactivateTable(floorplanState(), caller, tableId);
  };

  /// Delete a table of the caller's venue (owner or manager only).
  public shared ({ caller }) func deleteTable(
    tableId : Common.TableId,
  ) : async { #ok : (); #err : Floorplan.FloorError } {
    FloorplanLib.deleteTable(floorplanState(), caller, tableId);
  };

  /// Seat a booking from the floor view.
  public shared ({ caller }) func seatBooking(
    bookingId : Common.BookingId,
  ) : async { #ok : Bookings.Booking; #err : Floorplan.FloorError } {
    FloorplanLib.seatBooking(floorplanState(), caller, bookingId);
  };

  /// Finish a booking from the floor view.
  public shared ({ caller }) func finishBooking(
    bookingId : Common.BookingId,
  ) : async { #ok : Bookings.Booking; #err : Floorplan.FloorError } {
    FloorplanLib.finishBooking(floorplanState(), caller, bookingId);
  };
};
