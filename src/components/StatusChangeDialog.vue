<script setup lang="ts">
/**
 * Confirmation before deactivating or archiving a Resource (iGuide spec 12, "Archive or deactivate"). When a
 * `loadReferences` function is given, the where-used list is loaded first; while it is not empty, still loading, or
 * could not be loaded, the action is disabled, and every entry links to where the reference is edited
 * (DECISIONS.md D-037).
 */
import { computed, onMounted, ref } from "vue";
import type { RouteLocationRaw } from "vue-router";
import AppDialog from "@/components/AppDialog.vue";
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

const references = computed(() => props.blockedBy ?? loaded.value);
const blocked = computed(() => references.value.length > 0);
</script>

<template>
  <AppDialog :title="heading" :busy="busy" @close="emit('close')">
    <p class="mb-4 text-[13px] text-gray-700">
      {{ blocked ? "It is still used by the resources below. Remove it from them first, then try again." : body }}
    </p>

    <p v-if="loading" class="mb-4 animate-skeleton text-[12px] text-muted-foreground" aria-busy="true">Checking where it is used…</p>
    <div v-else-if="loadFailed && !blockedBy" role="alert" class="mb-4 flex items-center gap-3 text-[12px] font-semibold text-[#9a6200]">
      <p>Where it is used could not be checked, so “{{ actionLabel }}” stays off until it can be.</p>
      <button type="button" class="shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold text-gray-700" @click="check">
        Try again
      </button>
    </div>

    <div v-if="blocked" class="mb-[18px] overflow-hidden rounded-lg border">
      <div class="border-b bg-muted px-3.5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
        Used in
      </div>
      <ul>
        <li v-for="r in references" :key="`${r.resourceType}-${r.resourceId}`" class="flex gap-2.5 border-b border-gray-100 px-3.5 py-2.5 text-[13px] last:border-b-0">
          <span class="min-w-[110px] text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            {{ referenceKindLabel(r.resourceType) }}
          </span>
          <RouterLink v-if="linkFor(r)" :to="linkFor(r)!" @click="emit('close')">{{ r.title }} ↗</RouterLink>
          <span v-else>{{ r.title }}</span>
          <span class="ml-auto text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">{{ r.status }}</span>
        </li>
      </ul>
    </div>

    <template #actions>
      <button
        type="button"
        class="rounded-full border bg-muted px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gray-700"
        :disabled="busy"
        @click="emit('close')"
      >
        {{ blocked ? "Close" : "Cancel" }}
      </button>
      <button
        v-if="!blocked"
        type="button"
        class="rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-white disabled:opacity-60"
        :class="danger ? 'bg-destructive' : 'bg-primary'"
        :disabled="busy || loading || (loadFailed && !blockedBy)"
        @click="emit('confirm')"
      >
        {{ actionLabel }}
      </button>
    </template>
  </AppDialog>
</template>
