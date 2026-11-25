# Project Guidance

## User Preferences

- French default language with English available
- Calm, premium hospitality look: off-white background, deep green #1F4D3A, warm accent #E8A45C, rounded-xl cards, Inter font
- Mobile-first, tablet-friendly for staff during service
- Money in integer cents EUR, phone numbers in E.164, timestamps UTC with a per-venue timezone
- Marketing opt-in is a separate unchecked checkbox with a stored timestamp

## Accepted Requirements

- Multi-tenant venues with restaurant and spa types, every record scoped to a venue
- Roles owner, manager and staff with the stated permissions
- 4-step onboarding wizard with venue type, hours, booking defaults and unique slug
- Team invites by email with role, accepted only by the matching email
- Restaurant booking engine with availability, automatic table suggestion and double-booking prevention
- Planning page with service tabs, covers counters, list and timeline views, and keyboard shortcuts
- Public booking page without an account, with waitlist fallback and a cancel-token manage page
- Embeddable iframe and script snippet
- Guest CRM with search, filters, automatic tags, merge, CSV import/export and GDPR actions
- Floor plan editor and live tablet floor view
- Email confirmation and reminder notifications
- French default with English, i18n-ready structure
- Append-only audit log
- Seeded demo restaurant 'Le Petit Demo'

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Generated backend types must be re-exported from @/backend in src/frontend/src/types/index.ts, never copied locally: the bindings check rejects local copies of generated enums and interfaces.
- The generated Venue type uses venueType and publicSlug field names, and listMyVenues returns Venue[], so a per-venue role comes from getMyRole.
- In Motoko, 'actor' is a reserved keyword and cannot be a record field name; the audit entry field is actorPrincipal.
- A Motoko mixin top-level let binding is stable state and traps; use a func returning the state record instead.
- A Motoko func literal body starting with let needs do { ... }; a bare { ... } is parsed as a record literal (M0273).
- Array.sort takes an Order comparator such as func(a, b) = Nat.compare(...), not func a, b = ...
- caffeineai-oql 0.9.0 Entity.Builder has no .edge; use .payload/.flatten for extra columns, and drop explicit type args on toEntityManual so the receiver infers K and V.
- Page tasks keep their copy in a page-local fr/en module mirroring TranslationKey so it can be lifted into i18n/dictionaries.ts without changing call sites.
- Biome rejects role=group on a div (use fieldset) and prefers <output> over role=status; useExhaustiveDependencies needs a useCallback-wrapped helper.
- TanStack Router guards must read useInternetIdentity inside a component, not beforeLoad, since hooks cannot run in route options.
