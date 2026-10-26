<script setup lang="ts" generic="T extends EditableResource">
/**
 * Page frame of every Resource editor, arranged as the prototype's (AGENTS.md section 6, DECISIONS.md D-023): back
 * link, loading and error states, page head with the status and pending-changes chips and Save (DRAFT) or Apply
 * changes (ACTIVE), the working-copy banner with Save draft and Discard (spec 12 section 3, Resource editors), the
 * read-only banner for ARCHIVED Resources, the error summary, then a 760px form column beside a 310px side column:
 * Preview in app, Status and visibility, Translations, and Used in. Also the status-change, version-conflict, and
 * apply-conflict dialogs. The editor's own fields go in the default slot.
 */
import { computed, ref, watch } from "vue";
import type { RouteLocationRaw } from "vue-router";
import AppDialog from "@/components/AppDialog.vue";
import PageHead from "@/components/PageHead.vue";
import StatusChangeDialog from "@/components/StatusChangeDialog.vue";
import { Button } from "@/components/ui/button";
import ResourcePreview from "@/components/editor/ResourcePreview.vue";
import { formatDate } from "@/lib/format";
import { session } from "@/platform/auth";
import { describeIssue } from "@/platform/readiness";
import type { ResourceReference } from "@/platform/references";
import type { PreviewModel } from "@/workspace/preview";
import type { LanguageStatus } from "@/workspace/translationStatus";
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
  /**
   * The form opens with the language tabs of `TranslationsPanel`, so the side panels start level with the
   * first card below the tabs rather than with the tabs themselves.
   */
  tabbed?: boolean;
  /** The Resource as visitors would see it, from the live form; offers the "Preview" action when given. */
  preview?: PreviewModel | null;
  /** Per enabled language, how many of the kind's translated fields hold text; shown under Status. */
  translations?: LanguageStatus[];
}>();

const languageProgress = (s: LanguageStatus) =>
  s.filled === 0 ? "Missing" : s.filled === s.total ? "Complete" : `Partial (${s.filled} of ${s.total} fields)`;
const dotClass = (s: LanguageStatus) =>
  s.filled === 0 ? "border-2 border-gray-300 bg-white" : s.filled === s.total ? "bg-primary" : "bg-[#b26be3]";

const previewOpen = ref(false);

const editor = computed(() => props.editor);
const kind = computed(() => props.editor.kind);

const statusText = computed(() => {
  switch (editor.value.resource?.status) {
    case "DRAFT":
      return `Draft: only authors see it. ${props.activationHint}`;
    case "ACTIVE":
      return editor.value.workingCopy
        ? "Active: visitors see the live version. Your pending changes reach them only when you apply them."
        : "Active: visible to visitors while the application is live.";
    default:
      return "Archived: hidden from visitors and from the default lists.";
  }
});

const confirmCopy = computed(() =>
  editor.value.confirmTarget === "ARCHIVED"
    ? {
        heading: `Archive ${props.title}?`,
        body: `An archived ${kind.value} leaves the visitor app and the default lists. Restoring it makes it a draft again.${discardNote.value}`,
        action: "Archive",
      }
    : {
        heading: `Deactivate ${props.title}?`,
        body: `Visitors stop seeing it on their next refresh. It becomes a draft you can edit.${discardNote.value}`,
        action: "Deactivate",
      },
);
/** The language's display name for a readiness item, from the Translations panel's list when given. */
function languageName(code: string): string {
  return props.translations?.find((s) => s.language.languageCode === code)?.language.displayName ?? code;
}

const discardNote = computed(() => (editor.value.workingCopy ? " Its pending changes are discarded." : ""));

/** The last editor of the copy; a name needs the Audit Events of backend Milestone 7 (backend G-034). */
const copyAuthor = computed(() => {
  const copy = editor.value.workingCopy;
  if (!copy) return "";
  return copy.updatedBySubject === session.user?.subject ? "you" : "another author";
});

/** A conflicting value as one short line: text as is, lists by their size, anything else as JSON. */
function conflictValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (Array.isArray(value)) return value.length === 1 ? "1 item" : `${value.length} items`;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

const noLink = () => null;

/** "Point of interest · slug · version 14": the editor's subtitle, then the row's version. */
const meta = computed(() => {
  const resource = editor.value.resource;
  return resource ? `${props.subtitle} · version ${resource.version}` : props.subtitle;
});

