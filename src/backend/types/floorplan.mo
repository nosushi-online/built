import Common "common";
import Bookings "bookings";

module {
  public type VenueId = Common.VenueId;
  public type TableId = Common.TableId;
  public type BookingId = Common.BookingId;
  public type Timestamp = Common.Timestamp;

  /// Shape of a table on the floor plan.
  public type TableShape = { #round; #square; #rectangle };

  /// Position and shape of a table on the floor plan canvas.
  public type FloorPosition = {
    x : Nat;
    y : Nat;
    width : Nat;
    height : Nat;
    rotation : Nat;
    shape : TableShape;
  };

  /// A room or table belonging to a venue.
  public type RoomTable = {
    id : TableId;
    venueId : VenueId;
    name : Text;
    room : Text;
    minSeats : Nat;
    maxSeats : Nat;
    combinable : Bool;
    active : Bool;
    position : FloorPosition;
  };

  /// Input used to create a table.
  public type TableInput = {
    name : Text;
    room : Text;
    minSeats : Nat;
    maxSeats : Nat;
    combinable : Bool;
    position : FloorPosition;
  };

  /// Input used to update a table; `null` leaves a field unchanged.
  public type TableUpdate = {
    name : ?Text;
    room : ?Text;
    minSeats : ?Nat;
    maxSeats : ?Nat;
    combinable : ?Bool;
    active : ?Bool;
    position : ?FloorPosition;
  };

  /// Live status of a table on the floor view, derived from bookings.
  public type TableStatus = { #free; #booked; #seated; #finished };

  /// A table with its live status and the booking attached to it, if any.
  public type FloorTable = {
    table : RoomTable;
    status : TableStatus;
    booking : ?Bookings.Booking;
  };

  /// The floor plan of a venue: its tables with positions.
  public type FloorPlan = {
    venueId : VenueId;
    tables : [RoomTable];
  };

  /// The live floor view for one date and service.
  public type FloorView = {
    venueId : VenueId;
    date : Text;
    service : Text;
    tables : [FloorTable];
  };

  /// Errors returned by floor plan operations.
  public type FloorError = {
    #notAuthorized;
    #notFound : TableId;
    #invalidInput : Text;
  };
};
