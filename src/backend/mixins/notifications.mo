import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

import AccessControl "mo:caffeineai-authorization/access-control";
import EmailClient "mo:caffeineai-email/emailClient";

import Common "../types/common";
import Bookings "../types/bookings";
import Guests "../types/guests";
import Venues "../types/venues";
import Notifications "../types/notifications";
import Audit "../types/audit";
import NotificationsLib "../lib/notifications";

mixin (
  accessControlState : AccessControl.AccessControlState,
  venues : Map.Map<Common.VenueId, Venues.Venue>,
  teamMembers : Map.Map<Principal, Venues.TeamMember>,
  guests : Map.Map<Common.GuestId, Guests.Guest>,
  bookings : Map.Map<Common.BookingId, Bookings.Booking>,
  emailTemplates : Map.Map<Common.TemplateId, Notifications.EmailTemplate>,
  reminderLogs : Map.Map<Common.BookingId, Notifications.ReminderLog>,
  auditLog : Map.Map<Common.AuditId, Audit.AuditEntry>,
  counters : NotificationsLib.Counters,
) {
  // ---- Authorization helpers ----

  func requireManager(caller : Principal, venueId : Common.VenueId) : Venues.TeamMember {
    let member = switch (teamMembers.get(caller)) {
      case (?m) { m };
      case null { Runtime.trap("Not a team member") };
    };
    if (member.venueId != venueId) {
      Runtime.trap("Not a member of this venue");
    };
    switch (member.role) {
      case (#owner) {};
      case (#manager) {};
      case (#staff) { Runtime.trap("Owner or manager role required") };
    };
    member;
  };

  func venueOfTemplate(id : Common.TemplateId) : Common.VenueId {
    switch (emailTemplates.get(id)) {
      case (?t) { t.venueId };
      case null { Runtime.trap("Template not found") };
    };
  };

  // ---- Template queries ----

  public shared ({ caller }) func listEmailTemplates(venueId : Common.VenueId) : async [Notifications.EmailTemplate] {
    ignore requireManager(caller, venueId);
    NotificationsLib.listTemplates(emailTemplates, counters, venueId);
  };

  public shared ({ caller }) func getEmailTemplate(
    venueId : Common.VenueId,
    kind : Notifications.TemplateKind,
    language : Common.Language,
  ) : async Notifications.EmailTemplate {
    ignore requireManager(caller, venueId);
    NotificationsLib.getOrSeedTemplate(emailTemplates, counters, venueId, kind, language);
  };

  public shared ({ caller }) func updateEmailTemplate(
    id : Common.TemplateId,
    subject : Text,
    body : Text,
  ) : async Notifications.EmailTemplate {
    let venueId = venueOfTemplate(id);
    ignore requireManager(caller, venueId);
    let before = switch (emailTemplates.get(id)) {
      case (?t) { ?(t.subject # "\n" # t.body) };
      case null { null };
    };
    let updated = switch (NotificationsLib.updateTemplate(emailTemplates, id, subject, body)) {
      case (?t) { t };
      case null { Runtime.trap("Template not found") };
    };
    NotificationsLib.recordAudit(
      auditLog,
      counters,
      venueId,
      caller,
      "update_email_template",
      "emailTemplate:" # id.toText(),
      before,
      ?(subject # "\n" # body),
    );
    updated;
  };

  public shared ({ caller }) func previewEmailTemplate(
    id : Common.TemplateId,
  ) : async { subject : Text; body : Text } {
    let venueId = venueOfTemplate(id);
    ignore requireManager(caller, venueId);
    let template = switch (emailTemplates.get(id)) {
      case (?t) { t };
      case null { Runtime.trap("Template not found") };
    };
    let ctx = NotificationsLib.sampleContext();
    {
      subject = NotificationsLib.render(template.subject, ctx);
      body = NotificationsLib.render(template.body, ctx);
    };
  };

  public shared ({ caller }) func sendTestEmail(
    id : Common.TemplateId,
    recipient : Text,
  ) : async EmailClient.SendResult {
    let venueId = venueOfTemplate(id);
    ignore requireManager(caller, venueId);
    let template = switch (emailTemplates.get(id)) {
      case (?t) { t };
      case null { Runtime.trap("Template not found") };
    };
    let ctx = NotificationsLib.sampleContext();
    let subject = NotificationsLib.render(template.subject, ctx);
    let body = NotificationsLib.render(template.body, ctx);
    let result = await EmailClient.sendServiceEmail("no-reply", [recipient], subject, body);
    NotificationsLib.recordAudit(
      auditLog,
      counters,
      venueId,
      caller,
      "send_test_email",
      "emailTemplate:" # id.toText(),
      null,
      ?recipient,
    );
    result;
  };

  // ---- Booking lifecycle emails ----

  public shared ({ caller }) func sendBookingEmail(
    bookingId : Common.BookingId,
    kind : Notifications.TemplateKind,
  ) : async EmailClient.SendResult {
    let booking = switch (bookings.get(bookingId)) {
      case (?b) { b };
      case null { Runtime.trap("Booking not found") };
    };
    ignore requireManager(caller, booking.venueId);
    let guest = guests.get(booking.guestId);
    let venue = venues.get(booking.venueId);
    let language = NotificationsLib.guestLanguage(guest);
    let template = NotificationsLib.getOrSeedTemplate(emailTemplates, counters, booking.venueId, kind, language);
    let ctx = NotificationsLib.contextFor(booking, guest, venue);
    let subject = NotificationsLib.render(template.subject, ctx);
    let body = NotificationsLib.render(template.body, ctx);
    let recipient = switch (guest) {
      case (?g) {
        switch (g.email) {
          case (?e) { e };
          case null { Runtime.trap("Guest has no email address") };
        };
      };
      case null { Runtime.trap("Guest not found") };
    };
    await EmailClient.sendServiceEmail("no-reply", [recipient], subject, body);
  };

  public shared ({ caller }) func sendBookingReminder(
    bookingId : Common.BookingId,
    slot : Text,
  ) : async EmailClient.SendResult {
    let booking = switch (bookings.get(bookingId)) {
      case (?b) { b };
      case null { Runtime.trap("Booking not found") };
    };
    ignore requireManager(caller, booking.venueId);
    switch (booking.status) {
      case (#confirmed) {};
      case (_) { Runtime.trap("Reminders are only sent for confirmed bookings") };
    };
    if (NotificationsLib.hasSentSlot(reminderLogs, bookingId, slot)) {
      Runtime.trap("Reminder already sent for this slot");
    };
    let guest = guests.get(booking.guestId);
    let venue = venues.get(booking.venueId);
    let language = NotificationsLib.guestLanguage(guest);
    let template = NotificationsLib.getOrSeedTemplate(emailTemplates, counters, booking.venueId, #reminder, language);
    let ctx = NotificationsLib.contextFor(booking, guest, venue);
    let subject = NotificationsLib.render(template.subject, ctx);
    let body = NotificationsLib.render(template.body, ctx);
    let recipient = switch (guest) {
      case (?g) {
        switch (g.email) {
          case (?e) { e };
          case null { Runtime.trap("Guest has no email address") };
        };
      };
      case null { Runtime.trap("Guest not found") };
    };
    let result = await EmailClient.sendServiceEmail("no-reply", [recipient], subject, body);
    switch (result) {
      case (#ok) { NotificationsLib.markSlotSent(reminderLogs, bookingId, slot) };
      case (#err(_)) {};
    };
    result;
  };

  public shared ({ caller }) func getReminderLog(
    bookingId : Common.BookingId,
  ) : async ?Notifications.ReminderLog {
    let booking = switch (bookings.get(bookingId)) {
      case (?b) { b };
      case null { Runtime.trap("Booking not found") };
    };
    ignore requireManager(caller, booking.venueId);
    reminderLogs.get(bookingId);
  };
};
