import type { ComputedRef, InjectionKey } from "vue";
import type { ProjectLanguage } from "./languages";

/**
 * The one model of "things to fix" (D-090, C2-33, C2-34): what blocks activating a Resource, what only deserves
 * attention, and how far each language is written. The language tabs, the Translations card, the header count, the
 * Activate confirm, the toast, the list translation dots and the Dashboard all read this file, so the same Resource
 * never shows two different numbers. It counts the fields of the Resource itself, Route stop texts, Guide story
 * blocks and the alternative text of images. DRAFT and ACTIVE Resources are counted the same way; the platform's
 * readiness only adds what the browser cannot know (references, surfaces, templates).
 *
 * Pure functions on plain data: nothing here reads the DOM, the router or the network.
 */

/** How many things are wrong, split by whether they stop activation. */
export interface IssueCounts {
  blockers: number;
  warnings: number;
}

/** One problem the author can act on, with where to go to fix it (the shape `ReadinessList` shows). */
export interface CompletenessLine {
  key: string;
  blocking: boolean;
  /** The kind of problem, for grouping: "Texts" or "Media". */
  group: string;
  text: string;
  /** Field path to move focus to; empty when only the language tab can be named. */
  path: string;
  languageCode: string | null;
  /**
   * The gap belongs to the shape of the Resource, not to a language ("This Route has no stops"). The Activate confirm
   * names these first, in a sentence of their own (D-107).
   */
  structural?: boolean;
}

/** One text a Resource needs in each language of the Project. */
export interface TextSlot {
  key: string;
  /** "Title", "Stop 2: Narrative". */
  label: string;
  /** "Texts" for words, "Media" for the alternative text of an image. */
  group: "Texts" | "Media";
  /** The field's path in one language, for moving focus to it. */
  path: (languageCode: string) => string;
  /** What is written, by language code. */
  values: Readonly<Record<string, string | null | undefined>>;
  /** Missing in the default language it blocks activation; elsewhere it is a warning. */
  required?: boolean;
}

/** A gap that belongs to the Resource, not to a language: a Guide with no story blocks. */
export interface StructureGap {
  key: string;
  text: string;
  path: string;
}

/** Texts the editor has already counted per language (title, summary, ...), when it cannot say which are missing. */
export interface LanguageCount {
  languageCode: string;
  filled: number;
  total: number;
}

export interface CompletenessInput {
  languages: readonly ProjectLanguage[];
  /**
   * Whether a default language with none of the editor's counted texts blocks activation ("no text yet"). Default
   * true, except for a Resource whose slots include alternative text: an Asset is blocked by missing alt text or by
   * not being marked decorative, never by a missing title (`14` §4; the backend has no title code for assets, D-107).
   */
  baseBlocks?: boolean;
  base?: readonly LanguageCount[];
  slots?: readonly TextSlot[];
  /** Gaps counted once, in the default language (G-039 until the platform has a readiness code for them). */
  gaps?: readonly StructureGap[];
  /**
   * Gaps that stop activation, counted once and shown as blockers: a Route none of whose stops is an ACTIVE point of
   * interest (`ROUTE_WITHOUT_ACTIVE_STOP` blocks in the platform), so the header, card and confirm agree with the editor's own alert.
   */
  blocking?: readonly StructureGap[];
}

/** How far one language is written, for the tab mark and the Translations card. */
export interface LanguageCompleteness {
  language: ProjectLanguage;
  filled: number;
  total: number;
  state: "complete" | "partial" | "missing";
  /** "Complete", "Missing" or "3 of 5". */
  mark: string;
}

export interface Completeness {
  blockers: CompletenessLine[];
  warnings: CompletenessLine[];
  perLanguage: LanguageCompleteness[];
  /** Blockers first, then warnings. */
  lines: CompletenessLine[];
  counts: IssueCounts;
  /** Whether alternative texts are part of this model (the platform's own alternative-text issues are then dropped). */
  coversAlt: boolean;
}

