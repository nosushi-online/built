import type { Language } from "@/types";

/**
 * Onboarding copy lives with the wizard so the shared dictionary stays owned by
 * the foundation task. Keys mirror the `onboarding.*` namespace and can be
 * lifted into `i18n/dictionaries.ts` unchanged.
 */
const fr = {
  "onboarding.title": "Bienvenue dans Maison",
  "onboarding.subtitle":
    "Quelques étapes pour préparer votre maison, vos horaires et vos réservations.",
  "onboarding.step": "Étape {step} sur {total}",
  "onboarding.resume": "Reprendre la configuration",
  "onboarding.resumeBody":
    "Votre maison est enregistrée. Terminez les étapes restantes pour ouvrir le back-office.",
  "onboarding.progress": "{done} sur {total} étapes terminées",
  "onboarding.saved": "Brouillon enregistré",
  "onboarding.savedBody":
    "Vos informations sont conservées. Vous pouvez reprendre plus tard.",
  "onboarding.finish": "Terminer et ouvrir le back-office",
  "onboarding.finishing": "Ouverture du back-office…",
  "onboarding.done": "Votre maison est prête",
  "onboarding.doneBody":
    "Toutes les étapes sont terminées. Bienvenue dans votre back-office.",
  "onboarding.openBackOffice": "Ouvrir le back-office",
  "onboarding.continue": "Continuer",
  "onboarding.back": "Retour",
  "onboarding.saveDraft": "Enregistrer et reprendre plus tard",
  "onboarding.savingDraft": "Enregistrement…",
  "onboarding.required": "Ce champ est obligatoire.",
  "onboarding.step1.title": "Votre maison",
  "onboarding.step1.body":
    "Le type de maison, son nom et ses coordonnées. Le fuseau horaire par défaut est Europe/Paris.",
  "onboarding.step2.title": "Horaires d'ouverture",
  "onboarding.step2.body":
    "Jusqu'à deux services par jour. Laissez une journée fermée en décochant son ouverture.",
  "onboarding.step3.title": "Réservations",
  "onboarding.step3.body":
    "Les valeurs par défaut appliquées à chaque nouvelle réservation.",
  "onboarding.step4.title": "Adresse publique",
  "onboarding.step4.body":
    "Le lien que vos clients utiliseront pour réserver en ligne.",
  "onboarding.field.type": "Type de maison",
  "onboarding.field.name": "Nom de la maison",
  "onboarding.field.namePlaceholder": "Le Petit Demo",
  "onboarding.field.address": "Adresse",
  "onboarding.field.addressPlaceholder": "12 rue des Halles, 75001 Paris",
  "onboarding.field.phone": "Téléphone",
  "onboarding.field.phonePlaceholder": "+33 1 42 00 00 00",
  "onboarding.field.timezone": "Fuseau horaire",
  "onboarding.field.logo": "Logo",
  "onboarding.field.logoHint": "PNG, JPG ou SVG, 2 Mo maximum.",
  "onboarding.field.logoUpload": "Choisir un logo",
  "onboarding.field.logoReplace": "Remplacer le logo",
  "onboarding.field.logoRemove": "Retirer",
  "onboarding.field.logoUploading": "Envoi du logo… {percent} %",
  "onboarding.field.logoError": "Le logo n'a pas pu être envoyé.",
  "onboarding.field.duration": "Durée par défaut d'une table (minutes)",
  "onboarding.field.partySize": "Taille de groupe maximale en ligne",
  "onboarding.field.buffer": "Marge entre deux rendez-vous (minutes)",
  "onboarding.field.slug": "Adresse publique",
  "onboarding.field.slugHint":
    "Lettres minuscules, chiffres et tirets. 60 caractères maximum.",
  "onboarding.slug.checking": "Vérification…",
  "onboarding.slug.available": "Cette adresse est disponible.",
  "onboarding.slug.taken":
    "Cette adresse est déjà utilisée par une autre maison.",
  "onboarding.slug.invalid":
    "Utilisez uniquement des lettres minuscules, des chiffres et des tirets.",
  "onboarding.slug.current": "Adresse actuelle",
  "onboarding.hours.open": "Ouvert",
  "onboarding.hours.closed": "Fermé",
  "onboarding.hours.service1": "Premier service",
  "onboarding.hours.service2": "Second service",
  "onboarding.hours.addService": "Ajouter un service",
  "onboarding.hours.removeService": "Retirer le service",
  "onboarding.hours.from": "Ouverture",
  "onboarding.hours.to": "Fermeture",
  "onboarding.hours.error": "L'heure de fermeture doit suivre l'ouverture.",
  "onboarding.hours.copy": "Copier sur les autres jours",
  "onboarding.hours.copied": "Horaires copiés.",
  "onboarding.weekday.0": "Lundi",
  "onboarding.weekday.1": "Mardi",
  "onboarding.weekday.2": "Mercredi",
  "onboarding.weekday.3": "Jeudi",
  "onboarding.weekday.4": "Vendredi",
  "onboarding.weekday.5": "Samedi",
  "onboarding.weekday.6": "Dimanche",
  "onboarding.error.save": "L'enregistrement a échoué. Merci de réessayer.",
  "onboarding.error.slugTaken":
    "Cette adresse est déjà utilisée par une autre maison. Choisissez-en une autre.",
  "onboarding.error.create": "La maison n'a pas pu être créée.",
  "onboarding.error.load": "La configuration n'a pas pu être chargée.",
} as const;

