import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TeamRole } from "@/types";
import type { TeamInvite, TeamMember } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Loader2, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import {
  Field,
  InlineError,
  SettingsSection,
  useRoleLabel,
  useSettingsText,
} from "./SettingsPrimitives";
import {
  useChangeMemberRole,
  useInviteMember,
  useRemoveMember,
  useTeamInvites,
  useTeamMembers,
} from "./useSettingsQueries";

const ASSIGNABLE_ROLES: TeamRole[] = [TeamRole.manager, TeamRole.staff];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function TeamSection({
  venueId,
  timezone,
  isOwner,
}: {
  venueId: bigint;
  timezone: string;
  isOwner: boolean;
}) {
  const s = useSettingsText();
  const roleLabel = useRoleLabel();
  const { language, t } = useI18n();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toText();

  const members = useTeamMembers(venueId);
  const invites = useTeamInvites(venueId);
  const invite = useInviteMember(venueId);
  const changeRole = useChangeMemberRole(venueId);
  const removeMember = useRemoveMember(venueId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>(TeamRole.staff);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<TeamMember | null>(null);

  const submitInvite = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError(s("team.invite.invalidEmail"));
      return;
    }
    setEmailError(null);
    setEmail("");
    invite.mutate(
      { email: trimmed, role },
      {
        onError: () =>
          setEmail((current) => (current === "" ? trimmed : current)),
      },
    );
  };

  const memberList = members.data ?? [];
  const inviteList = invites.data ?? [];

  return (
    <div className="space-y-6">
      <SettingsSection
        ocid="settings.team.section"
        title={s("team.title")}
        description={s("team.subtitle")}
      >
        <div className="space-y-6">
          <form
            onSubmit={submitInvite}
            data-ocid="settings.team.invite_form"
            className="rounded-xl border border-border bg-secondary/40 p-4"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserPlus className="size-4 text-primary" aria-hidden="true" />
              {s("team.invite.title")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <Field
                label={s("team.invite.email")}
                htmlFor="team-invite-email"
                error={emailError ?? undefined}
              >
                <Input
                  id="team-invite-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  data-ocid="settings.team.email_input"
                  placeholder={s("team.invite.emailPlaceholder")}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  aria-invalid={emailError ? true : undefined}
                />
              </Field>
              <Field label={s("team.invite.role")} htmlFor="team-invite-role">
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as TeamRole)}
                >
                  <SelectTrigger
                    id="team-invite-role"
                    data-ocid="settings.team.role_select"
                    className="w-full sm:w-40"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {roleLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Button
                type="submit"
                data-ocid="settings.team.invite_button"
                disabled={invite.isPending || email.trim() === ""}
                className="h-9"
              >
                {invite.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {s("team.invite.submit")}
              </Button>
            </div>
            {invite.isSuccess && (
              <p
                data-ocid="settings.team.invite_success"
                className="mt-3 text-sm font-medium text-success"
              >
                {s("team.invite.success", { email: invite.data.email })}
              </p>
            )}
            {invite.isError && (
              <div className="mt-3">
                <InlineError message={s("team.invite.error")} />
              </div>
            )}
          </form>

          <div>
            <h3 className="label-caps">{s("team.members.title")}</h3>
            {members.isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {s("team.members.empty")}
              </p>
            ) : memberList.length === 0 ? (
              <p
                data-ocid="settings.team.members_empty"
                className="mt-3 text-sm text-muted-foreground"
              >
                {s("team.members.empty")}
              </p>
            ) : (
              <ul
                data-ocid="settings.team.members_list"
                className="mt-3 divide-y divide-border"
              >
                {memberList.map((member, index) => {
                  const isMe = member.principal.toText() === myPrincipal;
                  const isOwnerRow = member.role === TeamRole.owner;
                  return (
                    <li
                      key={member.principal.toText()}
                      data-ocid={`settings.team.member.${index + 1}`}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(member.email || "?")}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                            <span className="truncate">{member.email}</span>
                            {isMe && (
                              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                                {s("team.members.you")}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s("team.members.joined", {
                              date: formatDate(
                                member.joinedAt,
                                timezone,
                                language,
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              ),
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:shrink-0">
                        {isOwner && !isOwnerRow ? (
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              changeRole.mutate({
                                principal: member.principal,
                                role: value as TeamRole,
                              })
                            }
                          >
                            <SelectTrigger
                              aria-label={s("team.members.roleLabel", {
                                name: member.email,
                              })}
                              data-ocid={`settings.team.role_select.${index + 1}`}
                              className="h-8 w-36"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {roleLabel(option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                            {isOwnerRow && (
                              <ShieldCheck
                                className="size-3.5 text-primary"
                                aria-hidden="true"
                              />
                            )}
                            {roleLabel(member.role)}
                          </span>
                        )}
                        {isOwner && !isOwnerRow && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            data-ocid={`settings.team.remove_button.${index + 1}`}
                            onClick={() => setPendingRemoval(member)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            {s("team.members.remove")}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {changeRole.isError && (
              <div className="mt-3">
                <InlineError message={s("team.members.roleError")} />
              </div>
            )}
            {removeMember.isError && (
              <div className="mt-3">
                <InlineError message={s("team.members.removeError")} />
              </div>
            )}
          </div>

          <div>
            <h3 className="label-caps">{s("team.invites.title")}</h3>
            {inviteList.length === 0 ? (
              <p
                data-ocid="settings.team.invites_empty"
                className="mt-3 text-sm text-muted-foreground"
              >
                {s("team.invites.empty")}
              </p>
            ) : (
              <ul
                data-ocid="settings.team.invites_list"
                className="mt-3 space-y-2"
              >
                {inviteList.map((pending: TeamInvite, index) => (
                  <li
                    key={`${pending.email}-${pending.createdAt.toString()}`}
                    data-ocid={`settings.team.invite.${index + 1}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                      <Mail
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="truncate">{pending.email}</span>
                    </span>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                        {roleLabel(pending.role)}
                      </span>
                      <span>
                        {s("team.invites.sent", {
                          date: formatDate(
                            pending.createdAt,
                            timezone,
                            language,
                            { day: "numeric", month: "short" },
                          ),
                        })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SettingsSection>

      <AlertDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
      >
        <AlertDialogContent data-ocid="settings.team.remove_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{s("team.members.removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {s("team.members.removeBody", {
                name: pendingRemoval?.email ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="settings.team.remove_cancel_button">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="settings.team.remove_confirm_button"
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              onClick={() => {
                if (pendingRemoval) {
                  removeMember.mutate(pendingRemoval.principal);
                }
                setPendingRemoval(null);
              }}
            >
              {s("team.members.removeConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