/** The pending-changes chip of the head, while a working copy exists. */
const pendingChip = computed(() => {
  const copy = editor.value.workingCopy;
  return copy ? `Pending changes · edited by ${copyAuthor.value}, ${formatDate(copy.updatedAt)}` : undefined;
});

const statusLabel: Record<string, string> = { DRAFT: "Draft", ACTIVE: "Active", ARCHIVED: "Archived" };
const slug = computed(() => {
  const value = (editor.value.resource as { slug?: unknown } | null)?.slug;
  return typeof value === "string" && value ? value : null;
});

// Used in -----------------------------------------------------------------------------------------------------
// The where-used list (`GET .../references`) the archive check already reads, shown as the prototype's last card.

const usedIn = ref<ResourceReference[] | null>(null);
watch(
  () => [editor.value.resource?.id, editor.value.resource?.version, editor.value.resource?.status, editor.value.loadReferences] as const,
  async ([id], _old, onCleanup) => {
    let stale = false;
    onCleanup(() => (stale = true));
    const load = editor.value.loadReferences;
    if (!id || !load) {
      usedIn.value = null;
      return;
    }
    try {
      const found = await load();
      if (!stale) usedIn.value = found;
    } catch {
      if (!stale) usedIn.value = null;
    }
  },
  { immediate: true },
);
const kindLabel = (type: string) => type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ");
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
      <div class="max-w-[1090px]">
      <PageHead :title="title" :subtitle="meta" :status="editor.resource.status" :pending="pendingChip">
        <template #actions>
          <span v-if="editor.dirty" class="text-[11px] font-semibold text-[#9a6200]">Unsaved changes</span>
          <Button
            v-if="editor.usesWorkingCopy"
            :disabled="(!editor.workingCopy && !editor.dirty) || editor.saving || editor.applying"
            @click="editor.applyChanges(title)"
          >
            {{ editor.applying ? "Applying…" : "Apply changes" }}
          </Button>
          <Button v-else :disabled="!editor.editable || !editor.dirty || editor.saving" @click="editor.save()">
            {{ editor.saving ? "Saving…" : "Save" }}
          </Button>
        </template>
      </PageHead>

      <div
        v-if="editor.usesWorkingCopy && (editor.workingCopy || editor.dirty)"
        role="status"
        class="mb-5 flex flex-wrap items-center gap-3.5 rounded-lg border-l-[3px] border-l-[#9a6200] bg-[rgba(154,98,0,0.07)] px-[18px] py-3.5 text-[13px]"
      >
        <span class="text-[15px]" aria-hidden="true">✎</span>
        <div class="min-w-[min(100%,260px)] flex-1">
          <strong class="mb-0.5 block text-[13px] font-bold">You are editing a working copy</strong>
          <span class="text-gray-700">
            {{
              editor.workingCopy
                ? `Pending changes saved ${formatDate(editor.workingCopy.updatedAt)} by ${copyAuthor}. Visitors see the live version until you apply them.`
                : "Not saved yet. Visitors see the live version until you apply the changes."
            }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.06em] text-[#9a6200] disabled:opacity-50"
            :disabled="!editor.dirty || editor.saving || editor.applying"
            @click="editor.save()"
          >
            {{ editor.saving ? "Saving…" : "Save draft" }}
          </button>
          <button
            type="button"
            class="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.06em] text-destructive disabled:opacity-50"
            :disabled="editor.saving || editor.applying"
            @click="editor.discardChanges(title)"
          >
            Discard changes
          </button>
        </div>
      </div>

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

      <div v-if="editor.summary" role="alert" data-error-summary tabindex="-1" class="mb-5 max-w-[760px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
        <strong class="mb-2 block text-[13px] font-bold text-destructive">{{ editor.summary.title }}</strong>
        <ul class="flex flex-col gap-1.5">
          <li v-for="item in editor.summary.items" :key="item" class="text-[13px] text-destructive">• {{ item }}</li>
        </ul>
        <p v-if="editor.summary.requestId" class="mt-1.5 font-mono text-[11px] text-muted-foreground">Request id {{ editor.summary.requestId }}</p>
      </div>

      <!-- A 760px form beside the 310px side column, as in the prototype; below 1024px the side column follows. -->
      <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,760px)_310px]">
        <div class="flex min-w-0 flex-col gap-[18px]">
          <slot />
        </div>

        <!-- The side column starts level with the form's first card: below the language tab row (39px) and its
             gap (18px). With a preview, its button takes that row, as in the prototype. -->
        <aside class="flex min-w-0 flex-col gap-4" :class="{ 'lg:mt-[57px]': tabbed && !preview }">
          <div v-if="preview" class="flex flex-col gap-4" :class="{ 'lg:min-h-[41px]': tabbed }">
            <button
              type="button"
              class="self-start rounded-full border bg-card px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-primary shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-accent/40"
              :aria-expanded="previewOpen"
              aria-controls="resource-preview"
              @click="previewOpen = !previewOpen"
            >
              <span aria-hidden="true">⧉</span> {{ previewOpen ? "Close preview" : "Preview in app" }}
            </button>
            <ResourcePreview
              v-if="previewOpen"
              id="resource-preview"
              :model="preview"
              :dirty="editor.dirty"
            />
          </div>
          <section class="overflow-hidden rounded-lg border bg-card" aria-labelledby="status-heading">
            <div class="px-4 pb-1 pt-4">
              <h2 id="status-heading" class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-700">Status and visibility</h2>
            </div>
            <div class="flex flex-col gap-3 px-4 pb-4 pt-2 text-[13px]">
              <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[13px]">
                <dt class="text-muted-foreground">Status</dt>
                <dd class="text-right font-semibold uppercase tracking-[0.03em]">{{ statusLabel[editor.resource.status] ?? editor.resource.status }}</dd>
                <template v-if="slug">
                  <dt class="text-muted-foreground">Slug</dt>
                  <dd class="break-all text-right font-semibold">{{ slug }}</dd>
                </template>
                <dt class="text-muted-foreground">Version</dt>
                <dd class="text-right font-semibold">{{ editor.resource.version }}</dd>
                <dt class="text-muted-foreground">Last updated</dt>
                <dd class="text-right font-semibold">{{ formatDate(editor.resource.updatedAt) }}</dd>
                <dt class="text-muted-foreground">Created</dt>
                <dd class="text-right">{{ formatDate(editor.resource.createdAt) }}</dd>
              </dl>
              <p class="text-xs text-gray-700">{{ statusText }}</p>
              <div class="flex flex-col gap-2">
                <button
                  v-if="editor.resource.status === 'DRAFT'"
                  type="button"
                  class="w-full rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:opacity-90 disabled:opacity-50"
                  :disabled="editor.transitioning"
                  @click="editor.requestTransition('ACTIVE')"
                >
                  Activate
                </button>
                <button
                  v-else
                  type="button"
                  class="w-full rounded-full bg-primary px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:opacity-90 disabled:opacity-50"
                  :disabled="editor.transitioning"
                  @click="editor.requestTransition('DRAFT')"
                >
                  {{ editor.resource.status === "ACTIVE" ? "Deactivate" : "Restore" }}
                </button>
                <button
                  v-if="editor.resource.status !== 'ARCHIVED'"
                  type="button"
                  class="w-full rounded-full border border-destructive px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-destructive hover:bg-[rgba(192,24,94,0.05)] disabled:opacity-50"
                  :disabled="editor.transitioning"
                  @click="editor.requestTransition('ARCHIVED')"
                >
                  Archive
                </button>
              </div>
              <div v-if="editor.resource.status === 'ACTIVE'" class="border-t border-gray-100 pt-3">
                <h3 class="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">What needs attention</h3>
                <p v-if="!editor.readiness.length" class="text-xs text-muted-foreground">Nothing: visitors see a complete {{ kind }}.</p>
                <ul v-else class="flex flex-col gap-1.5">
                  <li v-for="(issue, i) in editor.readiness" :key="`${issue.code}-${issue.path}-${issue.languageCode}-${i}`">
                    <button
                      type="button"
                      class="flex w-full items-start gap-2 rounded text-left text-xs hover:bg-accent/40"
                      @click="editor.focusField(issue.path, issue.languageCode)"
                    >
                      <span
                        class="mt-px whitespace-nowrap rounded-full px-1.5 py-px text-[9px] font-extrabold uppercase tracking-[0.06em]"
                        :class="issue.blocking ? 'bg-[rgba(192,24,94,0.1)] text-destructive' : 'bg-[rgba(154,98,0,0.1)] text-[#9a6200]'"
                      >
                        {{ issue.blocking ? "Blocks" : "Warning" }}
                      </span>
                      <span>
                        {{ describeIssue(issue) }}
                        <span v-if="issue.languageCode" class="text-muted-foreground">({{ languageName(issue.languageCode) }})</span>
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </section>
          <section v-if="translations?.length" class="overflow-hidden rounded-lg border bg-card" aria-labelledby="translations-heading">
            <div class="border-b px-3.5 py-[11px]">
              <span id="translations-heading" class="text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">Translations</span>
            </div>
            <ul class="flex flex-col py-1.5">
              <li v-for="s in translations" :key="s.language.languageCode">
                <button
                  type="button"
                  class="flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left text-[13px] hover:bg-accent/40"
                  :aria-current="editor.activeLanguage === s.language.languageCode ? 'true' : undefined"
                  :title="`Edit the ${s.language.displayName} texts`"
                  @click="editor.activeLanguage = s.language.languageCode"
                >
                  <span class="h-2.5 w-2.5 flex-none rounded-full" :class="dotClass(s)" aria-hidden="true"></span>
                  <span :class="s.language.isDefault ? 'font-bold' : 'font-semibold'">{{ s.language.displayName }}</span>
                  <span v-if="s.language.isDefault" class="text-[10px] text-muted-foreground">default</span>
                  <span v-if="editor.activeLanguage === s.language.languageCode" class="text-[10px] font-bold text-primary">· editing</span>
                  <span class="ml-auto whitespace-nowrap text-[12px]" :class="s.filled === 0 ? 'text-destructive' : 'text-muted-foreground'">
                    {{ languageProgress(s) }}
                  </span>
                </button>
              </li>
            </ul>
          </section>
          <section v-if="usedIn" class="overflow-hidden rounded-lg border bg-card" aria-labelledby="used-in-heading">
            <div class="px-4 pb-1 pt-4">
              <h2 id="used-in-heading" class="text-[11px] font-extrabold uppercase tracking-[0.1em] text-gray-700">
                Used in ({{ usedIn.length }})
              </h2>
            </div>
            <p v-if="!usedIn.length" class="px-4 pb-4 pt-1 text-xs text-muted-foreground">Not used anywhere yet.</p>
            <ul v-else class="flex flex-col gap-1.5 px-4 pb-4 pt-1 text-[13px]">
              <li v-for="r in usedIn" :key="`${r.resourceType}-${r.resourceId}`">
                <RouterLink
                  v-if="referenceLink?.(r)"
                  :to="referenceLink(r)!"
                  class="text-primary no-underline hover:underline"
                >
                  {{ r.title }}
                </RouterLink>
                <span v-else>{{ r.title }}</span>
                <span class="text-muted-foreground"> · {{ kindLabel(r.resourceType) }}</span>
              </li>
            </ul>
          </section>
          <slot name="aside" />
        </aside>
      </div>
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

    <AppDialog
      v-if="editor.applyConflict"
      :title="`${title} changed since your pending changes were started`"
      width="640px"
      :busy="editor.saving || editor.applying"
      @close="editor.applyConflict = null"
    >
      <p class="text-[13px] text-gray-700">
        Someone else applied changes to this {{ kind }}. Choose, field by field, whether to keep yours or the current
        value. Your choices are saved as pending changes on the current version; apply them again when ready.
      </p>
      <p v-if="!editor.applyConflict.fields.length" class="mt-3 text-[13px] text-gray-700">
        No field differs: saving reopens your pending changes on the current version.
      </p>
      <fieldset v-for="field in editor.applyConflict.fields" :key="field.path" class="mt-3 rounded-md border px-3 py-2.5">
        <legend class="px-1 text-[12px] font-bold">{{ editor.describePath(field.path) }}</legend>
        <label class="flex items-start gap-2 py-1 text-[13px]">
          <input v-model="field.choice" type="radio" value="mine" class="mt-0.5" />
          <span><span class="font-semibold">Mine:</span> {{ conflictValue(field.mine) }}</span>
        </label>
        <label class="flex items-start gap-2 py-1 text-[13px]">
          <input v-model="field.choice" type="radio" value="current" class="mt-0.5" />
          <span><span class="font-semibold">Current:</span> {{ conflictValue(field.current) }}</span>
        </label>
      </fieldset>
      <template #actions>
        <button type="button" class="dialog-secondary" :disabled="editor.saving || editor.applying" @click="editor.discardChanges(title)">
          Discard my changes
        </button>
        <button type="button" class="dialog-primary bg-primary" :disabled="editor.saving || editor.applying" @click="editor.resolveApplyConflict()">
          Save my choices
        </button>
      </template>
    </AppDialog>

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
