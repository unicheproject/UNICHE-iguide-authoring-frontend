<script setup lang="ts">
/**
 * Activation always confirms (plan 2.3, D-074). The dialog names the item, says what visitors will see, lists the
 * blockers and warnings the completeness model already knows (`platform/completeness.ts`, D-090, D-107: the same list
 * and the one sentence of the header count, the card and the toast, said once), grouped by kind with structural gaps
 * ("This Route has no stops") first, every line a link that closes the dialog, opens its section and focuses the
 * field. It offers "Save and activate" when the form is unsaved, and shows the platform's refusal
 * (`422 MISSING_REQUIRED_FIELDS`) inside itself with every missing field as a link that does the same (`14` §4).
 */
import { CircleAlert } from "lucide-vue-next";
import { computed } from "vue";
import AppDialog from "@/components/AppDialog.vue";
import ReadinessList, { type ReadinessLine } from "@/components/editor/ReadinessList.vue";
import { Alert, ProblemAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  /** The item's title. */
  title: string;
  /** "point of interest", for sentences. */
  kind: string;
  /** What the editor knows is missing before it asks the platform. */
  lines: ReadinessLine[];
  /** The form has unsaved changes: the primary action saves first. */
  dirty: boolean;
  busy: boolean;
  offline: boolean;
  /** The platform's refusal: field path to message, with the request id. */
  refusal: { fields: Record<string, string>; requestId: string | null } | null;
  describePath: (path: string) => string;
  /** Why Activate is off even though the platform has not been asked ("Add alt text in English first"). */
  blockedReason?: string;
  /** A failure that is not a missing-field refusal (503, 403, offline): shown here as "Not activated", the dialog stays open. */
  failure?: unknown;
}>();
const emit = defineEmits<{ close: []; confirm: [saveFirst: boolean]; goto: [path: string]; go: [line: ReadinessLine]; review: [] }>();

const refusedFields = computed(() => Object.entries(props.refusal?.fields ?? {}));
const blocking = computed(() => props.lines.filter((l) => l.blocking).length);
const confirmReason = computed(() => (props.offline ? "You are offline" : props.blockedReason));
</script>

<template>
  <AppDialog :title="`Activate ${title}?`" size="md" :busy="busy" @close="emit('close')">
    <p class="text-sm text-ink-2">
      <strong class="font-semibold">{{ title }}</strong> goes from draft to active. Visitors will see this {{ kind }} on their next refresh of the app.
      You can deactivate it again at any time; it then returns to draft.
    </p>

    <div class="mt-4">
      <ReadinessList
        headless
        interactive
        plus-checks
        heading="Before you activate"
        :lines="lines"
        :empty-text="`Nothing is known to be missing. The platform checks the ${kind} when you confirm.`"
        @select="(line) => emit('go', line)"
      />
      <p v-if="blocking" class="mt-2 text-xs text-muted-foreground">
        The platform will probably refuse until the blocking items are fixed; you will see its answer here.
      </p>
      <Button v-if="lines.length" variant="secondary" size="sm" class="mt-3" @click="emit('review')">Review in editor</Button>
    </div>

    <Alert v-if="refusal" tone="danger" title="Not activated" :request-id="refusal.requestId" class="mt-4">
      <ul class="flex flex-col gap-1">
        <li v-for="[path, message] in refusedFields" :key="path">
          <button v-if="path" type="button" class="flex items-start gap-1.5 rounded-md text-left underline underline-offset-2 hover:no-underline" @click="emit('goto', path)">
            <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{ describePath(path) }}: {{ message }}
          </button>
          <span v-else>{{ message }}</span>
        </li>
        <li v-if="!refusedFields.length">Check the texts and try again.</li>
      </ul>
    </Alert>

    <ProblemAlert v-if="failure" :error="failure" :action="`activate the ${kind}`" title="Not activated" class="mt-4" @retry="emit('confirm', dirty)" />

    <template #actions>
      <Button variant="secondary" :disabled="busy" @click="emit('close')">Cancel</Button>
      <Button variant="primary" :loading="busy" :disabled-reason="confirmReason" @click="emit('confirm', dirty)">
        {{ busy ? (dirty ? "Saving and activating…" : "Activating…") : dirty ? "Save and activate" : "Activate" }}
      </Button>
    </template>
  </AppDialog>
</template>