export type OnboardingKey = keyof typeof fr;

const en: Record<OnboardingKey, string> = {
  "onboarding.title": "Welcome to Maison",
  "onboarding.subtitle":
    "A few steps to prepare your house, its hours and its bookings.",
  "onboarding.step": "Step {step} of {total}",
  "onboarding.resume": "Resume setup",
  "onboarding.resumeBody":
    "Your house is saved. Finish the remaining steps to open the back office.",
  "onboarding.progress": "{done} of {total} steps complete",
  "onboarding.saved": "Draft saved",
  "onboarding.savedBody":
    "Your details are kept. You can pick up where you left off later.",
  "onboarding.finish": "Finish and open the back office",
  "onboarding.finishing": "Opening the back office…",
  "onboarding.done": "Your house is ready",
  "onboarding.doneBody": "Every step is complete. Welcome to your back office.",
  "onboarding.openBackOffice": "Open the back office",
  "onboarding.continue": "Continue",
  "onboarding.back": "Back",
  "onboarding.saveDraft": "Save and continue later",
  "onboarding.savingDraft": "Saving…",
  "onboarding.required": "This field is required.",
  "onboarding.step1.title": "Your house",
  "onboarding.step1.body":
    "The house type, its name and contact details. The default timezone is Europe/Paris.",
  "onboarding.step2.title": "Opening hours",
  "onboarding.step2.body":
    "Up to two services a day. Leave a day closed by unchecking its opening.",
  "onboarding.step3.title": "Bookings",
  "onboarding.step3.body": "The defaults applied to every new booking.",
  "onboarding.step4.title": "Public address",
  "onboarding.step4.body": "The link your guests will use to book online.",
  "onboarding.field.type": "House type",
  "onboarding.field.name": "House name",
  "onboarding.field.namePlaceholder": "Le Petit Demo",
  "onboarding.field.address": "Address",
  "onboarding.field.addressPlaceholder": "12 rue des Halles, 75001 Paris",
  "onboarding.field.phone": "Phone",
  "onboarding.field.phonePlaceholder": "+33 1 42 00 00 00",
  "onboarding.field.timezone": "Timezone",
  "onboarding.field.logo": "Logo",
  "onboarding.field.logoHint": "PNG, JPG or SVG, 2 MB maximum.",
  "onboarding.field.logoUpload": "Choose a logo",
  "onboarding.field.logoReplace": "Replace logo",
  "onboarding.field.logoRemove": "Remove",
  "onboarding.field.logoUploading": "Uploading logo… {percent}%",
  "onboarding.field.logoError": "The logo could not be uploaded.",
  "onboarding.field.duration": "Default table duration (minutes)",
  "onboarding.field.partySize": "Maximum online party size",
  "onboarding.field.buffer": "Buffer between appointments (minutes)",
  "onboarding.field.slug": "Public address",
  "onboarding.field.slugHint":
    "Lowercase letters, digits and dashes. 60 characters maximum.",
  "onboarding.slug.checking": "Checking…",
  "onboarding.slug.available": "This address is available.",
  "onboarding.slug.taken": "This address is already used by another house.",
  "onboarding.slug.invalid": "Use only lowercase letters, digits and dashes.",
  "onboarding.slug.current": "Current address",
  "onboarding.hours.open": "Open",
  "onboarding.hours.closed": "Closed",
  "onboarding.hours.service1": "First service",
  "onboarding.hours.service2": "Second service",
  "onboarding.hours.addService": "Add a service",
  "onboarding.hours.removeService": "Remove service",
  "onboarding.hours.from": "Opens",
  "onboarding.hours.to": "Closes",
  "onboarding.hours.error": "Closing time must follow opening time.",
  "onboarding.hours.copy": "Copy to other days",
  "onboarding.hours.copied": "Hours copied.",
  "onboarding.weekday.0": "Monday",
  "onboarding.weekday.1": "Tuesday",
  "onboarding.weekday.2": "Wednesday",
  "onboarding.weekday.3": "Thursday",
  "onboarding.weekday.4": "Friday",
  "onboarding.weekday.5": "Saturday",
  "onboarding.weekday.6": "Sunday",
  "onboarding.error.save": "Saving failed. Please try again.",
  "onboarding.error.slugTaken":
    "This address is already used by another house. Choose another one.",
  "onboarding.error.create": "The house could not be created.",
  "onboarding.error.load": "The setup could not be loaded.",
};

const COPY: Record<Language, Record<OnboardingKey, string>> = { fr, en };

export function onboardingCopy(
  language: Language,
  key: OnboardingKey,
  vars?: Record<string, string | number>,
): string {
  const template = COPY[language][key] ?? COPY.fr[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
