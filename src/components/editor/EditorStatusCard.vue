<script setup lang="ts">
/**
 * The Status card of the editor side column (plan 2.3): the status chip, one sentence about what it means for
 * visitors, the one lifecycle button (Activate on a DRAFT, Deactivate on an ACTIVE Resource, Restore on an ARCHIVED one)
 * with its disabled reason stated, then kind, slug (a hint says what the slug is), revision (always: the server's
 * revision, "Revision 1" from creation), updated (a Working Copy save counts) and created. When Deactivate is off
 * because other items use this one, the reason is followed by a "Show where it is used" link to the Used in card
 * (C3-19). Archive lives in the header's More menu. Nothing here repeats the item's name. It is a `SideCard` (D-109).
 */
import { Power, PowerOff, RotateCcw } from "lucide-vue-next";
import { computed } from "vue";
import SideCard from "@/components/editor/SideCard.vue";
import StatusChip from "@/components/StatusChip.vue";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

const props = defineProps<{
  status: string;
  /** What this status means for visitors, one sentence. */
  sentence: string;
  /** "Point of interest", shown above the details. */
  kindLabel: string;
  version: number;
  updatedAt: string;
  createdAt: string;
  slug: string | null;
  busy: boolean;
  offline: boolean;
  /** Why Deactivate and Archive are off right now: a full sentence ("Used by 1 route. Choose another category in that route first."). */
  blockedReason?: string;
  /** Why Activate is off before the platform is asked ("Add alt text in English first"). */
  activateBlockedReason?: string;
  /** The form has unsaved changes: a DRAFT's Activate then reads "Save and activate". */
  dirty: boolean;
  /** A DRAFT can be activated only while it can be edited and saved. */
  editable: boolean;
  /** Inside the narrow-layout summary card: no card chrome of its own. */
  flat?: boolean;
}>();
const emit = defineEmits<{ activate: []; deactivate: []; restore: []; showUsed: [] }>();

/** The slug cut after each hyphen, so a long one wraps between words and never in the middle of one. */
const slugParts = computed(() => (props.slug ?? "").split(/(?<=-)/));
const reason = computed(() => (props.offline ? "You are offline" : props.busy ? "Working…" : undefined));
</script>

<template>
  <SideCard title="Status" heading-id="status-card-heading" :flat="flat">
    <template #actions><StatusChip :status="status" /></template>
    <p class="text-sm text-ink-2">{{ sentence }}</p>

    <div class="mt-3">
      <Button v-if="status === 'DRAFT'" :variant="dirty ? 'secondary' : 'primary'" class="w-full" :disabled-reason="reason ?? activateBlockedReason" @click="emit('activate')">
        <Power aria-hidden="true" />{{ dirty ? "Save and activate" : "Activate" }}
      </Button>
      <Button v-else-if="status === 'ACTIVE'" variant="secondary" class="w-full" :disabled-reason="reason ?? blockedReason" @click="emit('deactivate')">
        <PowerOff aria-hidden="true" />Deactivate
      </Button>
      <Button v-else variant="primary" class="w-full" data-focus-fallback :disabled-reason="reason" @click="emit('restore')">
        <RotateCcw aria-hidden="true" />Restore as draft
      </Button>
      <p v-if="status === 'ACTIVE' && blockedReason" class="mt-1.5 text-xs text-muted-foreground" data-blocked-reason>
        {{ blockedReason }}
        <button type="button" class="ml-1 rounded-sm font-medium text-primary underline underline-offset-2 hover:no-underline" data-show-used @click="emit('showUsed')">Show where it is used</button>
      </p>
      <p v-if="status === 'DRAFT' && activateBlockedReason" class="mt-1.5 text-xs text-muted-foreground" data-blocked-reason>{{ activateBlockedReason }}.</p>
    </div>

    <dl class="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-border pt-3 text-sm">
      <dt class="text-muted-foreground">Kind</dt>
      <dd class="text-right">{{ kindLabel }}</dd>
      <template v-if="slug">
        <dt class="text-muted-foreground">Slug</dt>
        <dd class="mono break-words text-right" :title="slug">
          <template v-for="(part, i) in slugParts" :key="i"><wbr v-if="i" />{{ part }}</template>
        </dd>
      </template>
      <dt class="text-muted-foreground">Revision</dt>
      <dd class="tabular text-right" data-revision>{{ version + 1 }}</dd>
      <dt class="text-muted-foreground">Updated</dt>
      <dd class="tabular text-right">{{ formatDateTime(updatedAt) }}</dd>
      <dt class="text-muted-foreground">Created</dt>
      <dd class="tabular text-right">{{ formatDateTime(createdAt) }}</dd>
    </dl>
    <p v-if="slug" class="mt-2 text-xs text-muted-foreground">The slug is part of the item's web address.</p>
  </SideCard>
</template>
