import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // ---- Inlined types (migrations must be self-contained) ----

  type VenueId = Nat;
  type BookingId = Nat;
  type GuestId = Nat;
  type TableId = Nat;
  type AuditId = Nat;
  type TemplateId = Nat;
  type Timestamp = Int;
  type Timezone = Text;
  type Language = { #fr; #en };
  type VenueType = { #restaurant; #spa };
  type Weekday = Nat;

  type ServiceWindow = { openMinute : Nat; closeMinute : Nat };
  type DayHours = { weekday : Weekday; services : [ServiceWindow] };
  type ClosureDate = { date : Text; reason : ?Text };
  type BookingDefaults = {
    defaultTableDurationMinutes : Nat;
    maxOnlinePartySize : Nat;
    spaDefaultBufferMinutes : Nat;
  };
  type VenueTexts = { language : Language; name : Text; description : Text };
  type OnboardingState = {
    venueTypeDone : Bool;
    hoursDone : Bool;
    bookingDefaultsDone : Bool;
    slugDone : Bool;
    completedAt : ?Timestamp;
  };
  type Venue = {
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

  type TeamRole = { #owner; #manager; #staff };
  type TeamMember = {
    venueId : VenueId;
    principal : Principal;
    email : Text;
    role : TeamRole;
    joinedAt : Timestamp;
  };
  type TeamInvite = {
    venueId : VenueId;
    email : Text;
    role : TeamRole;
    invitedBy : Principal;
    createdAt : Timestamp;
  };

  type TableShape = { #round; #square; #rectangle };
  type FloorPosition = {
    x : Nat;
    y : Nat;
    width : Nat;
    height : Nat;
    rotation : Nat;
    shape : TableShape;
  };
  type RoomTable = {
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

  type Guest = {
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

  type BookingStatus = {
    #pending;
    #confirmed;
    #seated;
    #finished;
    #noShow;
    #cancelled;
  };
  type BookingSource = { #online; #phone; #walkIn; #staff };
  type StatusHistoryEntry = {
    status : BookingStatus;
    at : Timestamp;
    by : ?Principal;
  };
  type Booking = {
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

  type TemplateKind = { #confirmation; #modification; #cancellation; #reminder };
  type EmailTemplate = {
    id : TemplateId;
    venueId : VenueId;
    kind : TemplateKind;
    language : Language;
    subject : Text;
    body : Text;
  };
  type ReminderLog = { bookingId : BookingId; sentSlots : [Text] };

  type AuditEntry = {
    id : AuditId;
    venueId : VenueId;
    actorPrincipal : Principal;
    action : Text;
    entity : Text;
    before : ?Text;
    after : ?Text;
    at : Timestamp;
  };

  type Counters = {
    var nextVenueId : Nat;
    var nextTableId : Nat;
    var nextGuestId : Nat;
    var nextBookingId : Nat;
    var nextTemplateId : Nat;
    var nextAuditId : Nat;
  };

  // ---- Migration ----

  public type OldActor = {};

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    venues : Map.Map<VenueId, Venue>;
    teamMembers : Map.Map<Principal, TeamMember>;
    teamInvites : Map.Map<Text, TeamInvite>;
    roomTables : Map.Map<TableId, RoomTable>;
    guests : Map.Map<GuestId, Guest>;
    bookings : Map.Map<BookingId, Booking>;
    emailTemplates : Map.Map<TemplateId, EmailTemplate>;
    reminderLogs : Map.Map<BookingId, ReminderLog>;
    auditLog : Map.Map<AuditId, AuditEntry>;
    counters : Counters;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      venues = Map.empty();
      teamMembers = Map.empty();
      teamInvites = Map.empty();
      roomTables = Map.empty();
      guests = Map.empty();
      bookings = Map.empty();
      emailTemplates = Map.empty();
      reminderLogs = Map.empty();
      auditLog = Map.empty();
      counters = {
        var nextVenueId = 0;
        var nextTableId = 0;
        var nextGuestId = 0;
        var nextBookingId = 0;
        var nextTemplateId = 0;
        var nextAuditId = 0;
      };
    };
  };
};
