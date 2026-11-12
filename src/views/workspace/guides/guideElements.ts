/**
 * The Guide story as one flat list of elements, the way the author edits it (DECISIONS.md D-065): paragraphs,
 * headings, images, and references, each placed and moved on its own. The API keeps its own shape (`03` §11,
 * D-031): TEXT blocks holding rich text per language, and REFERENCE blocks. Loading spreads every TEXT block into
 * its nodes; saving joins each run of consecutive text elements back into one TEXT block, so a reference can sit
 * between any two paragraphs. Elements are shared by every language: a paragraph has a text per language, an image
 * is the same asset in all of them.
 */
import type { GuideBlock, GuideItemType, StoryBlock } from "@/platform/guides";

export type ElementKind = "paragraph" | "heading" | "image" | "reference";

export interface ElementForm {
  /** Stable list key, never sent. */
  key: string;
  kind: ElementKind;
  /** The saved block it came from: its REFERENCE block, or the TEXT block that held it. Kept so block ids survive. */
  blockId: string | null;
  /** Heading level. */
  level: 2 | 3;
  /** Image asset. */
  assetId: string | null;
  /** Paragraph or heading text per language. */
  texts: Record<string, string>;
  resourceType: GuideItemType | null;
  resourceId: string | null;
  /** Reference caption per language. */
  captions: Record<string, string>;
}

let counter = 0;

export function newElement(kind: ElementKind, init: Partial<Omit<ElementForm, "key" | "kind">> = {}): ElementForm {
  return {
    key: `ge-${++counter}`,
    kind,
    blockId: null,
    level: 2,
    assetId: null,
    texts: {},
    resourceType: null,
    resourceId: null,
    captions: {},
    ...init,
  };
}

/**
 * Spreads the saved blocks into elements. A TEXT block's languages are aligned node by node, the default language
 * first; a node that does not line up with the element at its position (another type, another image) becomes an
 * element of its own, so no text is lost.
 */
export function elementsFromBlocks(blocks: GuideBlock[], languageOrder: string[]): ElementForm[] {
  const out: ElementForm[] = [];
  for (const block of blocks) {
    if (block.blockType === "REFERENCE") {
      out.push(
        newElement("reference", {
          blockId: block.id,
          resourceType: block.resourceType,
          resourceId: block.resourceId,
          captions: Object.fromEntries(Object.entries(block.translations).map(([code, t]) => [code, t.caption ?? ""])),
        }),
      );
      continue;
    }
    const present = Object.keys(block.translations);
    const codes = [...new Set([...languageOrder.filter((c) => present.includes(c)), ...present])];
    const elements: ElementForm[] = [];
    for (const code of codes) {
      const nodes: StoryBlock[] = block.translations[code]?.text?.blocks ?? [];
      nodes.forEach((node, i) => {
        const slot = elements[i];
        const fits =
          slot &&
          slot.kind === node.type &&
          (node.type === "image" ? slot.assetId === node.assetId : slot.texts[code] === undefined && (node.type !== "heading" || slot.level === node.level));
        if (fits) {
          if (node.type !== "image") slot.texts[code] = node.text;
          return;
        }
        if (node.type === "image" && elements.some((e) => e.kind === "image" && e.assetId === node.assetId)) return;
        elements.push(
          node.type === "image"
            ? newElement("image", { blockId: block.id, assetId: node.assetId })
            : newElement(node.type, { blockId: block.id, level: node.type === "heading" ? node.level : 2, texts: { [code]: node.text } }),
        );
      });
    }
    out.push(...elements);
  }
  return out;
}

export interface StoryLayout {
  /** The blocks as the API takes them. */
  blocks: GuideBlock[];
  /** Per element, the request paths whose errors belong to it (node paths without the field suffix). */
  paths: Map<string, string[]>;
}

/** Joins the elements into the API's blocks, every given language carried so an emptied one is cleared. */
export function blocksFromElements(elements: ElementForm[], codes: string[]): StoryLayout {
  const blocks: GuideBlock[] = [];
  const paths = new Map<string, string[]>();
  const usedIds = new Set<string>();
  const takeId = (id: string | null) => {
    if (!id || usedIds.has(id)) return null;
    usedIds.add(id);
    return id;
  };
  let run: ElementForm[] = [];

  const flush = () => {
    if (!run.length) return;
    const index = blocks.length;
    const at = `blocks[${index}]`;
    let id: string | null = null;
    for (const e of run) id ??= takeId(e.blockId);
    for (const e of run) paths.set(e.key, []);
    // Errors about the whole TEXT block show on its first element.
    paths.get(run[0].key)!.push(at, ...codes.map((c) => `${at}.translations.${c}.text`), ...codes.map((c) => `${at}.translations.${c}`));
    const translations = Object.fromEntries(
      codes.map((code) => {
        // A language with nothing written in this run sends no text. Otherwise every element keeps its place, an
        // untranslated one as blank text, so the languages still line up node by node when the Guide is read back.
        const written = run.some((e) => (e.kind === "image" ? !!e.assetId : !!e.texts[code]?.trim()));
        const nodes: StoryBlock[] = [];
        for (const e of run) {
          if (!written) break;
          const text = e.texts[code] ?? "";
          const node: StoryBlock | null =
            e.kind === "image"
              ? e.assetId
                ? { type: "image", assetId: e.assetId }
                : null
              : e.kind === "heading"
                ? { type: "heading", level: e.level, text }
                : { type: "paragraph", text };
          if (!node) continue;
          paths.get(e.key)!.push(`${at}.translations.${code}.text.blocks[${nodes.length}]`);
          nodes.push(node);
        }
        return [code, { text: nodes.length ? { blocks: nodes } : null, caption: null }];
      }),
    );
    blocks.push({ id, blockType: "TEXT", resourceType: null, resourceId: null, translations });
    run = [];
  };

  for (const e of elements) {
    if (e.kind !== "reference") {
      run.push(e);
      continue;
    }
    flush();
    const at = `blocks[${blocks.length}]`;
    paths.set(e.key, [at, `${at}.blockType`, `${at}.resourceType`, `${at}.resourceId`, ...codes.map((c) => `${at}.translations.${c}.caption`)]);
    blocks.push({
      id: takeId(e.blockId),
      blockType: "REFERENCE",
      resourceType: e.resourceType,
      resourceId: e.resourceId,
      translations: Object.fromEntries(codes.map((code) => [code, { text: null, caption: e.captions[code]?.trim() || null }])),
    });
  }
  flush();
  return { blocks, paths };
}
