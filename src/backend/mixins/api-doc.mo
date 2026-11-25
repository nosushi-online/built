mixin () {
  public query func getApiDoc() : async Text {
    "# Venue Booking & Guest CRM Backend\n" #
    "\n" #
    "This canister powers a multi-tenant hospitality app for restaurants and spas: venue onboarding, team management, a floor plan, a guest CRM, a booking engine (staff and public), and transactional booking emails. Every record is scoped to a venue (tenant).\n" #
    "\n" #
    "## Authentication and identity\n" #
    "\n" #
    "- Sign-in uses Internet Identity. `_internet_identity_sign_in_start` / `_internet_identity_sign_in_finish` drive the flow; `_initialize_access_control` registers the first caller as admin.\n" #
    "- The app's frontend pins an Internet Identity derivation origin, published at `/.well-known/ii-derivation-origin` when available. An agent already holding the user's Internet Identity authorization derives the correct per-app principal against that origin (for example `icp identity link web <name> --app <host>`). Such a delegation acts with the user's full authority in this app until it expires.\n" #
    "- Most venue methods require the caller to be an accepted team member of the venue. A principal that never signed in through the app's frontend is unregistered even if it belongs to the app's owner; a principal derived against a different origin is a different principal than the one the frontend registered.\n" #
    "- Public booking methods (`getPublicVenuePage`, `getPublicAvailability`, `createPublicBooking`, `getPublicBooking`, `modifyPublicBooking`, `cancelPublicBooking`) require no account and are keyed by the venue's public slug or the booking's cancel token.\n" #
    "\n" #
    "## Authorization\n" #
    "\n" #
    "- Roles are `owner`, `manager`, `staff`. Owner and manager can manage venue settings, team, floor plan, guests and email templates; staff can work bookings and the floor view.\n" #
    "- Venue-scoped reads return only the caller's own venue data; a caller who is not a member receives an empty list or `null`.\n" #
    "- The OQL `schema()` / `execute()` endpoints expose venue, team, table, guest, booking, email-template and audit data. Venue-scoped entities are readable by controllers and by signed-in callers scoped to their own venue membership; email templates and the audit log are controller-only.\n" #
    "\n" #
    "## Units and encoding\n" #
    "\n" #
    "- Timestamps are UTC nanoseconds since the Unix epoch (`Time.now()`), signed `Int`. Each venue carries an IANA `timezone` for display.\n" #
    "- Money is integer euro cents (`Nat`).\n" #
    "- Phone numbers are E.164 strings. Dates are `YYYY-MM-DD` UTC strings.\n" #
    "- `Language` is `#fr` (default) or `#en`. `VenueType` is `#restaurant` or `#spa`.\n" #
    "- Optional fields use `null` for absent values.\n" #
    "\n" #
    "## Lifecycle and polling\n" #
    "\n" #
    "- Booking status flows `pending` -> `confirmed` -> `seated` -> `finished`, with `cancelled` and `noShow` as terminal alternatives. Invalid transitions return `#invalidStatus`.\n" #
    "- Public changes are refused within 2 hours of the booking start (`#pastCutoff`).\n" #
    "- Reminders are sent once per booking per slot; `getReminderLog` reports which slots were sent.\n" #
    "\n" #
    "## Mutation retry safety\n" #
    "\n" #
    "- `createBooking` / `createPublicBooking` create a new booking each call; retrying a successful call creates a duplicate. Use the returned `cancelToken` to manage it.\n" #
    "- `modifyBooking`, `changeBookingStatus`, `updateVenue`, `updateGuest` are idempotent for the same input.\n" #
    "- `sendBookingEmail` and `sendBookingReminder` send real email; a reminder for an already-sent slot traps.\n" #
    "\n" #
    "## Errors and gotchas\n" #
    "\n" #
    "- Booking operations return `{ #ok; #err }` with variants such as `#slotUnavailable`, `#notAuthorized`, `#invalidInput`, `#pastCutoff`, `#notFound`.\n" #
    "- Guest and floor-plan operations return `{ #ok; #err }` with `#notAuthorized`, `#notFound`, `#invalidInput`.\n" #
    "- `createPublicBooking` includes a honeypot field and a transient rate limit; a filled honeypot or exceeded rate returns `#unavailable`.\n" #
    "- `seedDemoVenue` creates the demo restaurant 'Le Petit Demo'."
  };
};
