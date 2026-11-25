import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingSource, type Guest, type RoomTable } from "@/types";
import type { BookingView } from "@/types";
import { Check, Search, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  SERVICES,
  type ServiceKey,
  suggestTable,
  takenTableIds,
  timeOptions,
  zonedTimestamp,
} from "./planningUtils";
import { usePlanningCopy } from "./usePlanningCopy";
import { useCreateBooking, useCreateGuest } from "./usePlanningMutations";

const NO_TABLE = "none";

export function NewBookingDrawer({
  open,
  onOpenChange,
  date,
  timezone,
  guests,
  tables,
  dayBookings,
  defaultService,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  timezone: string;
  guests: Guest[];
  tables: RoomTable[];
  dayBookings: BookingView[];
  defaultService: ServiceKey;
  onCreated: (summary: { name: string; party: number; time: string }) => void;
}) {
  const t = usePlanningCopy();
  const createGuest = useCreateGuest();
  const createBooking = useCreateBooking();

  const [service, setService] = useState<ServiceKey>(defaultService);
  const [time, setTime] = useState(timeOptions(defaultService)[0] ?? "19:00");
  const [partySize, setPartySize] = useState("2");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [tableChoice, setTableChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const party = Number.parseInt(partySize, 10) || 0;

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return [];
    return guests
      .filter(
        (guest) =>
          guest.name.toLowerCase().includes(query) ||
          guest.phone.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [guests, search]);

  const taken = useMemo(() => takenTableIds(dayBookings), [dayBookings]);
  const suggestion = useMemo(
    () => suggestTable(tables, party, taken),
    [tables, party, taken],
  );
  const chosenTableId = tableChoice ?? suggestion?.id.toString() ?? NO_TABLE;
  const activeTables = tables.filter((table) => table.active);

  const reset = () => {
    setSelectedGuest(null);
    setSearch("");
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setPartySize("2");
    setTableChoice(null);
    setError(null);
  };

  const handleService = (next: ServiceKey) => {
    setService(next);
    setTime(timeOptions(next)[0] ?? "19:00");
    setTableChoice(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!selectedGuest && !name.trim()) {
      setError(t("booking.error.name"));
      return;
    }
    if (!selectedGuest && !phone.trim()) {
      setError(t("booking.error.phone"));
      return;
    }
    if (party < 1) {
      setError(t("booking.error.party"));
      return;
    }
    if (!time) {
      setError(t("booking.error.time"));
      return;
    }

    try {
      let guest = selectedGuest;
      if (!guest) {
        guest = await createGuest.mutateAsync({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          vip: false,
          marketingOptIn: false,
          tags: [],
        });
      }
      await createBooking.mutateAsync({
        guestName: guest.name,
        guestPhone: guest.phone,
        guestEmail: guest.email,
        partySize: BigInt(party),
        startAt: zonedTimestamp(date, time, timezone),
        tableId: chosenTableId === NO_TABLE ? undefined : BigInt(chosenTableId),
        notes: notes.trim() || undefined,
        source: BookingSource.staff,
      });
      reset();
      onCreated({ name: guest.name, party, time });
      onOpenChange(false);
    } catch {
      setError(t("booking.error.generic"));
    }
  };

  const pending = createGuest.isPending || createBooking.isPending;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        data-ocid="booking.new.sheet"
        className="w-full sm:max-w-md"
      >
        <DrawerHeader className="border-b border-border">
          <DrawerTitle className="font-display text-lg">
            {t("booking.new.title")}
          </DrawerTitle>
          <DrawerDescription>{t("booking.new.subtitle")}</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* Guest */}
          <section className="space-y-2">
            <p className="label-caps">{t("booking.field.guest")}</p>
            {selectedGuest ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(selectedGuest.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {selectedGuest.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedGuest.phone}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGuest(null)}
                  data-ocid="booking.guest.change_button"
                  className="rounded-lg"
                >
                  {t("booking.guest.change")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("booking.field.guestSearchPlaceholder")}
                    aria-label={t("booking.field.guestSearch")}
                    data-ocid="booking.guest.search_input"
                    className="h-10 rounded-lg pl-9"
                  />
                </div>
                {search.trim().length >= 2 && (
                  <ul className="space-y-1">
                    {matches.length === 0 ? (
                      <li className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {t("booking.guest.noResults")}
                      </li>
                    ) : (
                      matches.map((guest, index) => (
                        <li key={guest.id.toString()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGuest(guest);
                              setSearch("");
                            }}
                            data-ocid={`booking.guest.result.${index + 1}`}
                            className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left transition-smooth hover:bg-secondary/60"
                          >
                            <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                              {initials(guest.name)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {guest.name}
                              </span>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {guest.phone}
                              </span>
                            </span>
                            <Check
                              className="size-4 text-primary"
                              aria-hidden="true"
                            />
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}

                <div className="rounded-xl border border-dashed border-border p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <UserPlus className="size-3.5" aria-hidden="true" />
                    {t("booking.field.newGuest")}
                  </p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="new-guest-name" className="text-xs">
                        {t("booking.field.name")}
                      </Label>
                      <Input
                        id="new-guest-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        data-ocid="booking.guest.name_input"
                        className="h-9 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="new-guest-phone" className="text-xs">
                          {t("booking.field.phone")}
                        </Label>
                        <Input
                          id="new-guest-phone"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          inputMode="tel"
                          data-ocid="booking.guest.phone_input"
                          className="h-9 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-guest-email" className="text-xs">
                          {t("booking.field.email")}
                        </Label>
                        <Input
                          id="new-guest-email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          data-ocid="booking.guest.email_input"
                          className="h-9 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Service + time + party */}
          <section className="space-y-2">
            <p className="label-caps">{t("planning.service.all")}</p>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map((window) => (
                <button
                  key={window.key}
                  type="button"
                  onClick={() => handleService(window.key)}
                  data-ocid={`booking.service.${window.key}`}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-smooth",
                    service === window.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-secondary",
                  )}
                >
                  {t(`planning.service.${window.key}`)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="booking-time" className="text-xs">
                  {t("booking.field.time")}
                </Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger
                    id="booking-time"
                    data-ocid="booking.time_select"
                    className="h-10 w-full rounded-lg"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions(service).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="booking-party" className="text-xs">
                  {t("booking.field.partySize")}
                </Label>
                <Input
                  id="booking-party"
                  type="number"
                  min={1}
                  max={40}
                  value={partySize}
                  onChange={(event) => {
                    setPartySize(event.target.value);
                    setTableChoice(null);
                  }}
                  data-ocid="booking.party_input"
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* Table */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="label-caps">{t("booking.field.table")}</p>
              <span className="text-[11px] text-muted-foreground">
                {t("booking.table.auto")}
              </span>
            </div>
            <Select value={chosenTableId} onValueChange={setTableChoice}>
              <SelectTrigger
                data-ocid="booking.table_select"
                className="h-10 w-full rounded-lg"
              >
                <SelectValue placeholder={t("booking.table.manual")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TABLE}>
                  {t("planning.noTable")}
                </SelectItem>
                {activeTables.map((table) => (
                  <SelectItem
                    key={table.id.toString()}
                    value={table.id.toString()}
                  >
                    {table.name} · {table.room} · {Number(table.maxSeats)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {suggestion === null && party > 0 && (
              <p className="rounded-lg bg-warning/15 px-3 py-2 text-xs text-warning-foreground">
                {t("booking.table.none")} — {t("booking.table.noneHint")}
              </p>
            )}
          </section>

          {/* Notes */}
          <section className="space-y-1">
            <Label htmlFor="booking-notes" className="text-xs">
              {t("booking.field.notes")}
            </Label>
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("booking.field.notesPlaceholder")}
              data-ocid="booking.notes_input"
              className="rounded-lg"
            />
          </section>

          {error && (
            <p
              role="alert"
              data-ocid="booking.error_state"
              className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              <X className="size-3.5" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        <DrawerFooter className="border-t border-border">
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={pending}
            data-ocid="booking.submit_button"
            className="h-11 rounded-lg"
          >
            {pending ? t("booking.submitting") : t("booking.submit")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-ocid="booking.cancel_button"
            className="h-10 rounded-lg"
          >
            {t("common.cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
