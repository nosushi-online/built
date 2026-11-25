import Common "common";

module {
  public type VenueId = Common.VenueId;
  public type GuestId = Common.GuestId;
  public type Timestamp = Common.Timestamp;

  /// A guest record, scoped to a venue.
  public type Guest = {
    id : GuestId;
    venueId : VenueId;
    name : Text;
    phone : Text;
    email : ?Text;
    tags : [Text];
    vip : Bool;
    allergies : ?Text;
    preferences : ?Text;
    notes : ?Text;
    marketingOptIn : Bool;
    marketingOptInAt : ?Timestamp;
    visitCount : Nat;
    noShowCount : Nat;
    lastVisitAt : ?Timestamp;
    createdAt : Timestamp;
  };
};
