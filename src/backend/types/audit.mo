import Common "common";

module {
  public type VenueId = Common.VenueId;
  public type AuditId = Common.AuditId;
  public type Timestamp = Common.Timestamp;

  /// An append-only audit log entry, scoped to a venue.
  public type AuditEntry = {
    id : AuditId;
    venueId : VenueId;
    actorPrincipal : Principal;
    action : Text;
    entity : Text;
    before : ?Text;
    after : ?Text;
    at : Timestamp;
  };
};
