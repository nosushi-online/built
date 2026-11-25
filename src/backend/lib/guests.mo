import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Guests "../types/guests";
import Venues "../types/venues";
import Bookings "../types/bookings";
import Audit "../types/audit";

module {
  public type Guest = Guests.Guest;
  public type GuestId = Common.GuestId;
  public type VenueId = Common.VenueId;
  public type Timestamp = Common.Timestamp;
  public type TeamRole = Venues.TeamRole;

  public type Counters = {
    var nextVenueId : Nat;
    var nextTableId : Nat;
    var nextGuestId : Nat;
    var nextBookingId : Nat;
    var nextTemplateId : Nat;
    var nextAuditId : Nat;
  };

  public type State = {
    guests : Map.Map<GuestId, Guest>;
    bookings : Map.Map<Common.BookingId, Bookings.Booking>;
    teamMembers : Map.Map<Principal, Venues.TeamMember>;
    auditLog : Map.Map<Common.AuditId, Audit.AuditEntry>;
    counters : Counters;
  };

  public type GuestError = {
    #notAuthorized;
    #notFound;
    #invalidInput : Text;
  };

  public type GuestFilters = {
    search : ?Text;
    tags : [Text];
    vipOnly : Bool;
    hasAllergies : Bool;
    optInOnly : Bool;
    minVisits : ?Nat;
    lastVisitBefore : ?Timestamp;
  };

  public type GuestInput = {
    name : Text;
    phone : Text;
    email : ?Text;
    tags : [Text];
    vip : Bool;
    allergies : ?Text;
    preferences : ?Text;
    notes : ?Text;
    marketingOptIn : Bool;
  };

  public type GuestProfile = {
    guest : Guest;
    bookings : [Bookings.Booking];
  };

  public type ColumnMapping = {
    name : Nat;
    phone : Nat;
    email : ?Nat;
    tags : ?Nat;
    vip : ?Nat;
    allergies : ?Nat;
    preferences : ?Nat;
    notes : ?Nat;
    marketingOptIn : ?Nat;
  };

  public type ImportResult = {
    imported : Nat;
    skipped : Nat;
  };

  public type MergeResult = {
    kept : Guest;
    mergedBookings : Nat;
  };

  public type PrivacyExport = {
    guest : Guest;
    bookings : [Bookings.Booking];
    json : Text;
  };

  // ---- Authorization ----

  /// The venue the caller belongs to, or `null` when unregistered.
  public func callerVenue(state : State, caller : Principal) : ?VenueId {
    switch (state.teamMembers.get(caller)) {
      case (?member) { ?member.venueId };
      case null { null };
    };
  };

  /// The caller's venue, trapping when the caller is not a team member.
  public func requireVenue(state : State, caller : Principal) : VenueId {
    callerVenue(state, caller) ?? Runtime.trap("Not a member of any venue");
  };

  /// The caller's venue, requiring owner or manager role.
  public func requireManager(state : State, caller : Principal) : VenueId {
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
    venueId : VenueId,
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

  // ---- Automatic tags ----

  let tagRegular = "Regular";
  let tagAtRisk = "At risk";
  let tagNoShowRisk = "No-show risk";

  let ninetyDaysNs : Int = 7_776_000_000_000_000;

  public func autoTags(guest : Guest, now : Timestamp) : [Text] {
    let out = List.empty<Text>();
    if (guest.visitCount >= 3) { out.add(tagRegular) };
    switch (guest.lastVisitAt) {
      case (?last) { if (now - last > ninetyDaysNs) { out.add(tagAtRisk) } };
      case null {};
    };
    if (guest.noShowCount > 0) { out.add(tagNoShowRisk) };
    out.toArray();
  };

  public func withAutoTags(guest : Guest, now : Timestamp) : Guest {
    let computed = autoTags(guest, now);
    let merged = List.empty<Text>();
    for (t in guest.tags.values()) { merged.add(t) };
    for (t in computed.values()) {
      if (not merged.contains(t)) { merged.add(t) };
    };
    { guest with tags = merged.toArray() };
  };

  // ---- Queries ----

  public func listGuests(
    state : State,
    caller : Principal,
    filters : GuestFilters,
  ) : [Guest] {
    let venueId = requireVenue(state, caller);
    let now = Time.now();
    let term = switch (filters.search) {
      case (?s) { ?s.toLower() };
      case null { null };
    };
    let out = List.empty<Guest>();
    for (g in state.guests.values()) {
      if (g.venueId == venueId) {
        var keep = true;
        if (filters.vipOnly and not g.vip) { keep := false };
        if (filters.hasAllergies and g.allergies == null) { keep := false };
        if (filters.optInOnly and not g.marketingOptIn) { keep := false };
        if (filters.tags.size() > 0) {
          let hasAll = filters.tags.all(func t = g.tags.contains(t));
          if (not hasAll) { keep := false };
        };
        switch (filters.minVisits) {
          case (?min) { if (g.visitCount < min) { keep := false } };
          case null {};
        };
        switch (filters.lastVisitBefore) {
          case (?cut) {
            switch (g.lastVisitAt) {
              case (?last) { if (last >= cut) { keep := false } };
              case null {};
            };
          };
          case null {};
        };
        switch (term) {
          case (?t) {
            let hay = (g.name # " " # g.phone # " " # (g.email ?? "")).toLower();
            if (not hay.contains(#text t)) { keep := false };
          };
          case null {};
        };
        if (keep) { out.add(withAutoTags(g, now)) };
      };
    };
    out.toArray();
  };

  public func getProfile(
    state : State,
    caller : Principal,
    guestId : GuestId,
  ) : ?GuestProfile {
    let venueId = requireVenue(state, caller);
    switch (state.guests.get(guestId)) {
      case (?g) {
        if (g.venueId != venueId) { return null };
        let history = List.empty<Bookings.Booking>();
        for (b in state.bookings.values()) {
          if (b.guestId == guestId) { history.add(b) };
        };
        ?{ guest = withAutoTags(g, Time.now()); bookings = history.toArray() };
      };
      case null { null };
    };
  };

  // ---- Mutations ----

  public func createGuest(
    state : State,
    caller : Principal,
    input : GuestInput,
  ) : Result.Result<Guest, GuestError> {
    let venueId = requireVenue(state, caller);
    if (input.name.size() == 0 or input.phone.size() == 0) {
      return #err(#invalidInput("name and phone are required"));
    };
    let now = Time.now();
    let id = state.counters.nextGuestId;
    state.counters.nextGuestId := id + 1;
    let guest : Guest = {
      id;
      venueId;
      name = input.name;
      phone = input.phone;
      email = input.email;
      tags = input.tags;
      vip = input.vip;
      allergies = input.allergies;
      preferences = input.preferences;
      notes = input.notes;
      marketingOptIn = input.marketingOptIn;
      marketingOptInAt = if (input.marketingOptIn) { ?now } else { null };
      visitCount = 0;
      noShowCount = 0;
      lastVisitAt = null;
      createdAt = now;
    };
    state.guests.add(id, guest);
    recordAudit(state, venueId, caller, "guest.create", "guest", null, ?guest.name);
    #ok(withAutoTags(guest, now));
  };

  public func updateGuest(
    state : State,
    caller : Principal,
    guestId : GuestId,
    input : GuestInput,
  ) : Result.Result<Guest, GuestError> {
    let venueId = requireVenue(state, caller);
    switch (state.guests.get(guestId)) {
      case (?existing) {
        if (existing.venueId != venueId) { return #err(#notFound) };
        let now = Time.now();
        let optInAt = if (input.marketingOptIn) {
          switch (existing.marketingOptInAt) {
            case (?t) { ?t };
            case null { ?now };
          };
        } else { null };
        let updated : Guest = {
          existing with
          name = input.name;
          phone = input.phone;
          email = input.email;
          tags = input.tags;
          vip = input.vip;
          allergies = input.allergies;
          preferences = input.preferences;
          notes = input.notes;
          marketingOptIn = input.marketingOptIn;
          marketingOptInAt = optInAt;
        };
        state.guests.add(guestId, updated);
        recordAudit(state, venueId, caller, "guest.update", "guest", ?existing.name, ?updated.name);
        #ok(withAutoTags(updated, now));
      };
      case null { #err(#notFound) };
    };
  };

  public func mergeGuests(
    state : State,
    caller : Principal,
    keepId : GuestId,
    mergeId : GuestId,
  ) : Result.Result<MergeResult, GuestError> {
    let venueId = requireManager(state, caller);
    if (keepId == mergeId) { return #err(#invalidInput("cannot merge a guest into itself")) };
    let keep = switch (state.guests.get(keepId)) {
      case (?g) { g };
      case null { return #err(#notFound) };
    };
    let dup = switch (state.guests.get(mergeId)) {
      case (?g) { g };
      case null { return #err(#notFound) };
    };
    if (keep.venueId != venueId or dup.venueId != venueId) { return #err(#notFound) };

    // Move bookings to the kept guest.
    var moved = 0;
    for (b in state.bookings.values()) {
      if (b.guestId == mergeId) {
        state.bookings.add(b.id, { b with guestId = keepId });
        moved += 1;
      };
    };

    // Merge tags.
    let tags = List.empty<Text>();
    for (t in keep.tags.values()) { tags.add(t) };
    for (t in dup.tags.values()) {
      if (not tags.contains(t)) { tags.add(t) };
    };

    let lastVisitAt = switch (keep.lastVisitAt, dup.lastVisitAt) {
      case (?a, ?b) { ?(if (a > b) { a } else { b }) };
      case (?a, null) { ?a };
      case (null, ?b) { ?b };
      case (null, null) { null };
    };

    let merged : Guest = {
      keep with
      tags = tags.toArray();
      vip = keep.vip or dup.vip;
      email = switch (keep.email) { case (?e) { ?e }; case null { dup.email } };
      allergies = switch (keep.allergies) { case (?a) { ?a }; case null { dup.allergies } };
      preferences = switch (keep.preferences) { case (?p) { ?p }; case null { dup.preferences } };
      notes = switch (keep.notes) { case (?n) { ?n }; case null { dup.notes } };
      marketingOptIn = keep.marketingOptIn or dup.marketingOptIn;
      marketingOptInAt = switch (keep.marketingOptInAt, dup.marketingOptInAt) {
        case (?a, ?b) { ?(if (a > b) { a } else { b }) };
        case (?a, null) { ?a };
        case (null, ?b) { ?b };
        case (null, null) { null };
      };
      visitCount = keep.visitCount + dup.visitCount;
      noShowCount = keep.noShowCount + dup.noShowCount;
      lastVisitAt;
    };
    state.guests.add(keepId, merged);
    state.guests.remove(mergeId);
    recordAudit(state, venueId, caller, "guest.merge", "guest", ?dup.name, ?keep.name);
    #ok({ kept = withAutoTags(merged, Time.now()); mergedBookings = moved });
  };

  // ---- CSV ----

  func splitLine(line : Text) : [Text] {
    line.split(#char ',').toArray();
  };

  func trimCell(v : Text) : Text {
    v.trim(#predicate(func c = c == ' ' or c == '\r' or c == '\t'));
  };

  func parseBool(v : ?Text) : Bool {
    switch (v) {
      case (?s) {
        let t = trimCell(s).toLower();
        t == "true" or t == "1" or t == "yes" or t == "oui";
      };
      case null { false };
    };
  };

  func cell(row : [Text], idx : ?Nat) : ?Text {
    switch (idx) {
      case (?i) {
        if (i < row.size()) {
          let v = trimCell(row[i]);
          if (v.size() == 0) { null } else { ?v };
        } else { null };
      };
      case null { null };
    };
  };

  public func importCsv(
    state : State,
    caller : Principal,
    csv : Text,
    mapping : ColumnMapping,
  ) : Result.Result<ImportResult, GuestError> {
    let venueId = requireManager(state, caller);
    let lines = csv.split(#char '\n').toArray();
    var imported = 0;
    var skipped = 0;
    var first = true;
    for (line in lines.values()) {
      let trimmed = trimCell(line);
      if (trimmed.size() > 0) {
        if (first) {
          first := false;
        } else {
          let row = splitLine(trimmed);
          let name = cell(row, ?mapping.name);
          let phone = cell(row, ?mapping.phone);
          switch (name, phone) {
            case (?n, ?p) {
              let now = Time.now();
              let id = state.counters.nextGuestId;
              state.counters.nextGuestId := id + 1;
              let tags = switch (cell(row, mapping.tags)) {
                case (?t) { t.split(#char ';').toArray().filter(func x = x.size() > 0) };
                case null { [] };
              };
              let optIn = parseBool(cell(row, mapping.marketingOptIn));
              state.guests.add(id, {
                id;
                venueId;
                name = n;
                phone = p;
                email = cell(row, mapping.email);
                tags;
                vip = parseBool(cell(row, mapping.vip));
                allergies = cell(row, mapping.allergies);
                preferences = cell(row, mapping.preferences);
                notes = cell(row, mapping.notes);
                marketingOptIn = optIn;
                marketingOptInAt = if (optIn) { ?now } else { null };
                visitCount = 0;
                noShowCount = 0;
                lastVisitAt = null;
                createdAt = now;
              });
              imported += 1;
            };
            case _ { skipped += 1 };
          };
        };
      };
    };
    recordAudit(state, venueId, caller, "guest.import", "guest", null, ?(imported.toText() # " imported"));
    #ok({ imported; skipped });
  };

  func csvEscape(v : Text) : Text {
    let hasComma = v.contains(#char ',');
    let hasQuote = v.contains(#char '\"');
    let hasNewline = v.contains(#char '\n');
    if (hasComma or hasQuote or hasNewline) {
      let doubled = v.replace(#char '\"', "\"\"");
      let quote = "\"";
      quote # doubled # quote;
    } else { v };
  };

  public func exportCsv(
    state : State,
    caller : Principal,
  ) : Result.Result<Text, GuestError> {
    let venueId = requireManager(state, caller);
    let rows = List.empty<Text>();
    rows.add("id,name,phone,email,tags,vip,allergies,preferences,notes,marketingOptIn,visitCount,noShowCount");
    for (g in state.guests.values()) {
      if (g.venueId == venueId) {
        rows.add(
          g.id.toText() # "," #
          csvEscape(g.name) # "," #
          csvEscape(g.phone) # "," #
          csvEscape(g.email ?? "") # "," #
          csvEscape(g.tags.values().join(";")) # "," #
          (if (g.vip) { "true" } else { "false" }) # "," #
          csvEscape(g.allergies ?? "") # "," #
          csvEscape(g.preferences ?? "") # "," #
          csvEscape(g.notes ?? "") # "," #
          (if (g.marketingOptIn) { "true" } else { "false" }) # "," #
          g.visitCount.toText() # "," #
          g.noShowCount.toText()
        );
      };
    };
    recordAudit(state, venueId, caller, "guest.export", "guest", null, null);
    #ok(rows.values().join("\n"));
  };

  // ---- Privacy ----

  func jsonEscape(v : Text) : Text {
    let noQuotes = v.replace(#char '\"', "'");
    noQuotes.replace(#char '\n', " ");
  };

  public func exportGuestData(
    state : State,
    caller : Principal,
    guestId : GuestId,
  ) : Result.Result<PrivacyExport, GuestError> {
    let venueId = requireVenue(state, caller);
    switch (state.guests.get(guestId)) {
      case (?g) {
        if (g.venueId != venueId) { return #err(#notFound) };
        let history = List.empty<Bookings.Booking>();
        for (b in state.bookings.values()) {
          if (b.guestId == guestId) { history.add(b) };
        };
        let json = "{\"id\":" # g.id.toText() #
          ",\"name\":\"" # jsonEscape(g.name) #
          "\",\"phone\":\"" # jsonEscape(g.phone) #
          "\",\"email\":\"" # jsonEscape(g.email ?? "") #
          "\",\"tags\":\"" # jsonEscape(g.tags.values().join(";")) #
          "\",\"vip\":" # (if (g.vip) { "true" } else { "false" }) #
          ",\"allergies\":\"" # jsonEscape(g.allergies ?? "") #
          "\",\"preferences\":\"" # jsonEscape(g.preferences ?? "") #
          "\",\"notes\":\"" # jsonEscape(g.notes ?? "") #
          "\",\"visitCount\":" # g.visitCount.toText() #
          ",\"noShowCount\":" # g.noShowCount.toText() #
          ",\"marketingOptIn\":" # (if (g.marketingOptIn) { "true" } else { "false" }) #
          ",\"bookings\":" # history.size().toText() # "}";
        recordAudit(state, venueId, caller, "guest.exportData", "guest", null, ?g.name);
        #ok({ guest = g; bookings = history.toArray(); json });
      };
      case null { #err(#notFound) };
    };
  };

  public func anonymizeGuest(
    state : State,
    caller : Principal,
    guestId : GuestId,
  ) : Result.Result<Guest, GuestError> {
    let venueId = requireManager(state, caller);
    switch (state.guests.get(guestId)) {
      case (?g) {
        if (g.venueId != venueId) { return #err(#notFound) };
        let anon : Guest = {
          g with
          name = "Anonymized guest";
          phone = "";
          email = null;
          tags = [];
          allergies = null;
          preferences = null;
          notes = null;
          marketingOptIn = false;
          marketingOptInAt = null;
        };
        state.guests.add(guestId, anon);
        recordAudit(state, venueId, caller, "guest.anonymize", "guest", ?g.name, null);
        #ok(anon);
      };
      case null { #err(#notFound) };
    };
  };

  public func deleteGuest(
    state : State,
    caller : Principal,
    guestId : GuestId,
  ) : Result.Result<(), GuestError> {
    let venueId = requireManager(state, caller);
    switch (state.guests.get(guestId)) {
      case (?g) {
        if (g.venueId != venueId) { return #err(#notFound) };
        state.guests.remove(guestId);
        recordAudit(state, venueId, caller, "guest.delete", "guest", ?g.name, null);
        #ok(());
      };
      case null { #err(#notFound) };
    };
  };
};
