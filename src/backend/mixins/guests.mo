import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Common "../types/common";
import Venues "../types/venues";
import Bookings "../types/bookings";
import Guests "../types/guests";
import Audit "../types/audit";
import GuestsLib "../lib/guests";

mixin (
  guests : Map.Map<Common.GuestId, Guests.Guest>,
  bookings : Map.Map<Common.BookingId, Bookings.Booking>,
  teamMembers : Map.Map<Principal, Venues.TeamMember>,
  auditLog : Map.Map<Common.AuditId, Audit.AuditEntry>,
  counters : GuestsLib.Counters,
) {
  func guestState() : GuestsLib.State = {
    guests;
    bookings;
    teamMembers;
    auditLog;
    counters;
  };

  // ---- Queries ----

  /// Searchable guest list of the caller's venue, with filters.
  public query ({ caller }) func listGuests(filters : GuestsLib.GuestFilters) : async [Guests.Guest] {
    GuestsLib.listGuests(guestState(), caller, filters);
  };

  /// A guest of the caller's venue with their booking history.
  public query ({ caller }) func getGuestProfile(guestId : Common.GuestId) : async ?GuestsLib.GuestProfile {
    GuestsLib.getProfile(guestState(), caller, guestId);
  };

  // ---- Mutations ----

  /// Create a guest in the caller's venue.
  public shared ({ caller }) func createGuest(input : GuestsLib.GuestInput) : async { #ok : Guests.Guest; #err : GuestsLib.GuestError } {
    GuestsLib.createGuest(guestState(), caller, input);
  };

  /// Update a guest of the caller's venue.
  public shared ({ caller }) func updateGuest(guestId : Common.GuestId, input : GuestsLib.GuestInput) : async { #ok : Guests.Guest; #err : GuestsLib.GuestError } {
    GuestsLib.updateGuest(guestState(), caller, guestId, input);
  };

  /// Merge a duplicate guest into the kept one, moving its bookings (owner or manager only).
  public shared ({ caller }) func mergeGuests(keepId : Common.GuestId, mergeId : Common.GuestId) : async { #ok : GuestsLib.MergeResult; #err : GuestsLib.GuestError } {
    GuestsLib.mergeGuests(guestState(), caller, keepId, mergeId);
  };

  // ---- CSV ----

  /// Import guests from CSV with a caller-supplied column mapping (owner or manager only).
  public shared ({ caller }) func importGuestsCsv(csv : Text, mapping : GuestsLib.ColumnMapping) : async { #ok : GuestsLib.ImportResult; #err : GuestsLib.GuestError } {
    GuestsLib.importCsv(guestState(), caller, csv, mapping);
  };

  /// Export the caller's venue guest list as CSV (owner or manager only).
  public query ({ caller }) func exportGuestsCsv() : async { #ok : Text; #err : GuestsLib.GuestError } {
    GuestsLib.exportCsv(guestState(), caller);
  };

  // ---- Privacy ----

  /// Export one guest's data as JSON (GDPR access).
  public query ({ caller }) func exportGuestData(guestId : Common.GuestId) : async { #ok : GuestsLib.PrivacyExport; #err : GuestsLib.GuestError } {
    GuestsLib.exportGuestData(guestState(), caller, guestId);
  };

  /// Anonymize a guest record (owner or manager only).
  public shared ({ caller }) func anonymizeGuest(guestId : Common.GuestId) : async { #ok : Guests.Guest; #err : GuestsLib.GuestError } {
    GuestsLib.anonymizeGuest(guestState(), caller, guestId);
  };

  /// Delete a guest record (owner or manager only).
  public shared ({ caller }) func deleteGuest(guestId : Common.GuestId) : async { #ok : (); #err : GuestsLib.GuestError } {
    GuestsLib.deleteGuest(guestState(), caller, guestId);
  };
};
