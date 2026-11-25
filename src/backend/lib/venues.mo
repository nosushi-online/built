import Array "mo:core/Array";
import Char "mo:core/Char";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Venues "../types/venues";
import Audit "../types/audit";
import Bookings "../types/bookings";
import Floorplan "../types/floorplan";
import Guests "../types/guests";

module {
  public type VenueId = Common.VenueId;
  public type Timestamp = Common.Timestamp;
  public type VenueType = Common.VenueType;
  public type Language = Common.Language;
  public type TeamRole = Venues.TeamRole;
  public type Venue = Venues.Venue;
  public type TeamMember = Venues.TeamMember;
  public type TeamInvite = Venues.TeamInvite;
  public type BookingDefaults = Venues.BookingDefaults;
  public type DayHours = Venues.DayHours;
  public type ClosureDate = Venues.ClosureDate;
  public type VenueTexts = Venues.VenueTexts;
  public type OnboardingState = Venues.OnboardingState;
  public type AuditEntry = Audit.AuditEntry;

  /// Shared mutable state the venues domain reads and writes.
  public type Counters = {
    var nextVenueId : Nat;
    var nextTableId : Nat;
    var nextGuestId : Nat;
    var nextBookingId : Nat;
    var nextTemplateId : Nat;
    var nextAuditId : Nat;
  };

  public type State = {
    venues : Map.Map<VenueId, Venue>;
    teamMembers : Map.Map<Principal, TeamMember>;
    teamInvites : Map.Map<Text, TeamInvite>;
    roomTables : Map.Map<Common.TableId, Floorplan.RoomTable>;
    guests : Map.Map<Common.GuestId, Guests.Guest>;
    bookings : Map.Map<Common.BookingId, Bookings.Booking>;
    auditLog : Map.Map<Common.AuditId, AuditEntry>;
    counters : Counters;
  };

  /// Caller-visible failure of a venues operation.
  public type VenueError = {
    #notAuthenticated;
    #notMember;
    #notAuthorized;
    #venueNotFound : VenueId;
    #slugTaken : Text;
    #invalidSlug : Text;
    #invalidInput : Text;
    #inviteNotFound : Text;
    #emailMismatch;
    #cannotRemoveOwner;
  };

  /// Permission a caller needs for a venue operation.
  public type Permission = {
    #manageMembers;
    #manageVenue;
    #work;
  };

  // ---- Helpers ----

  public func defaultBookingDefaults(venueType : VenueType) : BookingDefaults {
    {
      defaultTableDurationMinutes = 90;
      maxOnlinePartySize = 8;
      spaDefaultBufferMinutes = switch (venueType) {
        case (#spa) { 15 };
        case (#restaurant) { 0 };
      };
    };
  };

  public func emptyOnboarding() : OnboardingState {
    {
      venueTypeDone = false;
      hoursDone = false;
      bookingDefaultsDone = false;
      slugDone = false;
      completedAt = null;
    };
  };

  public func normalizeSlug(raw : Text) : Text {
    raw.trim(#predicate(func c = c.isWhitespace())).toLower();
  };

  public func isValidSlug(slug : Text) : Bool {
    let s = normalizeSlug(slug);
    if (s.size() == 0 or s.size() > 60) { return false };
    var ok = true;
    for (c in s.chars()) {
      let isLower = c >= 'a' and c <= 'z';
      let isDigit = c >= '0' and c <= '9';
      let isDash = c == '-';
      if (not (isLower or isDigit or isDash)) { ok := false };
    };
    ok;
  };

  public func slugTaken(state : State, slug : Text, exceptVenue : ?VenueId) : Bool {
    let s = normalizeSlug(slug);
    state.venues.values().any(
      func v = normalizeSlug(v.publicSlug) == s and (switch (exceptVenue) {
        case (?id) { v.id != id };
        case null { true };
      })
    );
  };

  public func roleOf(state : State, caller : Principal, venueId : VenueId) : ?TeamRole {
    switch (state.teamMembers.get(caller)) {
      case (?m) { if (m.venueId == venueId) { ?m.role } else { null } };
      case null { null };
    };
  };

  public func can(role : TeamRole, permission : Permission) : Bool {
    switch (permission) {
      case (#manageMembers) { role == #owner };
      case (#manageVenue) { role == #owner or role == #manager };
      case (#work) { true };
    };
  };

  public func requireMember(state : State, caller : Principal, venueId : VenueId) : TeamRole {
    switch (roleOf(state, caller, venueId)) {
      case (?r) { r };
      case null { throwError(#notMember) };
    };
  };

  public func requirePermission(state : State, caller : Principal, venueId : VenueId, permission : Permission) : TeamRole {
    let role = requireMember(state, caller, venueId);
    if (not can(role, permission)) { throwError(#notAuthorized) };
    role;
  };

  public func throwError(e : VenueError) : None {
    switch (e) {
      case (#notAuthenticated) { Runtime.trap("Not authenticated") };
      case (#notMember) { Runtime.trap("Not a member of this venue") };
      case (#notAuthorized) { Runtime.trap("Not authorized for this action") };
      case (#venueNotFound(_)) { Runtime.trap("Venue not found") };
      case (#slugTaken(_)) { Runtime.trap("Slug already used by another venue") };
      case (#invalidSlug(_)) { Runtime.trap("Invalid slug") };
      case (#invalidInput(m)) { Runtime.trap(m) };
      case (#inviteNotFound(_)) { Runtime.trap("Invite not found") };
      case (#emailMismatch) { Runtime.trap("Signed-in email does not match the invited address") };
      case (#cannotRemoveOwner) { Runtime.trap("Cannot remove the venue owner") };
    };
  };

  public func recordAudit(
    state : State,
    venueId : VenueId,
    actorPrincipal : Principal,
    action : Text,
    entity : Text,
    before : ?Text,
    after : ?Text,
  ) : () {
    let id = state.counters.nextAuditId;
    state.counters.nextAuditId := id + 1;
    state.auditLog.add(id, {
      id;
      venueId;
      actorPrincipal;
      action;
      entity;
      before;
      after;
      at = Time.now();
    });
  };

  public func venueOf(state : State, venueId : VenueId) : Venue {
    switch (state.venues.get(venueId)) {
      case (?v) { v };
      case null { throwError(#venueNotFound(venueId)) };
    };
  };

  public func listVenuesFor(state : State, caller : Principal) : [Venue] {
    let out = List.empty<Venue>();
    for (v in state.venues.values()) {
      switch (roleOf(state, caller, v.id)) {
        case (?_) { out.add(v) };
        case null {};
      };
    };
    out.toArray();
  };

  public func listMembers(state : State, venueId : VenueId) : [TeamMember] {
    let out = List.empty<TeamMember>();
    for (m in state.teamMembers.values()) {
      if (m.venueId == venueId) { out.add(m) };
    };
    out.toArray();
  };

  public func listInvites(state : State, venueId : VenueId) : [TeamInvite] {
    let out = List.empty<TeamInvite>();
    for (i in state.teamInvites.values()) {
      if (i.venueId == venueId) { out.add(i) };
    };
    out.toArray();
  };

  public func recentAudit(state : State, venueId : VenueId, limit : Nat) : [AuditEntry] {
    let out = List.empty<AuditEntry>();
    for (e in state.auditLog.values()) {
      if (e.venueId == venueId) { out.add(e) };
    };
    let sorted = out.toArray().sort(
      func (a, b) = Nat.compare(b.id, a.id)
    );
    if (sorted.size() <= limit) { sorted } else {
      sorted.sliceToArray(0, limit.toInt());
    };
  };

  // ---- Venue creation and update ----

  public type CreateVenueInput = {
    venueType : VenueType;
    name : Text;
    address : Text;
    phone : Text;
    timezone : ?Text;
    logo : ?Text;
    publicSlug : Text;
    bookingDefaults : ?BookingDefaults;
    texts : [VenueTexts];
  };

  public func createVenue(state : State, caller : Principal, input : CreateVenueInput) : Venue {
    if (caller.isAnonymous()) { throwError(#notAuthenticated) };
    if (input.name.trim(#predicate(func c = c.isWhitespace())).size() == 0) { throwError(#invalidInput("Venue name is required")) };
    let slug = normalizeSlug(input.publicSlug);
    if (not isValidSlug(slug)) { throwError(#invalidSlug(slug)) };
    if (slugTaken(state, slug, null)) { throwError(#slugTaken(slug)) };

    let id = state.counters.nextVenueId;
    state.counters.nextVenueId := id + 1;

    let venue : Venue = {
      id;
      venueType = input.venueType;
      name = input.name;
      address = input.address;
      phone = input.phone;
      timezone = input.timezone ?? "Europe/Paris";
      logo = input.logo;
      publicSlug = slug;
      bookingDefaults = input.bookingDefaults ?? defaultBookingDefaults(input.venueType);
      onboarding = {
        venueTypeDone = true;
        hoursDone = false;
        bookingDefaultsDone = false;
        slugDone = true;
        completedAt = null;
      };
      texts = input.texts;
      openingHours = [];
      closures = [];
      createdAt = Time.now();
    };
    state.venues.add(id, venue);

    state.teamMembers.add(caller, {
      venueId = id;
      principal = caller;
      email = "";
      role = #owner;
      joinedAt = Time.now();
    });

    recordAudit(state, id, caller, "venue.create", "venue", null, ?venue.name);
    venue;
  };

  public type UpdateVenueInput = {
    venueType : ?VenueType;
    name : ?Text;
    address : ?Text;
    phone : ?Text;
    timezone : ?Text;
    logo : ?Text;
    bookingDefaults : ?BookingDefaults;
    texts : ?[VenueTexts];
  };

  public func updateVenue(state : State, caller : Principal, venueId : VenueId, input : UpdateVenueInput) : Venue {
    ignore requirePermission(state, caller, venueId, #manageVenue);
    let current = venueOf(state, venueId);
    let updated : Venue = {
      current with
      venueType = input.venueType ?? current.venueType;
      name = input.name ?? current.name;
      address = input.address ?? current.address;
      phone = input.phone ?? current.phone;
      timezone = input.timezone ?? current.timezone;
      logo = switch (input.logo) { case (?l) { ?l }; case null { current.logo } };
      bookingDefaults = input.bookingDefaults ?? current.bookingDefaults;
      texts = input.texts ?? current.texts;
    };
    state.venues.add(venueId, updated);
    recordAudit(state, venueId, caller, "venue.update", "venue", ?current.name, ?updated.name);
    updated;
  };

  // ---- Onboarding ----

  public func getOnboarding(state : State, caller : Principal, venueId : VenueId) : OnboardingState {
    ignore requireMember(state, caller, venueId);
    venueOf(state, venueId).onboarding;
  };

  public type OnboardingPatch = {
    venueTypeDone : ?Bool;
    hoursDone : ?Bool;
    bookingDefaultsDone : ?Bool;
    slugDone : ?Bool;
  };

  public func saveOnboarding(state : State, caller : Principal, venueId : VenueId, patch : OnboardingPatch) : OnboardingState {
    ignore requirePermission(state, caller, venueId, #manageVenue);
    let current = venueOf(state, venueId);
    let ob = current.onboarding;
    let next : OnboardingState = {
      venueTypeDone = patch.venueTypeDone ?? ob.venueTypeDone;
      hoursDone = patch.hoursDone ?? ob.hoursDone;
      bookingDefaultsDone = patch.bookingDefaultsDone ?? ob.bookingDefaultsDone;
      slugDone = patch.slugDone ?? ob.slugDone;
      completedAt = ob.completedAt;
    };
    let allDone = next.venueTypeDone and next.hoursDone and next.bookingDefaultsDone and next.slugDone;
    let finalState : OnboardingState = {
      next with
      completedAt = if (allDone) { ?(ob.completedAt ?? Time.now()) } else { ob.completedAt };
    };
    state.venues.add(venueId, { current with onboarding = finalState });
    recordAudit(state, venueId, caller, "venue.onboarding", "venue", null, null);
    finalState;
  };

  // ---- Opening hours and closures ----

  public func setOpeningHours(state : State, caller : Principal, venueId : VenueId, hours : [DayHours]) : [DayHours] {
    ignore requirePermission(state, caller, venueId, #manageVenue);
    for (d in hours.values()) {
      if (d.weekday > 6) { throwError(#invalidInput("Weekday must be 0..6")) };
      if (d.services.size() > 2) { throwError(#invalidInput("At most two services per day")) };
      for (s in d.services.values()) {
        if (s.openMinute >= s.closeMinute or s.closeMinute > 1440) {
          throwError(#invalidInput("Invalid service window"));
        };
      };
    };
    let current = venueOf(state, venueId);
    state.venues.add(venueId, { current with openingHours = hours });
    recordAudit(state, venueId, caller, "venue.hours", "venue", null, null);
    hours;
  };

  public func addClosure(state : State, caller : Principal, venueId : VenueId, closure : ClosureDate) : [ClosureDate] {
    ignore requirePermission(state, caller, venueId, #manageVenue);
    if (closure.date.size() != 10) { throwError(#invalidInput("Closure date must be YYYY-MM-DD")) };
    let current = venueOf(state, venueId);
    let next = current.closures.concat([closure]);
    state.venues.add(venueId, { current with closures = next });
    recordAudit(state, venueId, caller, "venue.closure.add", "venue", null, ?closure.date);
    next;
  };

  public func removeClosure(state : State, caller : Principal, venueId : VenueId, date : Text) : [ClosureDate] {
    ignore requirePermission(state, caller, venueId, #manageVenue);
    let current = venueOf(state, venueId);
    let next = current.closures.filter(func c = c.date != date);
    state.venues.add(venueId, { current with closures = next });
    recordAudit(state, venueId, caller, "venue.closure.remove", "venue", ?date, null);
    next;
  };

  // ---- Slug ----

  public func isSlugAvailable(state : State, slug : Text) : Bool {
    let s = normalizeSlug(slug);
    isValidSlug(s) and not slugTaken(state, s, null);
  };

  public func setSlug(state : State, caller : Principal, venueId : VenueId, slug : Text) : Venue {
    ignore requirePermission(state, caller, venueId, #manageVenue);
    let s = normalizeSlug(slug);
    if (not isValidSlug(s)) { throwError(#invalidSlug(s)) };
    if (slugTaken(state, s, ?venueId)) { throwError(#slugTaken(s)) };
    let current = venueOf(state, venueId);
    let updated : Venue = {
      current with
      publicSlug = s;
      onboarding = { current.onboarding with slugDone = true };
    };
    state.venues.add(venueId, updated);
    recordAudit(state, venueId, caller, "venue.slug", "venue", ?current.publicSlug, ?s);
    updated;
  };

  // ---- Team ----

  public func inviteMember(state : State, caller : Principal, venueId : VenueId, email : Text, role : TeamRole) : TeamInvite {
    ignore requirePermission(state, caller, venueId, #manageMembers);
    let normalized = email.trim(#predicate(func c = c.isWhitespace())).toLower();
    if (normalized.size() == 0) { throwError(#invalidInput("Email is required")) };
    let invite : TeamInvite = {
      venueId;
      email = normalized;
      role;
      invitedBy = caller;
      createdAt = Time.now();
    };
    state.teamInvites.add(normalized, invite);
    recordAudit(state, venueId, caller, "team.invite", "team", null, ?normalized);
    invite;
  };

  public func acceptInvite(state : State, caller : Principal, email : Text) : TeamMember {
    if (caller.isAnonymous()) { throwError(#notAuthenticated) };
    let normalized = email.trim(#predicate(func c = c.isWhitespace())).toLower();
    let invite = switch (state.teamInvites.get(normalized)) {
      case (?i) { i };
      case null { throwError(#inviteNotFound(normalized)) };
    };
    let member : TeamMember = {
      venueId = invite.venueId;
      principal = caller;
      email = normalized;
      role = invite.role;
      joinedAt = Time.now();
    };
    state.teamMembers.add(caller, member);
    state.teamInvites.remove(normalized);
    recordAudit(state, invite.venueId, caller, "team.accept", "team", null, ?normalized);
    member;
  };

  public func changeMemberRole(state : State, caller : Principal, venueId : VenueId, target : Principal, role : TeamRole) : TeamMember {
    ignore requirePermission(state, caller, venueId, #manageMembers);
    let member = switch (state.teamMembers.get(target)) {
      case (?m) { if (m.venueId == venueId) { m } else { throwError(#notMember) } };
      case null { throwError(#notMember) };
    };
    if (member.role == #owner and role != #owner) { throwError(#cannotRemoveOwner) };
    let updated : TeamMember = { member with role };
    state.teamMembers.add(target, updated);
    recordAudit(state, venueId, caller, "team.role", "team", ?member.email, ?roleText(role));
    updated;
  };

  public func removeMember(state : State, caller : Principal, venueId : VenueId, target : Principal) : () {
    ignore requirePermission(state, caller, venueId, #manageMembers);
    let member = switch (state.teamMembers.get(target)) {
      case (?m) { if (m.venueId == venueId) { m } else { throwError(#notMember) } };
      case null { throwError(#notMember) };
    };
    if (member.role == #owner) { throwError(#cannotRemoveOwner) };
    state.teamMembers.remove(target);
    recordAudit(state, venueId, caller, "team.remove", "team", ?member.email, null);
  };

  public func roleText(role : TeamRole) : Text {
    switch (role) {
      case (#owner) { "owner" };
      case (#manager) { "manager" };
      case (#staff) { "staff" };
    };
  };

  // ---- Demo seed ----

  public func seedDemo(state : State) : () {
    if (state.venues.values().any(func v = v.publicSlug == "le-petit-demo")) { return };
    let demoOwner = Principal.fromText("2vxsx-fae");
    let id = state.counters.nextVenueId;
    state.counters.nextVenueId := id + 1;
    let now = Time.now();
    let hours : [DayHours] = Array.tabulate(7, func i = {
      weekday = i;
      services = if (i == 0) { [] } else {
        [{ openMinute = 720; closeMinute = 900 }, { openMinute = 1140; closeMinute = 1380 }];
      };
    });
    let venue : Venue = {
      id;
      venueType = #restaurant;
      name = "Le Petit Demo";
      address = "12 Rue de la Demo, 75001 Paris";
      phone = "+33100000000";
      timezone = "Europe/Paris";
      logo = null;
      publicSlug = "le-petit-demo";
      bookingDefaults = defaultBookingDefaults(#restaurant);
      onboarding = {
        venueTypeDone = true;
        hoursDone = true;
        bookingDefaultsDone = true;
        slugDone = true;
        completedAt = ?now;
      };
      texts = [
        { language = #fr; name = "Le Petit Demo"; description = "Restaurant de démonstration." },
        { language = #en; name = "Le Petit Demo"; description = "Demo restaurant." },
      ];
      openingHours = hours;
      closures = [];
      createdAt = now;
    };
    state.venues.add(id, venue);
    recordAudit(state, id, demoOwner, "venue.seed", "venue", null, ?venue.name);

    // Rooms and tables.
    let tables : [(Text, Text, Nat, Nat, Nat, Nat)] = [
      ("T1", "Salle", 2, 2, 120, 120),
      ("T2", "Salle", 2, 4, 320, 120),
      ("T3", "Salle", 4, 6, 520, 120),
      ("T4", "Terrasse", 2, 4, 120, 320),
      ("T5", "Terrasse", 4, 8, 320, 320),
    ];
    for ((name, room, minSeats, maxSeats, x, y) in tables.values()) {
      let tableId = state.counters.nextTableId;
      state.counters.nextTableId := tableId + 1;
      state.roomTables.add(tableId, {
        id = tableId;
        venueId = id;
        name;
        room;
        minSeats;
        maxSeats;
        combinable = true;
        active = true;
        position = {
          x;
          y;
          width = 100;
          height = 100;
          rotation = 0;
          shape = #round;
        };
      });
    };

    // Guests.
    let guestSeeds : [(Text, Text, ?Text, Bool)] = [
      ("Camille Martin", "+33600000001", ?"camille.martin@example.com", true),
      ("Lucas Bernard", "+33600000002", ?"lucas.bernard@example.com", false),
      ("Emma Dubois", "+33600000003", null, false),
      ("Hugo Petit", "+33600000004", ?"hugo.petit@example.com", true),
      ("Léa Moreau", "+33600000005", null, false),
    ];
    let guestIds = List.empty<Common.GuestId>();
    for ((name, phone, email, vip) in guestSeeds.values()) {
      let guestId = state.counters.nextGuestId;
      state.counters.nextGuestId := guestId + 1;
      state.guests.add(guestId, {
        id = guestId;
        venueId = id;
        name;
        phone;
        email;
        tags = if (vip) { ["vip"] } else { [] };
        vip;
        allergies = null;
        preferences = null;
        notes = null;
        marketingOptIn = false;
        marketingOptInAt = null;
        visitCount = 0;
        noShowCount = 0;
        lastVisitAt = null;
        createdAt = now;
      });
      guestIds.add(guestId);
    };

    // A few months of bookings: 2 per day for the last 90 days.
    let dayNs : Int = 86_400_000_000_000;
    let guestArr = guestIds.toArray();
    let tableArr = state.roomTables.values().filter(func t = t.venueId == id).toArray();
    if (tableArr.size() == 0 or guestArr.size() == 0) { return };
    var d = 0;
    while (d < 90) {
      let dayStart = now - (d.toInt() * dayNs);
      var slot = 0;
      while (slot < 2) {
        let bookingId = state.counters.nextBookingId;
        state.counters.nextBookingId := bookingId + 1;
        let startAt = dayStart - (dayStart % dayNs) + (720 + slot * 180).toInt() * 60_000_000_000;
        let guestId = guestArr[(d + slot) % guestArr.size()];
        let tableId = tableArr[(d + slot) % tableArr.size()].id;
        state.bookings.add(bookingId, {
          id = bookingId;
          venueId = id;
          guestId;
          tableId = ?tableId;
          startAt;
          endAt = startAt + 90 * 60_000_000_000;
          partySize = 2 + ((d + slot) % 4);
          status = #finished;
          source = #online;
          notes = null;
          cancelToken = "demo-" # bookingId.toText();
          statusHistory = [{ status = #finished; at = startAt; by = null }];
          createdAt = startAt;
        });
        slot += 1;
      };
      d += 1;
    };
  };
};
