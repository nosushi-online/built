import Common "common";

module {
  public type VenueId = Common.VenueId;
  public type BookingId = Common.BookingId;
  public type TemplateId = Common.TemplateId;
  public type Language = Common.Language;

  /// Kind of transactional email a template renders.
  public type TemplateKind = {
    #confirmation;
    #modification;
    #cancellation;
    #reminder;
  };

  /// An email template for one kind and language, scoped to a venue.
  public type EmailTemplate = {
    id : TemplateId;
    venueId : VenueId;
    kind : TemplateKind;
    language : Language;
    subject : Text;
    body : Text;
  };

  /// Reminder slots already sent for a booking.
  public type ReminderLog = {
    bookingId : BookingId;
    sentSlots : [Text];
  };
};
