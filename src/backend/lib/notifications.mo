import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Bookings "../types/bookings";
import Guests "../types/guests";
import Venues "../types/venues";
import Notifications "../types/notifications";
import Audit "../types/audit";

module {
  public type TemplateKind = Notifications.TemplateKind;
  public type Language = Common.Language;
  public type EmailTemplate = Notifications.EmailTemplate;
  public type ReminderLog = Notifications.ReminderLog;

  /// Sample values used to render a template preview.
  public type SampleData = {
    guestName : Text;
    venueName : Text;
    dateTime : Text;
    partySize : Nat;
    confirmUrl : Text;
  };

  /// Everything needed to render one transactional email.
  public type RenderContext = {
    guestName : Text;
    venueName : Text;
    dateTime : Text;
    partySize : Nat;
    confirmUrl : Text;
  };

  public type Counters = {
    var nextTemplateId : Nat;
    var nextAuditId : Nat;
  };

  public type TemplateStore = Map.Map<Common.TemplateId, EmailTemplate>;
  public type ReminderStore = Map.Map<Common.BookingId, ReminderLog>;
  public type AuditStore = Map.Map<Common.AuditId, Audit.AuditEntry>;

  // ---- Template defaults ----

  public func defaultSubject(kind : TemplateKind, language : Language) : Text {
    switch (kind, language) {
      case (#confirmation, #fr) { "Votre réservation est confirmée" };
      case (#confirmation, #en) { "Your booking is confirmed" };
      case (#modification, #fr) { "Votre réservation a été modifiée" };
      case (#modification, #en) { "Your booking has been updated" };
      case (#cancellation, #fr) { "Votre réservation a été annulée" };
      case (#cancellation, #en) { "Your booking has been cancelled" };
      case (#reminder, #fr) { "Rappel de votre réservation" };
      case (#reminder, #en) { "Reminder about your booking" };
    };
  };

  public func defaultBody(kind : TemplateKind, language : Language) : Text {
    switch (kind, language) {
      case (#confirmation, #fr) {
        "Bonjour {{guestName}},\n\nVotre réservation au {{venueName}} le {{dateTime}} pour {{partySize}} personne(s) est confirmée.\n\nPour confirmer ou annuler : {{confirmUrl}}"
      };
      case (#confirmation, #en) {
        "Hello {{guestName}},\n\nYour booking at {{venueName}} on {{dateTime}} for {{partySize}} guest(s) is confirmed.\n\nTo confirm or cancel: {{confirmUrl}}"
      };
      case (#modification, #fr) {
        "Bonjour {{guestName}},\n\nVotre réservation au {{venueName}} a été modifiée. Nouveau créneau : {{dateTime}}, {{partySize}} personne(s).\n\nPour confirmer ou annuler : {{confirmUrl}}"
      };
      case (#modification, #en) {
        "Hello {{guestName}},\n\nYour booking at {{venueName}} has been updated. New slot: {{dateTime}}, {{partySize}} guest(s).\n\nTo confirm or cancel: {{confirmUrl}}"
      };
      case (#cancellation, #fr) {
        "Bonjour {{guestName}},\n\nVotre réservation au {{venueName}} du {{dateTime}} a été annulée.\n\nNous espérons vous revoir bientôt."
      };
      case (#cancellation, #en) {
        "Hello {{guestName}},\n\nYour booking at {{venueName}} on {{dateTime}} has been cancelled.\n\nWe hope to see you again soon."
      };
      case (#reminder, #fr) {
        "Bonjour {{guestName}},\n\nNous vous rappelons votre réservation au {{venueName}} le {{dateTime}} pour {{partySize}} personne(s).\n\nPour confirmer ou annuler : {{confirmUrl}}"
      };
      case (#reminder, #en) {
        "Hello {{guestName}},\n\nThis is a reminder of your booking at {{venueName}} on {{dateTime}} for {{partySize}} guest(s).\n\nTo confirm or cancel: {{confirmUrl}}"
      };
    };
  };

  // ---- Template storage ----

  /// Returns the template for a venue/kind/language, seeding a default on first use.
  public func getOrSeedTemplate(
    templates : TemplateStore,
    counters : Counters,
    venueId : Common.VenueId,
    kind : TemplateKind,
    language : Language,
  ) : EmailTemplate {
    switch (findTemplate(templates, venueId, kind, language)) {
      case (?t) { t };
      case null {
        let id = counters.nextTemplateId;
        counters.nextTemplateId := id + 1;
        let t : EmailTemplate = {
          id;
          venueId;
          kind;
          language;
          subject = defaultSubject(kind, language);
          body = defaultBody(kind, language);
        };
        templates.add(id, t);
        t;
      };
    };
  };

  public func findTemplate(
    templates : TemplateStore,
    venueId : Common.VenueId,
    kind : TemplateKind,
    language : Language,
  ) : ?EmailTemplate {
    templates.values().find(func t = t.venueId == venueId and t.kind == kind and t.language == language);
  };

  /// All templates for a venue, seeding defaults for every kind and language.
  public func listTemplates(
    templates : TemplateStore,
    counters : Counters,
    venueId : Common.VenueId,
  ) : [EmailTemplate] {
    let kinds : [TemplateKind] = [#confirmation, #modification, #cancellation, #reminder];
    let languages : [Language] = [#fr, #en];
    for (kind in kinds.values()) {
      for (language in languages.values()) {
        ignore getOrSeedTemplate(templates, counters, venueId, kind, language);
      };
    };
    templates.values().filter(func t = t.venueId == venueId).toArray();
  };

  public func updateTemplate(
    templates : TemplateStore,
    id : Common.TemplateId,
    subject : Text,
    body : Text,
  ) : ?EmailTemplate {
    switch (templates.get(id)) {
      case (?t) {
        let updated : EmailTemplate = { t with subject; body };
        templates.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  // ---- Rendering ----

  func replaceAll(haystack : Text, needle : Text, replacement : Text) : Text {
    if (needle.isEmpty()) { return haystack };
    var result = "";
    var rest = haystack;
    label scan loop {
      let parts = rest.split(#text needle);
      switch (parts.next()) {
        case (?head) {
          result := result # head;
          switch (parts.next()) {
            case (?tail) {
              result := result # replacement;
              rest := tail;
            };
            case null { break scan };
          };
        };
        case null { break scan };
      };
    };
    result # rest;
  };

  public func render(text : Text, ctx : RenderContext) : Text {
    let withGuest = replaceAll(text, "{{guestName}}", ctx.guestName);
    let withVenue = replaceAll(withGuest, "{{venueName}}", ctx.venueName);
    let withDate = replaceAll(withVenue, "{{dateTime}}", ctx.dateTime);
    let withParty = replaceAll(withDate, "{{partySize}}", ctx.partySize.toText());
    replaceAll(withParty, "{{confirmUrl}}", ctx.confirmUrl);
  };

  public func sampleContext() : RenderContext {
    {
      guestName = "Camille Martin";
      venueName = "Le Petit Demo";
      dateTime = "2026-06-12 19:30";
      partySize = 2;
      confirmUrl = "https://example.com/booking/sample-token";
    };
  };

  // ---- Reminder slots ----

  public func hasSentSlot(logs : ReminderStore, bookingId : Common.BookingId, slot : Text) : Bool {
    switch (logs.get(bookingId)) {
      case (?log) { log.sentSlots.any(func s = s == slot) };
      case null { false };
    };
  };

  public func markSlotSent(logs : ReminderStore, bookingId : Common.BookingId, slot : Text) {
    switch (logs.get(bookingId)) {
      case (?log) {
        if (not log.sentSlots.any(func s = s == slot)) {
          logs.add(bookingId, { log with sentSlots = log.sentSlots.concat([slot]) });
        };
      };
      case null {
        logs.add(bookingId, { bookingId; sentSlots = [slot] });
      };
    };
  };

  // ---- Booking email helpers ----

  public func confirmUrl(publicSlug : Text, cancelToken : Text) : Text {
    "https://" # publicSlug # ".caffeine.ai/booking/" # cancelToken;
  };

  public func formatDateTime(ts : Common.Timestamp) : Text {
    ts.toText() # " ns UTC";
  };

  public func contextFor(
    booking : Bookings.Booking,
    guest : ?Guests.Guest,
    venue : ?Venues.Venue,
  ) : RenderContext {
    let guestName = switch (guest) { case (?g) { g.name }; case null { "Client" } };
    let venueName = switch (venue) { case (?v) { v.name }; case null { "" } };
    let slug = switch (venue) { case (?v) { v.publicSlug }; case null { "" } };
    {
      guestName;
      venueName;
      dateTime = formatDateTime(booking.startAt);
      partySize = booking.partySize;
      confirmUrl = confirmUrl(slug, booking.cancelToken);
    };
  };

  public func guestLanguage(guest : ?Guests.Guest) : Language {
    ignore guest;
    #fr;
  };

  // ---- Audit ----

  public func recordAudit(
    auditLog : AuditStore,
    counters : Counters,
    venueId : Common.VenueId,
    actorPrincipal : Principal,
    action : Text,
    entity : Text,
    before : ?Text,
    after : ?Text,
  ) {
    let id = counters.nextAuditId;
    counters.nextAuditId := id + 1;
    auditLog.add(id, {
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
};
