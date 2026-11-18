<script setup lang="ts">
/**
 * The Working Copy banner of an ACTIVE Resource (`12` §3, plan 2.3): always present, with a reserved one-line height, so
 * it never appears mid-typing and shifts the form. The text is short and fixed in length (D-089): what visitors see
 * until the copy is applied is said once, in the Status card, never by wrapping here. Three states: nothing pending ("No pending changes. Visitors see this
 * version."), unsaved edits, and a saved copy ("Pending changes saved 12:41 by you."). It holds Save draft and Discard
 * changes as real buttons that say why they are off. Save draft lives here and only here while the banner is in sight;
 * the header shows a compact one when the banner is out of sight (`hideSave` then hides this one, D-108). A short "Working Copy" hint explains the term once. Not shown for
 * DRAFT or ARCHIVED Resources.
 */
import { FilePen, Save, Trash2 } from "lucide-vue-next";
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import HelpHint from "@/components/ui/help-hint/HelpHint.vue";

const props = defineProps<{
  /** A Working Copy exists on the server. */
  hasCopy: boolean;
  /** The form differs from what is saved. */
  dirty: boolean;
  /** When the copy was last saved, already formatted. */
  savedAt?: string;
  /** "you" or "another author". */
  author?: string;
  busy: boolean;
  offline: boolean;
  /** The kind in a sentence: "point of interest". */
  kind: string;
  /** Set after an Apply that kept a different order or similar; shown once. */
  note?: string | null;
  /** The header carries a compact Save draft right now (the banner is out of sight): this one steps aside so there is only one (D-108). */
  hideSave?: boolean;
}>();
const emit = defineEmits<{ saveDraft: []; discard: [] }>();

const message = computed(() => {
  if (props.dirty) return "Visitors see the live version until you apply.";
  if (props.hasCopy) return `Pending changes saved ${props.savedAt ?? ""}${props.author ? ` by ${props.author}` : ""}.`;
  return "No pending changes.";
});
const saveReason = computed(() => (props.offline ? "You are offline" : props.busy ? "Working…" : !props.dirty ? "Nothing to save: no edits since the last save" : undefined));
const discardReason = computed(() => (props.offline ? "You are offline" : props.busy ? "Working…" : !props.hasCopy && !props.dirty ? "There are no pending changes to discard" : undefined));
</script>

<template>
  <div class="border-t border-border bg-card" data-working-copy-banner>
    <div class="flex h-10 items-center gap-x-3">
      <FilePen class="size-5 shrink-0" :class="dirty || hasCopy ? 'text-primary' : 'text-muted-foreground'" aria-hidden="true" />
      <p class="min-w-0 flex-1 truncate text-sm" :title="message">
        <span class="font-semibold">Working Copy.</span> <span>{{ message }}</span>
      </p>
      <HelpHint label="What is a Working Copy?">
        An active {{ kind }} is never edited in place. Your edits go to a private Working Copy; visitors keep seeing the live version until you choose Apply changes.
      </HelpHint>
      <div class="flex shrink-0 items-center gap-2">
        <Button v-show="!hideSave" variant="secondary" size="sm" data-banner-save :disabled-reason="saveReason" @click="emit('saveDraft')"><Save aria-hidden="true" /><span class="max-md:sr-only">Save draft</span></Button>
        <Button variant="ghost" size="sm" class="text-destructive" :disabled-reason="discardReason" @click="emit('discard')"><Trash2 aria-hidden="true" /><span class="max-md:sr-only">Discard changes</span></Button>
      </div>
    </div>
    <p v-if="note" class="pb-1 text-xs text-muted-foreground">{{ note }}</p>
  </div>
</template>