const filledIn = (slot: TextSlot, code: string) => !!slot.values[code]?.trim();
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function stateOf(filled: number, total: number): LanguageCompleteness["state"] {
  if (total === 0 || filled >= total) return "complete";
  return filled === 0 ? "missing" : "partial";
}

/**
 * Counts what is missing in every language.
 *
 * - A required slot empty in the default language is a blocker, one line each.
 * - A language with none of the editor's counted texts, in the default language, is a blocker ("no text yet").
 * - Everything else missing is a warning, one line per language and kind: "Italiano: 4 texts missing".
 * - A gap (an empty story) is one warning.
 */
export function completenessOf(input: CompletenessInput): Completeness {
  const blockers: CompletenessLine[] = [];
  const warnings: CompletenessLine[] = [];
  const perLanguage: LanguageCompleteness[] = [];
  const slots = input.slots ?? [];
  const gaps = input.gaps ?? [];
  const baseBlocks = input.baseBlocks ?? !slots.some((s) => s.group === "Media");
  const defaultCode0 = input.languages.find((l) => l.isDefault)?.languageCode ?? null;
  for (const gap of input.blocking ?? []) {
    blockers.push({ key: `block-${gap.key}`, blocking: true, group: "Links", text: gap.text, path: gap.path, languageCode: defaultCode0 });
  }

  for (const language of input.languages) {
    const code = language.languageCode;
    const base = input.base?.find((b) => b.languageCode === code);
    const baseMissing = base ? Math.max(0, base.total - base.filled) : 0;
    const missingSlots = slots.filter((s) => !filledIn(s, code));
    const gapCount = language.isDefault ? gaps.length : 0;
    const total = (base?.total ?? 0) + slots.length + gapCount;
    const filled = (base?.filled ?? 0) + (slots.length - missingSlots.length);
    const state = stateOf(filled, total);
    perLanguage.push({ language, filled, total, state, mark: state === "complete" ? "Complete" : state === "missing" ? "Missing" : `${filled} of ${total}` });

    const name = language.displayName;
    if (language.isDefault) {
      for (const slot of missingSlots.filter((s) => s.required)) {
        blockers.push({ key: `slot-${slot.key}-${code}`, blocking: true, group: slot.group, text: `${slot.label} is missing in ${name}`, path: slot.path(code), languageCode: code });
      }
      if (baseBlocks && base && base.total > 0 && base.filled === 0) {
        blockers.push({ key: `base-${code}`, blocking: true, group: "Texts", text: `${name} (default): no text yet`, path: "", languageCode: code });
      }
    }
    const optional = missingSlots.filter((s) => !(language.isDefault && s.required));
    const baseWarning = language.isDefault && baseBlocks && base && base.filled === 0 ? 0 : baseMissing;
    for (const group of ["Texts", "Media"] as const) {
      const ofGroup = optional.filter((s) => s.group === group);
      const count = ofGroup.length + (group === "Texts" ? baseWarning : 0);
      if (!count) continue;
      const text =
        group === "Texts"
          ? `${name}: ${plural(count, "text", "texts")} missing`
          : `${name}: ${plural(count, "image", "images")} without alternative text`;
      warnings.push({ key: `warn-${group}-${code}`, blocking: false, group, text, path: ofGroup[0]?.path(code) ?? "", languageCode: code });
    }
  }
  // Structural gaps are listed before the translation warnings: they say more about the Resource (D-107).
  warnings.unshift(...gaps.map<CompletenessLine>((gap) => structuralLine(gap, defaultCode0)));
  return {
    blockers,
    warnings,
    perLanguage,
    lines: [...blockers, ...warnings],
    counts: { blockers: blockers.length, warnings: warnings.length },
    coversAlt: slots.some((s) => s.group === "Media"),
  };
}

