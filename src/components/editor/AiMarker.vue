<script setup lang="ts">
/*
 * The AI marker of one machine-translated part in one language (`12` §3, DECISIONS.md D-026, D-027): who generated
 * it and when, its review, the gateway's citations, and "Mark reviewed" while it is unreviewed.
 */
import { Check, TriangleAlert } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { AiProvenanceEntry } from "@/platform/ai";

const props = defineProps<{
  entry: AiProvenanceEntry;
  /** Names the part when the item has several, e.g. "Stop 2" or "Story". */
  label?: string;
  reviewing: boolean;
  disabled: boolean;
}>();
defineEmits<{ review: [] }>();

const unreviewed = () => !props.entry.provenance.reviewedAt;

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const formatDateTime = (iso: string | null) => (iso && !Number.isNaN(new Date(iso).getTime()) ? dateTimeFormat.format(new Date(iso)) : "—");

/** A citation as the gateway returns it: a string, or an object with a title and a link. */
function citationOf(citation: unknown): { text: string; href: string | null } {
  if (typeof citation === "string") return { text: citation, href: /^https?:\/\//.test(citation) ? citation : null };
  if (citation && typeof citation === "object") {
    const c = citation as Record<string, unknown>;
    const href = typeof c.url === "string" ? c.url : typeof c.uri === "string" ? c.uri : null;
    const text = [c.title, c.label, c.source, href].find((v) => typeof v === "string" && v.trim()) as string | undefined;
    return { text: text ?? JSON.stringify(citation), href };
  }
  return { text: String(citation), href: null };
}
</script>

<template>
  <div class="rounded-lg border px-4 py-3 text-xs text-ink-2" :class="unreviewed() ? 'border-warning/30 bg-warning-tint' : 'border-border bg-muted'">
    <div class="flex flex-wrap items-center gap-2">
      <Chip :tone="unreviewed() ? 'warning' : 'neutral'" :icon="unreviewed() ? TriangleAlert : Check">
        {{ unreviewed() ? "AI, unreviewed" : "AI, reviewed" }}{{ entry.pending ? ", pending" : "" }}
      </Chip>
      <span>
        <strong v-if="label" class="font-semibold">{{ label }}: </strong>
        Machine-translated by {{ entry.provenance.serviceId ?? "the AI gateway" }}
        <template v-if="entry.provenance.sourceLanguage"> from {{ entry.provenance.sourceLanguage }}</template>
        on {{ formatDateTime(entry.provenance.generatedAt) }}<template v-if="entry.provenance.reviewedAt">;
        reviewed on {{ formatDateTime(entry.provenance.reviewedAt) }}</template>.
      </span>
      <Button
        v-if="unreviewed()"
        variant="secondary"
        size="sm"
        class="ml-auto"
        :loading="reviewing"
        :disabled-reason="disabled ? 'This item cannot be edited' : undefined"
        @click="$emit('review')"
      >
        {{ reviewing ? "Marking…" : "Mark reviewed" }}
      </Button>
    </div>
    <p v-if="unreviewed()" class="mt-1.5 text-muted-foreground">
      Check the text, then mark it reviewed; saving a change to it counts as a review too.
    </p>
    <div class="mt-1.5">
      <span class="font-semibold">Citations:</span>
      <span v-if="!entry.provenance.citations?.length" class="text-muted-foreground"> No citations returned.</span>
      <ul v-else class="mt-0.5 list-disc pl-5">
        <li v-for="(citation, i) in entry.provenance.citations" :key="i" class="break-words">
          <a v-if="citationOf(citation).href" :href="citationOf(citation).href!" target="_blank" rel="noopener noreferrer">
            {{ citationOf(citation).text }}
          </a>
          <template v-else>{{ citationOf(citation).text }}</template>
        </li>
      </ul>
    </div>
  </div>
</template>
