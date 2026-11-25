import Common "common";

module {
  public type VenueId = Common.VenueId;
  public type Timestamp = Common.Timestamp;
  public type Timezone = Common.Timezone;
  public type Language = Common.Language;
  public type VenueType = Common.VenueType;

  /// Weekday index, 0 = Monday … 6 = Sunday.
  public type Weekday = Nat;

  /// One service window within a day, expressed in minutes from midnight.
  public type ServiceWindow = {
    openMinute : Nat;
    closeMinute : Nat;
  };

  /// Opening hours for one weekday: up to two services per day.
  public type DayHours = {
    weekday : Weekday;
    services : [ServiceWindow];
  };

  /// A date the venue is closed, as a UTC date string "YYYY-MM-DD".
  public type ClosureDate = {
    date : Text;
    reason : ?Text;
  };

  /// Booking defaults applied to new bookings for a venue.
  public type BookingDefaults = {
    defaultTableDurationMinutes : Nat;
    maxOnlinePartySize : Nat;
    spaDefaultBufferMinutes : Nat;
  };

  /// Venue-authored texts per language.
  public type VenueTexts = {
    language : Language;
    name : Text;
    description : Text;
  };

  /// Onboarding completion state of the 4-step wizard.
  public type OnboardingState = {
    venueTypeDone : Bool;
    hoursDone : Bool;
    bookingDefaultsDone : Bool;
    slugDone : Bool;
    completedAt : ?Timestamp;
  };

  /// A tenant venue.
  public type Venue = {
    id : VenueId;
    venueType : VenueType;
    name : Text;
    address : Text;
    phone : Text;
    timezone : Timezone;
    logo : ?Text;
    publicSlug : Text;
    bookingDefaults : BookingDefaults;
    onboarding : OnboardingState;
    texts : [VenueTexts];
    openingHours : [DayHours];
    closures : [ClosureDate];
    createdAt : Timestamp;
  };

  /// Role of a team member within a venue.
  public type TeamRole = { #owner; #manager; #staff };

  /// An accepted team membership.
  public type TeamMember = {
    venueId : VenueId;
    principal : Principal;
    email : Text;
    role : TeamRole;
    joinedAt : Timestamp;
  };

  /// A pending invite, accepted only by the matching email.
  public type TeamInvite = {
    venueId : VenueId;
    email : Text;
    role : TeamRole;
    invitedBy : Principal;
    createdAt : Timestamp;
  };
};
