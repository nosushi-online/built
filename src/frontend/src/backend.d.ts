import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AuditEntry {
    at: Timestamp;
    id: AuditId;
    entity: string;
    action: string;
    after?: string;
    venueId: VenueId;
    before?: string;
    actorPrincipal: Principal;
}
export type AuditId = bigint;
export interface Availability {
    date: string;
    slots: Array<Slot>;
}
export interface Booking {
    id: BookingId;
    status: BookingStatus;
    venueId: VenueId;
    source: BookingSource;
    startAt: Timestamp;
    createdAt: Timestamp;
    tableId?: TableId;
    statusHistory: Array<StatusHistoryEntry>;
    endAt: Timestamp;
    notes?: string;
    cancelToken: string;
    partySize: bigint;
    guestId: GuestId;
}
export interface BookingDefaults {
    spaDefaultBufferMinutes: bigint;
    maxOnlinePartySize: bigint;
    defaultTableDurationMinutes: bigint;
}
export type BookingError = {
    __kind__: "invalidStatus";
    invalidStatus: null;
} | {
    __kind__: "pastCutoff";
    pastCutoff: null;
} | {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: null;
} | {
    __kind__: "slotUnavailable";
    slotUnavailable: null;
};
export type BookingId = bigint;
export interface BookingView {
    id: BookingId;
    status: BookingStatus;
    venueId: VenueId;
    source: BookingSource;
    startAt: Timestamp;
    createdAt: Timestamp;
    tableId?: TableId;
    statusHistory: Array<StatusHistoryEntry>;
    guestName: string;
    guestEmail?: string;
    endAt: Timestamp;
    notes?: string;
    cancelToken: string;
    tableName?: string;
    guestPhone: string;
    partySize: bigint;
    guestId: GuestId;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface ClosureDate {
    date: string;
    reason?: string;
}
export interface ColumnMapping {
    vip?: bigint;
    marketingOptIn?: bigint;
    name: bigint;
    tags?: bigint;
    email?: bigint;
    preferences?: bigint;
    notes?: bigint;
    phone: bigint;
    allergies?: bigint;
}
export interface CreateInput {
    source: BookingSource;
    startAt: Timestamp;
    tableId?: TableId;
    guestName: string;
    guestEmail?: string;
    notes?: string;
    guestPhone: string;
    partySize: bigint;
}
export interface CreateVenueInput {
    timezone?: string;
    texts: Array<VenueTexts>;
    bookingDefaults?: BookingDefaults;
    publicSlug: string;
    logo?: string;
    name: string;
    address: string;
    phone: string;
    venueType: VenueType;
}
export interface DayHours {
    weekday: Weekday;
    services: Array<ServiceWindow>;
}
export interface EmailTemplate {
    id: TemplateId;
    subject: string;
    venueId: VenueId;
    body: string;
    kind: TemplateKind;
    language: Language;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type FloorError = {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: TableId;
};
export interface FloorPlan {
    venueId: VenueId;
    tables: Array<RoomTable>;
}
export interface FloorPosition {
    x: bigint;
    y: bigint;
    height: bigint;
    rotation: bigint;
    shape: TableShape;
    width: bigint;
}
export interface FloorTable {
    status: TableStatus;
    table: RoomTable;
    booking?: Booking;
}
export interface FloorView {
    service: string;
    venueId: VenueId;
    date: string;
    tables: Array<FloorTable>;
}
export interface Guest {
    id: GuestId;
    vip: boolean;
    visitCount: bigint;
    venueId: VenueId;
    marketingOptIn: boolean;
    name: string;
    createdAt: Timestamp;
    tags: Array<string>;
    lastVisitAt?: Timestamp;
    email?: string;
    preferences?: string;
    marketingOptInAt?: Timestamp;
    notes?: string;
    phone: string;
    noShowCount: bigint;
    allergies?: string;
}
export type GuestError = {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: null;
};
export interface GuestFilters {
    optInOnly: boolean;
    minVisits?: bigint;
    tags: Array<string>;
    search?: string;
    hasAllergies: boolean;
    lastVisitBefore?: Timestamp;
    vipOnly: boolean;
}
export type GuestId = bigint;
export interface GuestInput {
    vip: boolean;
    marketingOptIn: boolean;
    name: string;
    tags: Array<string>;
    email?: string;
    preferences?: string;
    notes?: string;
    phone: string;
    allergies?: string;
}
export interface GuestProfile {
    bookings: Array<Booking>;
    guest: Guest;
}
export interface ImportResult {
    imported: bigint;
    skipped: bigint;
}
export interface MergeResult {
    kept: Guest;
    mergedBookings: bigint;
}
export interface ModifyInput {
    startAt?: Timestamp;
    tableId?: TableId;
    guestName?: string;
    guestEmail?: string;
    notes?: string;
    guestPhone?: string;
    partySize?: bigint;
}
export interface OnboardingPatch {
    bookingDefaultsDone?: boolean;
    venueTypeDone?: boolean;
    hoursDone?: boolean;
    slugDone?: boolean;
}
export interface OnboardingState {
    completedAt?: Timestamp;
    bookingDefaultsDone: boolean;
    venueTypeDone: boolean;
    hoursDone: boolean;
    slugDone: boolean;
}
export interface PrivacyExport {
    bookings: Array<Booking>;
    json: string;
    guest: Guest;
}
export type PublicBookingResult = {
    __kind__: "waitlisted";
    waitlisted: {
        message: string;
    };
} | {
    __kind__: "confirmed";
    confirmed: {
        startAt: Timestamp;
        endAt: Timestamp;
        cancelToken: string;
    };
} | {
    __kind__: "unavailable";
    unavailable: {
        message: string;
    };
};
export interface PublicManageView {
    status: BookingStatus;
    canCancel: boolean;
    canModify: boolean;
    startAt: Timestamp;
    guestName: string;
    endAt: Timestamp;
    notes?: string;
    partySize: bigint;
    venueName: string;
}
export interface PublicVenuePage {
    timezone: Timezone;
    venueId: VenueId;
    logo?: string;
    name: string;
    description: string;
    maxOnlinePartySize: bigint;
    defaultTableDurationMinutes: bigint;
    address: string;
    openingHours: Array<DayHours>;
    phone: string;
    services: Array<ServiceWindow>;
    closedDates: Array<string>;
}
export interface ReminderLog {
    bookingId: BookingId;
    sentSlots: Array<string>;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface RoomTable {
    id: TableId;
    active: boolean;
    maxSeats: bigint;
    venueId: VenueId;
    name: string;
    room: string;
    minSeats: bigint;
    combinable: boolean;
    position: FloorPosition;
}
export type SendResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface ServiceWindow {
    closeMinute: bigint;
    openMinute: bigint;
}
export interface Slot {
    startAt: Timestamp;
    endAt: Timestamp;
}
export interface StatusHistoryEntry {
    at: Timestamp;
    by?: Principal;
    status: BookingStatus;
}
export type TableId = bigint;
export interface TableInput {
    maxSeats: bigint;
    name: string;
    room: string;
    minSeats: bigint;
    combinable: boolean;
    position: FloorPosition;
}
export interface TableUpdate {
    active?: boolean;
    maxSeats?: bigint;
    name?: string;
    room?: string;
    minSeats?: bigint;
    combinable?: boolean;
    position?: FloorPosition;
}
export interface TeamInvite {
    venueId: VenueId;
    createdAt: Timestamp;
    role: TeamRole;
    invitedBy: Principal;
    email: string;
}
export interface TeamMember {
    principal: Principal;
    venueId: VenueId;
    joinedAt: Timestamp;
    role: TeamRole;
    email: string;
}
export type TemplateId = bigint;
export type Timestamp = bigint;
export type Timezone = string;
export interface UpdateVenueInput {
    timezone?: string;
    texts?: Array<VenueTexts>;
    bookingDefaults?: BookingDefaults;
    logo?: string;
    name?: string;
    address?: string;
    phone?: string;
    venueType?: VenueType;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface Venue {
    id: VenueId;
    timezone: Timezone;
    texts: Array<VenueTexts>;
    bookingDefaults: BookingDefaults;
    publicSlug: string;
    logo?: string;
    name: string;
    createdAt: Timestamp;
    closures: Array<ClosureDate>;
    address: string;
    onboarding: OnboardingState;
    openingHours: Array<DayHours>;
    phone: string;
    venueType: VenueType;
}
export type VenueId = bigint;
export interface VenueTexts {
    name: string;
    description: string;
    language: Language;
}
export type Weekday = bigint;
export enum BookingSource {
    staff = "staff",
    walkIn = "walkIn",
    phone = "phone",
    online = "online"
}
export enum BookingStatus {
    noShow = "noShow",
    cancelled = "cancelled",
    pending = "pending",
    seated = "seated",
    finished = "finished",
    confirmed = "confirmed"
}
export enum Language {
    en = "en",
    fr = "fr"
}
export enum TableShape {
    rectangle = "rectangle",
    square = "square",
    round = "round"
}
export enum TableStatus {
    free = "free",
    booked = "booked",
    seated = "seated",
    finished = "finished"
}
export enum TeamRole {
    manager = "manager",
    owner = "owner",
    staff = "staff"
}
export enum TemplateKind {
    modification = "modification",
    reminder = "reminder",
    confirmation = "confirmation",
    cancellation = "cancellation"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VenueType {
    spa = "spa",
    restaurant = "restaurant"
}
export interface backendInterface {
    acceptInvite(email: string): Promise<TeamMember>;
    addClosure(venueId: VenueId, closure: ClosureDate): Promise<Array<ClosureDate>>;
    /**
     * / Anonymize a guest record (owner or manager only).
     */
    anonymizeGuest(guestId: GuestId): Promise<{
        __kind__: "ok";
        ok: Guest;
    } | {
        __kind__: "err";
        err: GuestError;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelPublicBooking(token: string): Promise<{
        __kind__: "ok";
        ok: PublicManageView;
    } | {
        __kind__: "err";
        err: BookingError;
    }>;
    changeBookingStatus(bookingId: BookingId, status: BookingStatus): Promise<{
        __kind__: "ok";
        ok: BookingView;
    } | {
        __kind__: "err";
        err: BookingError;
    }>;
    changeMemberRole(venueId: VenueId, target: Principal, role: TeamRole): Promise<TeamMember>;
    createBooking(input: CreateInput): Promise<{
        __kind__: "ok";
        ok: BookingView;
    } | {
        __kind__: "err";
        err: BookingError;
    }>;
    /**
     * / Create a guest in the caller's venue.
     */
    createGuest(input: GuestInput): Promise<{
        __kind__: "ok";
        ok: Guest;
    } | {
        __kind__: "err";
        err: GuestError;
    }>;
    createPublicBooking(slug: string, guestName: string, guestPhone: string, guestEmail: string | null, partySize: bigint, startAt: Timestamp, notes: string | null, honeypot: string): Promise<PublicBookingResult>;
    /**
     * / Create a table in the caller's venue (owner or manager only).
     */
    createTable(input: TableInput): Promise<{
        __kind__: "ok";
        ok: RoomTable;
    } | {
        __kind__: "err";
        err: FloorError;
    }>;
    createVenue(input: CreateVenueInput): Promise<Venue>;
    /**
     * / Deactivate a table of the caller's venue (owner or manager only).
     */
    deactivateTable(tableId: TableId): Promise<{
        __kind__: "ok";
        ok: RoomTable;
    } | {
        __kind__: "err";
        err: FloorError;
    }>;
    /**
     * / Delete a guest record (owner or manager only).
     */
    deleteGuest(guestId: GuestId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: GuestError;
    }>;
    /**
     * / Delete a table of the caller's venue (owner or manager only).
     */
    deleteTable(tableId: TableId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: FloorError;
    }>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Export one guest's data as JSON (GDPR access).
     */
    exportGuestData(guestId: GuestId): Promise<{
        __kind__: "ok";
        ok: PrivacyExport;
    } | {
        __kind__: "err";
        err: GuestError;
    }>;
    /**
     * / Export the caller's venue guest list as CSV (owner or manager only).
     */
    exportGuestsCsv(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: GuestError;
    }>;
    /**
     * / Finish a booking from the floor view.
     */
    finishBooking(bookingId: BookingId): Promise<{
        __kind__: "ok";
        ok: Booking;
    } | {
        __kind__: "err";
        err: FloorError;
    }>;
    getApiDoc(): Promise<string>;
    getAvailability(date: string, partySize: bigint): Promise<Availability | null>;
    getBooking(bookingId: BookingId): Promise<BookingView | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmailTemplate(venueId: VenueId, kind: TemplateKind, language: Language): Promise<EmailTemplate>;
    /**
     * / Rooms and tables of the caller's venue, for the floor plan editor.
     */
    getFloorPlan(): Promise<FloorPlan>;
    /**
     * / Live floor view for a date ("YYYY-MM-DD") and service label.
     */
    getFloorView(date: string, service: string): Promise<FloorView>;
    /**
     * / A guest of the caller's venue with their booking history.
     */
    getGuestProfile(guestId: GuestId): Promise<GuestProfile | null>;
    getMyRole(venueId: VenueId): Promise<TeamRole | null>;
    getOnboarding(venueId: VenueId): Promise<OnboardingState>;
    getPublicAvailability(slug: string, date: string, partySize: bigint): Promise<Availability | null>;
    getPublicBooking(token: string): Promise<PublicManageView | null>;
    getPublicVenuePage(slug: string): Promise<PublicVenuePage | null>;
    getReminderLog(bookingId: BookingId): Promise<ReminderLog | null>;
    getVenue(venueId: VenueId): Promise<Venue | null>;
    /**
     * / Import guests from CSV with a caller-supplied column mapping (owner or manager only).
     */
    importGuestsCsv(csv: string, mapping: ColumnMapping): Promise<{
        __kind__: "ok";
        ok: ImportResult;
    } | {
        __kind__: "err";
        err: GuestError;
    }>;
    inviteMember(venueId: VenueId, email: string, role: TeamRole): Promise<TeamInvite>;
    isCallerAdmin(): Promise<boolean>;
    isSlugAvailable(slug: string): Promise<boolean>;
    listBookingsForDate(date: string): Promise<Array<BookingView>>;
    listEmailTemplates(venueId: VenueId): Promise<Array<EmailTemplate>>;
    /**
     * / Searchable guest list of the caller's venue, with filters.
     */
    listGuests(filters: GuestFilters): Promise<Array<Guest>>;
    listMyVenues(): Promise<Array<Venue>>;
    listRecentAudit(venueId: VenueId, limit: bigint): Promise<Array<AuditEntry>>;
    listTeamInvites(venueId: VenueId): Promise<Array<TeamInvite>>;
    listTeamMembers(venueId: VenueId): Promise<Array<TeamMember>>;
    /**
     * / Merge a duplicate guest into the kept one, moving its bookings (owner or manager only).
     */
    mergeGuests(keepId: GuestId, mergeId: GuestId): Promise<{
        __kind__: "ok";
        ok: MergeResult;
    } | {
        __kind__: "err";
        err: GuestError;
    }>;
    modifyBooking(bookingId: BookingId, input: ModifyInput): Promise<{
        __kind__: "ok";
        ok: BookingView;
    } | {
        __kind__: "err";
        err: BookingError;
    }>;
    modifyPublicBooking(token: string, partySize: bigint | null, startAt: Timestamp | null, notes: string | null): Promise<{
        __kind__: "ok";
        ok: PublicManageView;
    } | {
        __kind__: "err";
        err: BookingError;
    }>;
    previewEmailTemplate(id: TemplateId): Promise<{
        subject: string;
        body: string;
    }>;
    removeClosure(venueId: VenueId, date: string): Promise<Array<ClosureDate>>;
    removeMember(venueId: VenueId, target: Principal): Promise<void>;
    saveOnboarding(venueId: VenueId, patch: OnboardingPatch): Promise<OnboardingState>;
    schema(): Promise<string>;
    /**
     * / Seat a booking from the floor view.
     */
    seatBooking(bookingId: BookingId): Promise<{
        __kind__: "ok";
        ok: Booking;
    } | {
        __kind__: "err";
        err: FloorError;
    }>;
    seedDemoVenue(): Promise<void>;
    sendBookingEmail(bookingId: BookingId, kind: TemplateKind): Promise<SendResult>;
    sendBookingReminder(bookingId: BookingId, slot: string): Promise<SendResult>;
    sendTestEmail(id: TemplateId, recipient: string): Promise<SendResult>;
    setOpeningHours(venueId: VenueId, hours: Array<DayHours>): Promise<Array<DayHours>>;
    setSlug(venueId: VenueId, slug: string): Promise<Venue>;
    updateEmailTemplate(id: TemplateId, subject: string, body: string): Promise<EmailTemplate>;
    /**
     * / Update a guest of the caller's venue.
     */
    updateGuest(guestId: GuestId, input: GuestInput): Promise<{
        __kind__: "ok";
        ok: Guest;
    } | {
        __kind__: "err";
        err: GuestError;
    }>;
    /**
     * / Update a table of the caller's venue (owner or manager only).
     */
    updateTable(tableId: TableId, update: TableUpdate): Promise<{
        __kind__: "ok";
        ok: RoomTable;
    } | {
        __kind__: "err";
        err: FloorError;
    }>;
    updateVenue(venueId: VenueId, input: UpdateVenueInput): Promise<Venue>;
}
