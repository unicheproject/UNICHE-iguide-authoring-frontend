import type { StoryBlock } from "@/platform/guides";

/** A story block in the form, with a stable list key that is never sent to the API. */
export type StoryBlockForm = StoryBlock & { key: string };

let keyCounter = 0;
export function newBlockKey(): string {
  return `b-${++keyCounter}`;
}

export function blocksToForm(blocks: StoryBlock[] | undefined): StoryBlockForm[] {
  return (blocks ?? []).map((b) => ({ ...b, key: newBlockKey() }));
}

export function blocksForApi(blocks: StoryBlockForm[]): StoryBlock[] {
  return blocks.map(({ key: _key, ...block }) => block as StoryBlock);
}
