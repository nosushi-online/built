import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Common "../types/common";
import Venues "../types/venues";
import Audit "../types/audit";
import Bookings "../types/bookings";
import Floorplan "../types/floorplan";
import Guests "../types/guests";
import VenuesLib "../lib/venues";

mixin (
  venues : Map.Map<Common.VenueId, Venues.Venue>,
  teamMembers : Map.Map<Principal, Venues.TeamMember>,
  teamInvites : Map.Map<Text, Venues.TeamInvite>,
  roomTables : Map.Map<Common.TableId, Floorplan.RoomTable>,
  guests : Map.Map<Common.GuestId, Guests.Guest>,
  bookings : Map.Map<Common.BookingId, Bookings.Booking>,
  auditLog : Map.Map<Common.AuditId, Audit.AuditEntry>,
  counters : VenuesLib.Counters,
) {
  func state() : VenuesLib.State = {
    venues;
    teamMembers;
    teamInvites;
    roomTables;
    guests;
    bookings;
    auditLog;
    counters;
  };

  // ---- Venue creation and update ----

  public shared ({ caller }) func createVenue(input : VenuesLib.CreateVenueInput) : async Venues.Venue {
    VenuesLib.createVenue(state(), caller, input);
  };

  public shared ({ caller }) func updateVenue(venueId : Common.VenueId, input : VenuesLib.UpdateVenueInput) : async Venues.Venue {
    VenuesLib.updateVenue(state(), caller, venueId, input);
  };

  public query ({ caller }) func getVenue(venueId : Common.VenueId) : async ?Venues.Venue {
    switch (VenuesLib.roleOf(state(), caller, venueId)) {
      case (?_) { venues.get(venueId) };
      case null { null };
    };
  };

  public query ({ caller }) func listMyVenues() : async [Venues.Venue] {
    VenuesLib.listVenuesFor(state(), caller);
  };

  public query ({ caller }) func getMyRole(venueId : Common.VenueId) : async ?Venues.TeamRole {
    VenuesLib.roleOf(state(), caller, venueId);
  };

  // ---- Onboarding ----

  public query ({ caller }) func getOnboarding(venueId : Common.VenueId) : async Venues.OnboardingState {
    VenuesLib.getOnboarding(state(), caller, venueId);
  };

  public shared ({ caller }) func saveOnboarding(venueId : Common.VenueId, patch : VenuesLib.OnboardingPatch) : async Venues.OnboardingState {
    VenuesLib.saveOnboarding(state(), caller, venueId, patch);
  };

  // ---- Opening hours and closures ----

  public shared ({ caller }) func setOpeningHours(venueId : Common.VenueId, hours : [Venues.DayHours]) : async [Venues.DayHours] {
    VenuesLib.setOpeningHours(state(), caller, venueId, hours);
  };

  public shared ({ caller }) func addClosure(venueId : Common.VenueId, closure : Venues.ClosureDate) : async [Venues.ClosureDate] {
    VenuesLib.addClosure(state(), caller, venueId, closure);
  };

  public shared ({ caller }) func removeClosure(venueId : Common.VenueId, date : Text) : async [Venues.ClosureDate] {
    VenuesLib.removeClosure(state(), caller, venueId, date);
  };

  // ---- Slug ----

  public query func isSlugAvailable(slug : Text) : async Bool {
    VenuesLib.isSlugAvailable(state(), slug);
  };

  public shared ({ caller }) func setSlug(venueId : Common.VenueId, slug : Text) : async Venues.Venue {
    VenuesLib.setSlug(state(), caller, venueId, slug);
  };

  // ---- Team ----

  public query ({ caller }) func listTeamMembers(venueId : Common.VenueId) : async [Venues.TeamMember] {
    ignore VenuesLib.requireMember(state(), caller, venueId);
    VenuesLib.listMembers(state(), venueId);
  };

  public query ({ caller }) func listTeamInvites(venueId : Common.VenueId) : async [Venues.TeamInvite] {
    ignore VenuesLib.requirePermission(state(), caller, venueId, #manageMembers);
    VenuesLib.listInvites(state(), venueId);
  };

  public shared ({ caller }) func inviteMember(venueId : Common.VenueId, email : Text, role : Venues.TeamRole) : async Venues.TeamInvite {
    VenuesLib.inviteMember(state(), caller, venueId, email, role);
  };

  public shared ({ caller }) func acceptInvite(email : Text) : async Venues.TeamMember {
    VenuesLib.acceptInvite(state(), caller, email);
  };

  public shared ({ caller }) func changeMemberRole(venueId : Common.VenueId, target : Principal, role : Venues.TeamRole) : async Venues.TeamMember {
    VenuesLib.changeMemberRole(state(), caller, venueId, target, role);
  };

  public shared ({ caller }) func removeMember(venueId : Common.VenueId, target : Principal) : async () {
    VenuesLib.removeMember(state(), caller, venueId, target);
  };

  // ---- Audit log ----

  public query ({ caller }) func listRecentAudit(venueId : Common.VenueId, limit : Nat) : async [Audit.AuditEntry] {
    ignore VenuesLib.requireMember(state(), caller, venueId);
    VenuesLib.recentAudit(state(), venueId, limit);
  };

  // ---- Demo seed ----

  public shared func seedDemoVenue() : async () {
    VenuesLib.seedDemo(state());
  };
};
