import Common "common";

module {
  public type VenueId = Common.VenueId;
  public type BookingId = Common.BookingId;
  public type GuestId = Common.GuestId;
  public type TableId = Common.TableId;
  public type Timestamp = Common.Timestamp;

  /// Lifecycle status of a booking.
  public type BookingStatus = {
    #pending;
    #confirmed;
    #seated;
    #finished;
    #noShow;
    #cancelled;
  };

  /// Where the booking originated.
  public type BookingSource = { #online; #phone; #walkIn; #staff };

  /// One entry in a booking's status history.
  public type StatusHistoryEntry = {
    status : BookingStatus;
    at : Timestamp;
    by : ?Principal;
  };

  /// A booking, scoped to a venue.
  public type Booking = {
    id : BookingId;
    venueId : VenueId;
    guestId : GuestId;
    tableId : ?TableId;
    startAt : Timestamp;
    endAt : Timestamp;
    partySize : Nat;
    status : BookingStatus;
    source : BookingSource;
    notes : ?Text;
    cancelToken : Text;
    statusHistory : [StatusHistoryEntry];
    createdAt : Timestamp;
  };
};