function structuralLine(gap: StructureGap, languageCode: string | null): CompletenessLine {
  return { key: `gap-${gap.key}`, blocking: false, group: "Structure", text: gap.text, path: gap.path, languageCode, structural: true };
}

/**
 * Adds structural gaps the editor's own model does not carry (a Route with no stops, an Event with no dates) as the
 * first warnings, once each (D-107). Returns the model itself when nothing is to be added.
 */
export function withGaps(model: Completeness, gaps: readonly StructureGap[], defaultLanguageCode: string | null): Completeness {
  const fresh = gaps.filter((g) => !model.lines.some((l) => l.key === `gap-${g.key}`));
  if (!fresh.length) return model;
  const warnings = [...fresh.map((g) => structuralLine(g, defaultLanguageCode)), ...model.warnings];
  return { ...model, warnings, lines: [...model.blockers, ...warnings], counts: { blockers: model.blockers.length, warnings: warnings.length } };
}

/** The platform's readiness codes whose texts the completeness model already counts per language, so they are not counted twice (D-107). */
const MODEL_TEXT_CODES = new Set(["MISSING_TRANSLATION", "MISSING_ACCESSIBILITY_INFORMATION"]);

/**
 * Whether a platform readiness item is already part of the completeness model: a text of a language the model counts
 * (missing translation, accessibility information) or the alternative text of an image when the model has alt slots.
 * Such an item is dropped when the platform's list is merged in, so one problem is one line, before and after
 * activation (D-107, C3-14).
 */
export function coveredByModel(item: { code: string; path: string; languageCode: string | null }, model: Completeness): boolean {
  if (item.code === "MISSING_ALTERNATIVE_TEXT") return model.coversAlt;
  if (!MODEL_TEXT_CODES.has(item.code) || !/^translations\.[^.]+\.[^.]+$/.test(item.path)) return false;
  const code = item.languageCode ?? /^translations\.([^.]+)/.exec(item.path)?.[1] ?? "";
  return model.perLanguage.some((l) => l.language.languageCode === code && l.total > 0);
}

/** Counts a list of lines (or any items marked `blocking`). */
export function countIssues(issues: readonly { blocking: boolean }[]): IssueCounts {
  const blockers = issues.filter((i) => i.blocking).length;
  return { blockers, warnings: issues.length - blockers };
}

/**
 * The one sentence for a count (D-090): "3 to fix before activating, 4 warnings", "4 warnings, nothing blocks",
 * "Nothing to fix". An ACTIVE Resource is already live, so its blockers read "3 to fix".
 */
export function issueSentence(counts: IssueCounts, options: { active?: boolean } = {}): string {
  const { blockers, warnings } = counts;
  const warn = plural(warnings, "warning", "warnings");
  if (blockers) {
    const fix = options.active ? `${blockers} to fix` : `${blockers} to fix before activating`;
    return warnings ? `${fix}, ${warn}` : fix;
  }
  return warnings ? `${warn}, nothing blocks` : "Nothing to fix";
}

// Slots of the kinds whose texts are not plain fields -----------------------------------------------------------

/** What a stop of a Route holds per language; only the texts a translator writes. */
export interface StopTextsLike {
  translations: Readonly<Record<string, Partial<Record<"description" | "navigationInstructions" | "narrative", string | null>> | undefined>>;
}

const STOP_FIELDS = [
  { key: "description", label: "Description" },
  { key: "navigationInstructions", label: "Walking instructions" },
  { key: "narrative", label: "Narrative" },
] as const;

/** The texts of every Route stop as slots: "Stop 2: Narrative" (C2-33). */
export function routeStopSlots(stops: readonly StopTextsLike[]): TextSlot[] {
  return stops.flatMap((stop, index) =>
    STOP_FIELDS.map<TextSlot>((field) => ({
      key: `stop-${index}-${field.key}`,
      label: `Stop ${index + 1}: ${field.label}`,
      group: "Texts",
      path: (code) => `stops[${index}].translations.${code}.${field.key}`,
      values: Object.fromEntries(Object.entries(stop.translations).map(([code, t]) => [code, t?.[field.key]])),
    })),
  );
}

