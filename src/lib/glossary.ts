/**
 * The CMS's vocabulary in one place (plan 2.7, D-069). Lifecycle words follow the specs (`DRAFT`, `ACTIVE`,
 * `ARCHIVED`, shown in sentence case); "published" is never used. The field label stays "Slug" (spec `12` §3).
 */

/** Words an author reads for the lifecycle values. */
export const lifecycleWord: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

/** Terms the interface uses for domain concepts, and what they stand for in the specs. */
export const glossary = {
  /** `Working Copy` appears to authors as "pending changes". */
  pendingChanges: "Pending changes",
  workingCopy: "Working Copy",
  /** Readiness appears as these three phrases, never "readiness". */
  needsAttention: "What needs attention",
  beforeActivate: "Before you activate",
  ready: "Ready",
  visitorApp: "Visitor app",
  slug: "Slug",
  slugHint: "Part of the item's web address",
  contentRevision: "Content revision",
  workingCopyTerm: "Working Copy",
  geoProximity: "Geo-proximity",
  beacon: "Beacon",
  trigger: "Trigger",
  revision: "Revision",
  internalName: "Internal name",
  organisation: "Organisation",
  /** Round 3 (A11): the words other packages need, so none of them edits this file. */
  previewContent: { working: "Working", live: "Live" },
  fireTrigger: "Fire a trigger",
  previewSurface: "Surface",
  launchPlaceholder: "Content is ready; going live is not available yet",
  readinessChecksOnActivation: "plus checks run on activation",
  translationsWorklist: "Translations to do",
  bounds: "Map bounds",
  visitorFilter: "Visitor filter",
} as const;

/** Explanations for `HelpHint` popovers, written once. */
export const hints = {
  workingCopy:
    "An active item is edited in a private copy. Visitors keep seeing the active version until you apply your changes.",
  slug: "The part of the item's web address that names it. Lower-case letters, digits and hyphens.",
  exhibitCode: "The number or code printed next to the object in the venue, if it has one.",
  internalName: "A name only authors see, to tell similar items apart in lists.",
  /** What "Content revision N" counts: the revision of the Project's content the visitor app shows (round 2, C2-28). */
  contentRevision:
    "The number of the version of this Project's content that the visitor app shows. It goes up each time active content changes.",
  /** The list filter "Pending changes": items whose active version has unapplied edits. */
  pendingChangesFilter:
    "Shows active items with saved edits that visitors do not see yet. Apply the changes to show them in the visitor app.",
  geoProximity:
    "A trigger that opens this item in the visitor app when the visitor comes within a radius of a point on the map.",
  beacon: "A trigger that opens this item in the visitor app when the visitor's device detects a Bluetooth beacon placed at the item.",
  previewSurface:
    "The kind of device the visitor app is drawn for: web, mobile or kiosk. The preview shows the same content in each layout.",
  trigger: "A way a visitor reaches this item in the visitor app: scanning a QR code, coming near a place, or detecting a beacon.",
  visitorAppVsApplication:
    "The visitor app is what visitors use. The Application is the Catalogue's record of it, with a status the platform controls.",
  revision: "A saved version of an item. Each save adds one; the number lets the CMS notice when someone else saved first.",
  previewContent:
    "Working shows the content as you are editing it, including saved drafts. Live shows what visitors see now.",
  fireTrigger: "Opens the item as a visitor would arrive through one of its triggers: a QR code, a place or a beacon.",
  launchPlaceholder: "Going live is a step the platform controls and it is not available in this CMS yet. Your content stays ready.",
  readinessChecksOnActivation:
    "The platform also checks the item when you activate it. It can add problems that are not listed here yet.",
  translationsWorklist: "Every text that is missing in a language you offer, grouped by language, so you can work through one language at a time.",
  bounds: "The rectangle of the map that the visitor app opens on. Items outside it can still be reached from lists.",
  visitorFilter: "Visitors can narrow lists in the visitor app by this value.",
} as const;

/** The Draft/Active/Archived word for a lifecycle value; other values are title-cased. */
export function statusWord(status: string): string {
  return lifecycleWord[status.toUpperCase()] ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
