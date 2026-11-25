module {
  /// Identifier of a venue (tenant). Every record in the app is scoped to one.
  public type VenueId = Nat;

  /// Identifier of a booking.
  public type BookingId = Nat;

  /// Identifier of a guest.
  public type GuestId = Nat;

  /// Identifier of a room or table.
  public type TableId = Nat;

  /// Identifier of an audit log entry.
  public type AuditId = Nat;

  /// Identifier of an email template.
  public type TemplateId = Nat;

  /// UTC timestamp in nanoseconds since the Unix epoch (`Time.now()`).
  public type Timestamp = Int;

  /// Money amount in integer euro cents.
  public type Cents = Nat;

  /// IANA timezone name, e.g. "Europe/Paris".
  public type Timezone = Text;

  /// BCP-47 language tag used for venue-authored texts and email templates.
  public type Language = { #fr; #en };

  /// Venue kind: restaurant or spa.
  public type VenueType = { #restaurant; #spa };
};
