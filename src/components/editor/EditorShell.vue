<script setup lang="ts" generic="T extends EditableResource">
/**
 * Page frame of every Resource editor: back link, loading and error states, page head with Save, the
 * read-only banner for ACTIVE and ARCHIVED Resources, the error summary, the two-column layout with the
 * Status panel, and the status-change and version-conflict dialogs. The editor's own fields go in the
 * default slot.
 */
import { computed } from "vue";
import type { RouteLocationRaw } from "vue-router";
import AppDialog from "@/components/AppDialog.vue";
import PageHead from "@/components/PageHead.vue";
import StatusChangeDialog from "@/components/StatusChangeDialog.vue";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { ResourceReference } from "@/platform/references";
import type { EditableResource, ResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{
  editor: ResourceEditor<T>;
  backLabel: string;
  backTo: RouteLocationRaw;
  title: string;
  subtitle: string;
  /** What a draft still needs before it can be activated, shown in the Status panel. */
  activationHint: string;
  referenceLink?: (reference: ResourceReference) => RouteLocationRaw | null;
  /** Something else the page needs is still loading, such as the Project's languages. */
  pending?: boolean;
}>();

const editor = computed(() => props.editor);
const kind = computed(() => props.editor.kind);

const statusText = computed(() => {
  switch (editor.value.resource?.status) {
    case "DRAFT":
      return `Draft: only authors see it. ${props.activationHint}`;
    case "ACTIVE":
      return "Active: visible to visitors while the application is live.";
    default:
      return "Archived: hidden from visitors and from the default lists.";
  }
});

const confirmCopy = computed(() =>
  editor.value.confirmTarget === "ARCHIVED"
    ? {
        heading: `Archive ${props.title}?`,
        body: `An archived ${kind.value} leaves the visitor app and the default lists. Restoring it makes it a draft again.`,
        action: "Archive",
      }
    : {
        heading: `Deactivate ${props.title}?`,
        body: "Visitors stop seeing it on their next refresh. It becomes a draft you can edit.",
        action: "Deactivate",
      },
);

const noLink = () => null;
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <RouterLink :to="backTo" class="inline-block pb-1.5 text-xs font-bold tracking-[0.04em] text-primary no-underline hover:no-underline">
      ← {{ backLabel }}
    </RouterLink>

    <div v-if="editor.loading || pending" class="animate-skeleton" aria-busy="true" :aria-label="`Loading ${kind}`">
      <div class="mb-[26px] flex flex-col gap-[11px]">
        <div class="h-[25px] w-[min(55%,340px)] rounded-md bg-[#dcdde2]"></div>
        <div class="h-3 w-[min(78%,520px)] rounded bg-[#e6e7eb]"></div>
      </div>
      <div class="h-64 max-w-[760px] rounded-lg border bg-card"></div>
    </div>

    <div
      v-else-if="editor.loadError || !editor.resource"
      role="alert"
      class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4"
    >
      <strong class="block text-[13px] font-bold text-destructive">
        {{
          editor.loadError?.status === 404
            ? `This ${kind} does not exist in the Project`
            : editor.loadError?.platformUnavailable
              ? "The UNICHE platform is not reachable"
              : `The ${kind} could not be loaded`
        }}
      </strong>
      <p v-if="editor.loadError && editor.loadError.status !== 404" class="mt-1 text-[13px] text-gray-700">{{ editor.loadError.message }}</p>
      <p v-if="editor.loadError?.requestId" class="mt-1 font-mono text-[11px] text-muted-foreground">Request id {{ editor.loadError.requestId }}</p>
      <Button v-if="editor.loadError?.status !== 404" variant="outline" size="sm" class="mt-3" @click="editor.load()">Try again</Button>
    </div>

    <template v-else>
      <PageHead :title="title" :subtitle="subtitle" :status="editor.resource.status">
        <template #actions>
          <span v-if="editor.dirty" class="text-[11px] font-semibold text-[#9a6200]">Unsaved changes</span>
          <Button :disabled="!editor.editable || !editor.dirty || editor.saving" @click="editor.save()">
            {{ editor.saving ? "Saving…" : "Save" }}
          </Button>
        </template>
      </PageHead>

      <div
        v-if="!editor.editable"
        class="mb-5 flex flex-wrap items-center gap-3.5 rounded-lg border-l-[3px] border-l-[#9a6200] bg-[rgba(154,98,0,0.07)] px-[18px] py-3.5 text-[13px]"
      >
        <span class="text-[15px]" aria-hidden="true">✎</span>
        <div class="min-w-[min(100%,260px)] flex-1">
          <strong class="mb-0.5 block text-[13px] font-bold">
            {{ editor.resource.status === "ACTIVE" ? `This ${kind} is ACTIVE and visible to visitors` : `This ${kind} is archived` }}
          </strong>
          <span class="text-gray-700">
            {{
              editor.resource.status === "ACTIVE"
                ? "Editing it through pending changes is not available yet. Deactivate it to edit it as a draft."
                : "Restore it to edit it as a draft."
            }}
          </span>
        </div>
        <button
          type="button"
          class="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.06em] text-[#9a6200]"
          :disabled="editor.transitioning"
          @click="editor.requestTransition('DRAFT')"
        >
          {{ editor.resource.status === "ACTIVE" ? "Deactivate" : "Restore" }}
        </button>
      </div>

      <div v-if="editor.summary" role="alert" class="mb-5 max-w-[760px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
        <strong class="mb-2 block text-[13px] font-bold text-destructive">{{ editor.summary.title }}</strong>
        <ul class="flex flex-col gap-1.5">
          <li v-for="item in editor.summary.items" :key="item" class="text-[13px] text-destructive">• {{ item }}</li>
        </ul>
        <p v-if="editor.summary.requestId" class="mt-1.5 font-mono text-[11px] text-muted-foreground">Request id {{ editor.summary.requestId }}</p>
      </div>

      <div class="flex flex-wrap items-start gap-5">
        <div class="flex min-w-[min(100%,420px)] max-w-[760px] flex-1 flex-col gap-[18px]">
          <slot />
        </div>

        <aside class="flex w-[310px] flex-[0_0_310px] flex-col gap-4">
          <section class="overflow-hidden rounded-lg border bg-card">
            <div class="border-b px-3.5 py-[11px]">
              <span class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Status</span>
            </div>
            <div class="flex flex-col gap-3 px-3.5 py-3.5 text-[13px]">
              <p class="text-gray-700">{{ statusText }}</p>
              <div class="flex flex-wrap gap-2">
                <Button v-if="editor.resource.status === 'DRAFT'" size="sm" :disabled="editor.transitioning" @click="editor.requestTransition('ACTIVE')">
                  Activate
                </Button>
                <Button
                  v-if="editor.resource.status !== 'DRAFT'"
                  size="sm"
                  variant="outline"
                  :disabled="editor.transitioning"
                  @click="editor.requestTransition('DRAFT')"
                >
                  {{ editor.resource.status === "ACTIVE" ? "Deactivate" : "Restore" }}
                </Button>
                <button
                  v-if="editor.resource.status !== 'ARCHIVED'"
                  type="button"
                  class="px-2 text-[10px] font-bold uppercase tracking-[0.06em] text-destructive"
                  :disabled="editor.transitioning"
                  @click="editor.requestTransition('ARCHIVED')"
                >
                  Archive
                </button>
              </div>
              <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-gray-100 pt-3 text-xs">
                <dt class="text-muted-foreground">Created</dt>
                <dd>{{ formatDate(editor.resource.createdAt) }}</dd>
                <dt class="text-muted-foreground">Updated</dt>
                <dd>{{ formatDate(editor.resource.updatedAt) }}</dd>
                <dt class="text-muted-foreground">Version</dt>
                <dd class="font-mono">{{ editor.resource.version }}</dd>
              </dl>
            </div>
          </section>
          <slot name="aside" />
        </aside>
      </div>
    </template>

    <StatusChangeDialog
      v-if="editor.confirmTarget && editor.resource"
      :heading="confirmCopy.heading"
      :body="confirmCopy.body"
      :action-label="confirmCopy.action"
      :danger="editor.confirmTarget === 'ARCHIVED'"
      :busy="editor.transitioning"
      :load-references="editor.loadReferences"
      :blocked-by="editor.blockedBy"
      :link-for="referenceLink ?? noLink"
      @close="editor.confirmTarget = null"
      @confirm="editor.transition(editor.confirmTarget!)"
    />

    <AppDialog v-if="editor.conflict" :title="`Someone else changed this ${kind}`" width="560px" :busy="editor.saving" @close="editor.conflict = null">
      <p class="text-[13px] text-gray-700">
        It was saved by someone else while you were editing
        {{ editor.conflict.currentVersion !== null ? `(it is now version ${editor.conflict.currentVersion})` : "" }}. Reload to
        see their version and lose your changes, or keep your changes and save them over theirs.
      </p>
      <template #actions>
        <button type="button" class="dialog-secondary" :disabled="editor.saving" @click="editor.reloadDiscardingChanges()">
          Reload their version
        </button>
        <button
          v-if="editor.conflict.currentVersion !== null"
          type="button"
          class="dialog-primary bg-primary"
          :disabled="editor.saving"
          @click="editor.overwrite()"
        >
          Keep my changes
        </button>
      </template>
    </AppDialog>
  </main>
</template>
