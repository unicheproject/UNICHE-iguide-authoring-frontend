<script setup lang="ts">
/**
 * Confirmation before deactivating or archiving a Resource (iGuide spec 12, "Archive or deactivate"). When a
 * `loadReferences` function is given, the where-used list is loaded first; while it is not empty, still loading, or
 * could not be loaded, the action is disabled, and every entry links to where the reference is edited
 * (DECISIONS.md D-037).
 */
import { ExternalLink } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import type { RouteLocationRaw } from "vue-router";
import AppDialog from "@/components/AppDialog.vue";
import StatusChip from "@/components/StatusChip.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ResourceReference } from "@/platform/references";
import { referenceKindLabel } from "@/workspace/referenceLinks";

const props = defineProps<{
  heading: string;
  body: string;
  actionLabel: string;
  danger?: boolean;
  busy?: boolean;
  loadReferences?: () => Promise<ResourceReference[]>;
  /** References the backend returned with a 409 RESOURCE_IN_USE, which replace the loaded list. */
  blockedBy?: ResourceReference[] | null;
  linkFor: (reference: ResourceReference) => RouteLocationRaw | null;
  /** Why the action is off for a reason the dialog cannot see ("Add alt text in English first"); shown in place of the action. */
  blockedReason?: string;
  /** Where the author fixes `blockedReason`: a "Review in editor" link beside it. */
  reviewTo?: RouteLocationRaw | null;
  /** The heading once the action turns out to be blocked ("Can't archive Sculpture"); the action then offers only Close. */
  blockedHeading?: string;
}>();
const emit = defineEmits<{ confirm: []; close: [] }>();

const loaded = ref<ResourceReference[]>([]);
const loading = ref(false);
const loadFailed = ref(false);

async function check() {
  if (!props.loadReferences) return;
  loading.value = true;
  loadFailed.value = false;
  try {
    loaded.value = await props.loadReferences();
  } catch {
    // Any failure, the network included: what uses it is unknown, so the action stays off (`12` §3).
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}
onMounted(check);

/**
 * A Resource's own triggers (QR code, geo fence, NFC tag) never count as "used in" while the list is only being read
 * (D-090, C2-59); when the platform itself refuses because of them (`blockedBy`), they are shown as the refusal.
 */
const references = computed(() => props.blockedBy ?? loaded.value.filter((r) => r.resourceType !== "TRIGGER"));
const blocked = computed(() => references.value.length > 0);
const triggersOnly = computed(() => blocked.value && references.value.every((r) => r.resourceType === "TRIGGER"));
</script>

<template>
  <AppDialog :title="blocked && blockedHeading ? blockedHeading : heading" :busy="busy" size="md" @close="emit('close')">
    <p class="mb-4 text-sm text-ink-2">
      {{
        triggersOnly
          ? "It is still reached through the codes below. Deactivate them first, then try again."
          : blocked
            ? "It is still used by the items below. Remove it from them first, then try again."
            : blockedReason ?? body
      }}
    </p>
    <p v-if="blockedReason && reviewTo" class="mb-4 text-sm">
      <RouterLink :to="reviewTo" class="hit-44" @click="emit('close')">Review in editor</RouterLink>
    </p>

    <p v-if="loading" class="mb-4 animate-skeleton text-xs text-muted-foreground" role="status" aria-busy="true">Checking where it is used…</p>
    <Alert v-else-if="loadFailed && !blockedBy" tone="warning" class="mb-4">
      Where it is used could not be checked, so “{{ actionLabel }}” stays off until it can be.
      <template #actions>
        <Button variant="secondary" size="sm" @click="check">Try again</Button>
      </template>
    </Alert>

    <div v-if="blocked" class="mb-4 overflow-hidden rounded-lg border border-border">
      <h3 class="border-b border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">Used in</h3>
      <ul>
        <li v-for="r in references" :key="`${r.resourceType}-${r.resourceId}`" class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-2 text-sm last:border-b-0">
          <span class="min-w-28 text-xs font-semibold text-muted-foreground">{{ referenceKindLabel(r.resourceType) }}</span>
          <RouterLink v-if="linkFor(r)" :to="linkFor(r)!" class="inline-flex items-center gap-1" @click="emit('close')">
            {{ r.title }}<ExternalLink class="size-4" aria-hidden="true" /><span class="sr-only">(opens its editor)</span>
          </RouterLink>
          <span v-else>{{ r.title }}</span>
          <StatusChip :status="r.status" class="ml-auto" />
        </li>
      </ul>
    </div>

    <template #actions>
      <Button variant="secondary" :disabled="busy" @click="emit('close')">{{ blocked ? "Close" : "Cancel" }}</Button>
      <Button
        v-if="blocked"
        :variant="danger ? 'danger' : 'primary'"
        :disabled-reason="triggersOnly ? 'Deactivate the codes first' : 'Remove it from the items listed first'"
      >
        {{ actionLabel }}
      </Button>
      <Button
        v-else
        :variant="danger ? 'danger' : 'primary'"
        :loading="busy"
        :disabled-reason="blockedReason ?? (loading ? 'Checking where it is used' : loadFailed && !blockedBy ? 'Where it is used could not be checked' : undefined)"
        @click="emit('confirm')"
      >
        {{ actionLabel }}
      </Button>
    </template>
  </AppDialog>
</template>