/** A Guide's block, as far as completeness cares. */
export interface StoryBlockLike {
  blockType: string;
}

/** An empty story is one warning until the platform has a readiness code for it (G-039). */
export function storyGaps(blocks: readonly StoryBlockLike[]): StructureGap[] {
  return blocks.some((b) => b.blockType === "TEXT") ? [] : [{ key: "story", text: "This Guide has an empty story. Visitors will see a guide with no text.", path: "blocks" }];
}

/** A Route with no stop is one warning (`12` §3: it activates; Q-021 asks whether it should block). */
export function routeGaps(stopCount: number): StructureGap[] {
  return stopCount ? [] : [{ key: "stops", text: "This Route has no stops. Visitors will see an empty route.", path: "stops" }];
}

/** An Event with no date is one warning (`12` §3; Q-021). */
export function eventGaps(occurrenceCount: number): StructureGap[] {
  return occurrenceCount ? [] : [{ key: "dates", text: "This Event has no dates. Visitors will not see when it happens.", path: "occurrences" }];
}

/** An Asset, as far as completeness cares. */
export interface AssetLike {
  type: string;
  decorative: boolean;
  translations: Readonly<Record<string, { title?: string | null; alternativeText?: string | null } | undefined>>;
}

const isPicture = (asset: AssetLike) => asset.type === "IMAGE" || asset.type === "FLOOR_PLAN";

/** The alternative text of an image that is not decorative, as a slot; none for other media. Required for IMAGE only. */
export function assetAltSlots(asset: AssetLike): TextSlot[] {
  if (!isPicture(asset) || asset.decorative) return [];
  return [
    {
      key: "alt",
      label: "Alternative text",
      group: "Media",
      path: (code) => `translations.${code}.alternativeText`,
      values: Object.fromEntries(Object.entries(asset.translations).map(([code, t]) => [code, t?.alternativeText])),
      required: asset.type === "IMAGE",
    },
  ];
}

/** Whether an Asset still needs text work in a language: no title, or an image without alternative text. */
export function assetNeedsText(asset: AssetLike, languageCode: string): boolean {
  return !asset.translations[languageCode]?.title?.trim() || assetAltSlots(asset).some((s) => !s.values[languageCode]?.trim());
}

/**
 * The slots and gaps that follow from the shape of a saved Resource, whichever kind it is: a Route's stops, a Guide's
 * blocks, an Asset's alternative text. A kind with none returns nothing. This reads the saved Resource; an editor that
 * holds a live form passes its own slots to {@link completenessOf} instead.
 */
export function structureOf(resource: unknown): { slots: TextSlot[]; gaps: StructureGap[] } {
  const r = (typeof resource === "object" && resource !== null ? resource : {}) as Record<string, unknown>;
  if (Array.isArray(r.stops)) return { slots: routeStopSlots(r.stops as StopTextsLike[]), gaps: routeGaps(r.stops.length) };
  if (Array.isArray(r.occurrences)) return { slots: [], gaps: eventGaps(r.occurrences.length) };
  if (Array.isArray(r.blocks) && r.blocks.every((b) => typeof b === "object" && b !== null && "blockType" in b)) {
    return { slots: [], gaps: storyGaps(r.blocks as StoryBlockLike[]) };
  }
  if (typeof r.type === "string" && typeof r.decorative === "boolean" && typeof r.translations === "object") {
    return { slots: assetAltSlots(r as unknown as AssetLike), gaps: [] };
  }
  return { slots: [], gaps: [] };
}

/** Provided by `EditorShell` so the language tabs of `TranslationsPanel` show the same marks as the Translations card. */
export const EDITOR_COMPLETENESS: InjectionKey<ComputedRef<Completeness>> = Symbol("editor-completeness");
