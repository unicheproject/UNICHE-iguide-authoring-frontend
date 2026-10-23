<script setup lang="ts">
/*
 * Visitor app → Translations (`12` §3 Translation workspace, DECISIONS.md D-021): a matrix of every Resource and
 * media item by language, and an editor that shows the default language beside the target language, field by field.
 * Each save sends one language through the per-language endpoints (backend D-031, D-032): a DRAFT is written in
 * place, an ACTIVE Resource into its working copy, which the author applies in its editor.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import StoryEditor from "@/components/editor/StoryEditor.vue";
import { blocksForApi, blocksToForm, type StoryBlockForm } from "@/components/editor/StoryEditor";
import { Button } from "@/components/ui/button";
import { statusChipStyle } from "@/lib/format";
import { ApiError } from "@/platform/api";
import { listAssets, type Asset } from "@/platform/assets";
import { toApiBody, type GuideBody } from "@/platform/guides";
import {
  putAssetTranslation,
  putBlockTranslation,
  putStopTranslation,
  putTranslation,
  type TranslationSaved,
  type TranslationVersions,
} from "@/platform/translations";
import { fetchWorkingCopy } from "@/platform/workingCopies";
import { askConfirm } from "@/stores/confirm";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { findSection } from "@/workspace/sections";
import {
  editorLocation,
  itemFromResponse,
  itemProgress,
  KINDS,
  loadItems,
  STOP_FIELDS,
  type CatalogKind,
  type ItemState,
  type TranslationItem,
} from "@/workspace/translationCatalog";
import { useProjectLanguages } from "@/workspace/useProjectLanguages";

const section = findSection("translations")!;
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const { languages, defaultLanguage, loading: languagesLoading } = useProjectLanguages(projectId);

// Loading -------------------------------------------------------------------------------------------------------

const items = ref<TranslationItem[]>([]);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  loadError.value = null;
  try {
    items.value = await loadItems(projectId.value, defaultLanguage.value, controller.signal);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    loadError.value = e;
  } finally {
    loading.value = false;
  }
}
watch([projectId, defaultLanguage], () => {
  if (defaultLanguage.value !== null || !languagesLoading.value) void load();
}, { immediate: true });
onBeforeUnmount(() => controller?.abort());

// Filters -------------------------------------------------------------------------------------------------------

const targets = computed(() => languages.value.filter((l) => !l.isDefault));
const target = ref<string | null>(null);
watch(targets, (list) => {
  if (!target.value || !list.some((l) => l.languageCode === target.value)) target.value = list[0]?.languageCode ?? null;
}, { immediate: true });
const targetInfo = computed(() => languages.value.find((l) => l.languageCode === target.value) ?? null);
const sourceInfo = computed(() => languages.value.find((l) => l.isDefault) ?? null);

const kindFilter = ref<"ALL" | CatalogKind>("ALL");
const stateFilter = ref<"ALL" | ItemState>("ALL");
const query = ref("");
const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const rows = computed(() => {
  const q = normalize(query.value.trim());
  return items.value.filter((item) => {
    if (item.status === "ARCHIVED") return false;
    if (kindFilter.value !== "ALL" && item.kind !== kindFilter.value) return false;
    if (stateFilter.value !== "ALL" && target.value && itemProgress(item, target.value).state !== stateFilter.value) return false;
    return !q || normalize(item.title).includes(q);
  });
});
const kindLabel = (kind: CatalogKind) => KINDS.find((k) => k.kind === kind)!;

const STATE_LABEL: Record<ItemState, string> = { complete: "Complete", partial: "Partial", missing: "Missing" };
const dotClass = (state: ItemState) =>
  state === "complete" ? "bg-primary" : state === "partial" ? "bg-[#b26be3]" : "border-2 border-gray-300 bg-white";

function cellText(item: TranslationItem, code: string): string {
  const p = itemProgress(item, code);
  return p.state === "partial" ? `${p.filled} of ${p.total}` : STATE_LABEL[p.state];
}

// Editor --------------------------------------------------------------------------------------------------------

const selected = ref<TranslationItem | null>(null);
const versions = ref<TranslationVersions>({ version: 0, workingCopyVersion: null });
const opening = ref(false);
const saving = ref(false);
const errors = ref<Record<string, string>>({});
const errorSummary = ref<string | null>(null);
const assets = ref<Asset[]>([]);

const form = reactive({
  texts: {} as Record<string, string>,
  stops: {} as Record<string, Record<string, string>>,
  story: [] as StoryBlockForm[],
});
const snapshot = ref("");
const serialize = () => JSON.stringify({ texts: form.texts, stops: form.stops, story: blocksForApi(form.story) });
const dirty = computed(() => snapshot.value !== "" && serialize() !== snapshot.value);
const editable = computed(() => !!selected.value && selected.value.status !== "ARCHIVED" && !!target.value);

function resetForm() {
  const item = selected.value;
  const code = target.value;
  errors.value = {};
  errorSummary.value = null;
  if (!item || !code) {
    snapshot.value = "";
    return;
  }
  form.texts = Object.fromEntries(item.fields.map((field) => [field.key, item.texts[code]?.[field.key] ?? ""]));
  form.stops = Object.fromEntries(
    (item.stops ?? []).filter((s) => s.id).map((s) => [s.id!, Object.fromEntries(STOP_FIELDS.map((field) => [field.key, s.texts[code]?.[field.key] ?? ""]))]),
  );
  form.story = blocksToForm(item.story?.bodies[code]?.blocks ?? []);
  snapshot.value = serialize();
}
watch(target, resetForm);

async function confirmDiscard(): Promise<boolean> {
  return (
    !dirty.value ||
    askConfirm({
      title: "Leave without saving?",
      body: "Your unsaved translations are lost.",
      confirmLabel: "Leave without saving",
      cancelLabel: "Keep editing",
      danger: true,
    })
  );
}

/** Opens a Resource in the target language; an ACTIVE one with pending changes shows the changes. */
async function open(item: TranslationItem, language?: string) {
  if (selected.value?.id === item.id && selected.value.kind === item.kind && (!language || language === target.value)) return;
  if (!(await confirmDiscard())) return;
  if (language && language !== defaultLanguage.value) target.value = language;
  opening.value = true;
  try {
    let current = item;
    versions.value = { version: item.version, workingCopyVersion: null };
    if (item.kind !== "assets" && item.hasWorkingCopy) {
      try {
        const copy = await fetchWorkingCopy(projectId.value, item.kind, item.id);
        if (copy.resource) {
          current = { ...itemFromResponse(item.kind, copy.resource, defaultLanguage.value, item), status: item.status, hasWorkingCopy: true };
        }
        versions.value = { version: copy.liveVersion, workingCopyVersion: copy.version };
      } catch (e) {
        if (!(e instanceof ApiError) || e.status !== 404) throw e;
      }
    }
    if (current.kind === "guides" && !assets.value.length) assets.value = await listAssets(projectId.value);
    replace(current);
    selected.value = current;
    resetForm();
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    showToast("The resource could not be opened", e.platformUnavailable ? "The UNICHE platform is not reachable." : e.message, "error");
  } finally {
    opening.value = false;
  }
}

function replace(item: TranslationItem) {
  items.value = items.value.map((i) => (i.kind === item.kind && i.id === item.id ? item : i));
}

/** The next Resource in the current order whose target language is not complete. */
async function nextMissing() {
  const code = target.value;
  if (!code) return;
  const list = rows.value;
  const start = selected.value ? list.findIndex((i) => i.kind === selected.value!.kind && i.id === selected.value!.id) : -1;
  for (let step = 1; step <= list.length; step++) {
    const candidate = list[(start + step) % list.length];
    if (itemProgress(candidate, code).state !== "complete") {
      await open(candidate);
      return;
    }
  }
  showToast("Nothing missing", `Every listed resource is complete in ${targetInfo.value?.displayName ?? code}.`);
}

const textOrNull = (value: string) => value.trim() || null;

/** One request per changed part: the Resource's fields, the story, each changed stop. */
async function save() {
  const item = selected.value;
  const code = target.value;
  if (!item || !code || !dirty.value) return;
  const before = JSON.parse(snapshot.value) as { texts: Record<string, string>; stops: Record<string, Record<string, string>>; story: unknown };
  saving.value = true;
  errors.value = {};
  errorSummary.value = null;
  let last: TranslationSaved | null = null;
  let current = item;
  const apply = (saved: TranslationSaved) => {
    last = saved;
    if (saved.workingCopyVersion !== null) {
      versions.value = { ...versions.value, workingCopyVersion: saved.workingCopyVersion };
    } else {
      versions.value = { version: (saved.resource as { version: number }).version, workingCopyVersion: null };
    }
  };
  try {
    if (JSON.stringify(before.texts) !== JSON.stringify(form.texts)) {
      const fields = Object.fromEntries(Object.entries(form.texts).map(([k, v]) => [k, textOrNull(v)]));
      if (item.kind === "assets") {
        const raw = await putAssetTranslation(projectId.value, item.id, code, fields, versions.value.version);
        apply({ resource: raw, workingCopyVersion: null });
      } else {
        apply(await putTranslation(projectId.value, item.kind, item.id, code, fields, versions.value));
      }
    }
    const storyBlocks = blocksForApi(form.story);
    if (item.story && JSON.stringify(before.story) !== JSON.stringify(storyBlocks)) {
      if (!item.story.blockId) throw new Error("NO_STORY_BLOCK");
      const body: GuideBody = { blocks: storyBlocks };
      apply(await putBlockTranslation(projectId.value, item.id, item.story.blockId, code,
        { text: storyBlocks.length ? toApiBody(body) : null }, versions.value));
    }
    for (const [stopId, texts] of Object.entries(form.stops)) {
      if (JSON.stringify(before.stops[stopId]) === JSON.stringify(texts)) continue;
      const fields = Object.fromEntries(Object.entries(texts).map(([k, v]) => [k, textOrNull(v)]));
      apply(await putStopTranslation(projectId.value, item.id, stopId, code, fields, versions.value));
    }
    if (last) {
      const saved = last as TranslationSaved;
      current = {
        ...itemFromResponse(item.kind, saved.resource, defaultLanguage.value, item),
        status: item.status,
        hasWorkingCopy: item.hasWorkingCopy || saved.workingCopyVersion !== null,
      };
      replace(current);
      selected.value = current;
      resetForm();
    }
    showToast(
      "Translation saved",
      current.status === "ACTIVE" ? "Saved as pending changes: visitors see them once you apply them in the editor." : "",
    );
  } catch (e) {
    if (e instanceof Error && e.message === "NO_STORY_BLOCK") {
      errorSummary.value = "This guide has no story yet. Write it in the default language in the guide editor first.";
    } else if (!(e instanceof ApiError)) {
      throw e;
    } else if (e.code === "VERSION_CONFLICT") {
      showToast("Someone else changed this resource", "It was reloaded with their version; enter your translation again.", "warning");
      snapshot.value = "";
      selected.value = null;
      await load();
      const fresh = items.value.find((i) => i.kind === item.kind && i.id === item.id);
      if (fresh) await open(fresh);
    } else {
      errors.value = e.fieldMessages();
      errorSummary.value = e.platformUnavailable ? "The UNICHE platform is not reachable. Your text is still in the form." : e.message;
    }
  } finally {
    saving.value = false;
  }
}

/** A field error from the backend, whose paths are like `translations.en.title` or `stops[2].translations.en.narrative`. */
function fieldError(key: string, stopIndex?: number): string | undefined {
  const code = target.value;
  const prefix = stopIndex === undefined ? "" : `stops[${stopIndex}].`;
  return errors.value[`${prefix}translations.${code}.${key}`] ?? (stopIndex === undefined ? errors.value[key] : undefined);
}
const noFieldError = () => undefined;

// Leave guard ---------------------------------------------------------------------------------------------------

onBeforeRouteLeave(() => confirmDiscard());
function onBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) event.preventDefault();
}
onMounted(() => window.addEventListener("beforeunload", onBeforeUnload));
onBeforeUnmount(() => window.removeEventListener("beforeunload", onBeforeUnload));

const isSelected = (item: TranslationItem) => selected.value?.kind === item.kind && selected.value.id === item.id;
const storyText = (body: GuideBody | null | undefined) =>
  (body?.blocks ?? []).map((b) => (b.type === "image" ? "[image]" : b.text)).filter((t) => t.trim());
</script>

<template>
  <main class="min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead title="Translations" :subtitle="section.subtitle" />

    <div v-if="!languagesLoading && !targets.length" class="max-w-[640px] rounded-lg border bg-card px-[18px] py-4 text-[13px] text-gray-700">
      The Project has only one language. Add a language in App settings → Languages to translate into it.
    </div>

    <template v-else>
      <!-- Toolbar -->
      <div class="mb-3.5 flex flex-wrap items-center gap-2.5">
        <label class="flex items-center gap-2 text-[12px] font-semibold text-gray-700">
          Translate into
          <select v-model="target" class="rounded-lg border-[1.5px] px-2.5 py-[7px] text-[13px]">
            <option v-for="l in targets" :key="l.languageCode" :value="l.languageCode">{{ l.displayName }} ({{ l.languageCode }})</option>
          </select>
        </label>
        <span v-if="sourceInfo" class="text-[11px] text-muted-foreground">from {{ sourceInfo.displayName }}, the default language</span>
        <input
          v-model="query"
          type="search"
          aria-label="Search titles"
          placeholder="Search titles"
          class="ml-auto min-w-[200px] rounded-lg border-[1.5px] px-3 py-[7px] text-[13px] focus:border-primary focus:outline-none"
        />
      </div>
      <div class="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filter by kind">
        <button
          v-for="chip in [{ kind: 'ALL', label: 'All' }, ...KINDS] as { kind: 'ALL' | CatalogKind; label: string }[]"
          :key="chip.kind"
          type="button"
          class="rounded-full border px-[13px] py-1.5 text-[11px]"
          :class="kindFilter === chip.kind ? 'border-primary bg-primary font-bold text-white' : 'bg-card font-semibold text-gray-700'"
          :aria-pressed="kindFilter === chip.kind"
          @click="kindFilter = chip.kind"
        >
          {{ chip.label }}
        </button>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by state in the target language">
        <button
          v-for="chip in (['ALL', 'missing', 'partial', 'complete'] as const)"
          :key="chip"
          type="button"
          class="rounded-full border px-[13px] py-1.5 text-[11px]"
          :class="stateFilter === chip ? 'border-primary bg-primary font-bold text-white' : 'bg-card font-semibold text-gray-700'"
          :aria-pressed="stateFilter === chip"
          @click="stateFilter = chip"
        >
          {{ chip === "ALL" ? "Any state" : STATE_LABEL[chip] }}
        </button>
        <button type="button" disabled class="rounded-full border px-[13px] py-1.5 text-[11px] font-semibold text-gray-400" aria-describedby="ai-reason">
          Unreviewed AI output
        </button>
        <span id="ai-reason" class="text-[11px] text-muted-foreground">AI translation needs the UNICHE AI gateway, which is not connected yet.</span>
      </div>

      <div v-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
        <strong class="block text-[13px] font-bold text-destructive">The resources could not be loaded</strong>
        <p class="mt-1 text-[13px] text-gray-700">{{ loadError.message }}</p>
        <Button variant="outline" size="sm" class="mt-3" @click="load">Try again</Button>
      </div>

      <div v-else class="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <!-- Matrix -->
        <section class="overflow-hidden rounded-lg border bg-card" aria-labelledby="matrix-heading">
          <h2 id="matrix-heading" class="sr-only">Translation state by language</h2>
          <div v-if="loading" class="animate-skeleton" aria-busy="true" aria-label="Loading resources">
            <div v-for="n in 5" :key="n" class="border-b border-gray-100 px-[18px] py-4"><div class="h-[13px] w-1/2 rounded bg-[#e2e3e7]"></div></div>
          </div>
          <p v-else-if="!rows.length" class="px-[18px] py-6 text-[13px] text-muted-foreground">
            {{ items.length ? "No resource matches the filters." : "There is no content to translate yet." }}
          </p>
          <div v-else class="max-h-[70vh] overflow-auto">
            <table class="w-full border-collapse text-[13px]">
              <thead class="sticky top-0 bg-card">
                <tr>
                  <th class="th px-[18px] text-left">Resource</th>
                  <th v-for="l in languages" :key="l.languageCode" class="th px-2 text-left" scope="col">
                    {{ l.languageCode }}<span v-if="l.isDefault" class="sr-only"> (default)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in rows" :key="`${item.kind}:${item.id}`" :class="isSelected(item) ? 'bg-accent/50' : 'hover:bg-muted'">
                  <th scope="row" class="td px-[18px] text-left font-normal">
                    <button type="button" class="text-left text-[13px] font-semibold text-foreground hover:underline" @click="open(item)">{{ item.title }}</button>
                    <div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span>{{ kindLabel(item.kind).label }}</span>
                      <span class="rounded-full px-[7px] py-[1px] font-bold uppercase tracking-[0.07em]" :style="statusChipStyle(item.status)">{{ item.status }}</span>
                      <span v-if="item.hasWorkingCopy" class="rounded-full px-[7px] py-[1px] font-bold uppercase tracking-[0.07em]" :style="statusChipStyle('PENDING')">Pending changes</span>
                    </div>
                  </th>
                  <td v-for="l in languages" :key="l.languageCode" class="td px-2">
                    <button
                      type="button"
                      class="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-gray-700 disabled:cursor-default"
                      :disabled="l.isDefault"
                      :aria-label="`${item.title}, ${l.displayName}: ${cellText(item, l.languageCode)}${l.isDefault ? ' (default language)' : ', open'}`"
                      @click="open(item, l.languageCode)"
                    >
                      <span class="h-2.5 w-2.5 flex-none rounded-full" :class="dotClass(itemProgress(item, l.languageCode).state)" aria-hidden="true"></span>
                      {{ cellText(item, l.languageCode) }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Editor -->
        <section class="rounded-lg border bg-card" aria-labelledby="editor-heading">
          <div class="flex flex-wrap items-center gap-2.5 border-b px-[18px] py-3">
            <h2 id="editor-heading" class="min-w-0 flex-1 truncate text-[14px] font-bold">
              {{ selected ? selected.title : "Choose a resource" }}
              <span v-if="selected && targetInfo" class="font-normal text-muted-foreground"> · {{ targetInfo.displayName }}</span>
            </h2>
            <Button variant="outline" size="sm" :disabled="!target || !rows.length || opening" @click="nextMissing">Next missing</Button>
            <Button size="sm" :disabled="!dirty || saving || !editable" @click="save">{{ saving ? "Saving…" : "Save" }}</Button>
          </div>

          <p v-if="!selected" class="px-[18px] py-6 text-[13px] text-muted-foreground">
            Pick a resource in the table, or use “Next missing” to go through what still needs translating.
          </p>
          <div v-else-if="opening" class="px-[18px] py-6 text-[13px] text-muted-foreground" aria-busy="true">Opening…</div>
          <div v-else class="flex flex-col gap-4 px-[18px] py-4">
            <div class="flex flex-wrap items-center gap-3 text-[12px]">
              <RouterLink :to="editorLocation(project.id, selected)" class="font-bold text-primary no-underline hover:underline">Open in its editor</RouterLink>
              <button type="button" disabled class="rounded-full border px-3 py-1 text-[11px] font-semibold text-gray-400" aria-describedby="ai-reason">
                Translate with MuseMind
              </button>
            </div>

            <div
              v-if="selected.status === 'ACTIVE'"
              role="status"
              class="rounded-lg border-l-[3px] border-l-[#9a6200] bg-[rgba(154,98,0,0.07)] px-3.5 py-2.5 text-[12px] text-gray-700"
            >
              This {{ kindLabel(selected.kind).noun }} is active. Saved translations become pending changes; visitors see
              them once you apply the changes in its editor.
            </div>
            <div v-if="selected.status === 'ARCHIVED'" class="text-[12px] text-muted-foreground">Archived: restore it to translate it.</div>
            <div v-if="errorSummary" role="alert" class="rounded-lg border border-l-[3px] border-l-destructive px-3.5 py-2.5 text-[12px] text-destructive">
              {{ errorSummary }}
            </div>

            <!-- Resource fields -->
            <div v-for="field in selected.fields" :key="field.key" class="grid gap-x-4 gap-y-1 md:grid-cols-2">
              <div class="min-w-0">
                <div class="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {{ field.label }} <span class="font-normal normal-case tracking-normal">· {{ sourceInfo?.displayName }}</span>
                </div>
                <p class="mt-1 whitespace-pre-wrap break-words text-[13px]" :class="selected.texts[defaultLanguage ?? '']?.[field.key] ? 'text-gray-800' : 'italic text-muted-foreground'">
                  {{ selected.texts[defaultLanguage ?? ""]?.[field.key] || "Empty" }}
                </p>
              </div>
              <div class="min-w-0">
                <label :for="`tx-${field.key}`" class="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                  {{ field.label }} <span class="font-normal normal-case tracking-normal">· {{ targetInfo?.displayName }}</span>
                </label>
                <textarea
                  v-if="field.multiline"
                  :id="`tx-${field.key}`"
                  v-model="form.texts[field.key]"
                  :readonly="!editable"
                  :dir="targetInfo?.direction === 'RTL' ? 'rtl' : 'ltr'"
                  rows="3"
                  class="field-input mt-1 w-full text-[13px]"
                  :class="{ invalid: fieldError(field.key) }"
                  :aria-describedby="field.helper ? `tx-${field.key}-help` : undefined"
                ></textarea>
                <input
                  v-else
                  :id="`tx-${field.key}`"
                  v-model="form.texts[field.key]"
                  :readonly="!editable"
                  :dir="targetInfo?.direction === 'RTL' ? 'rtl' : 'ltr'"
                  class="field-input mt-1 w-full text-[13px]"
                  :class="{ invalid: fieldError(field.key) }"
                  :aria-describedby="field.helper ? `tx-${field.key}-help` : undefined"
                />
                <p v-if="field.helper" :id="`tx-${field.key}-help`" class="mt-0.5 text-[11px] text-muted-foreground">{{ field.helper }}</p>
                <p v-if="fieldError(field.key)" class="mt-0.5 text-[11px] font-semibold text-destructive">⚠ {{ fieldError(field.key) }}</p>
              </div>
            </div>

            <!-- Guide story -->
            <div v-if="selected.story && targetInfo" class="grid gap-x-4 gap-y-1 border-t pt-4 md:grid-cols-2">
              <div class="min-w-0">
                <div class="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Story · {{ sourceInfo?.displayName }}</div>
                <template v-if="storyText(selected.story.bodies[defaultLanguage ?? '']).length">
                  <p v-for="(line, i) in storyText(selected.story.bodies[defaultLanguage ?? ''])" :key="i" class="mt-1 whitespace-pre-wrap text-[13px] text-gray-800">{{ line }}</p>
                </template>
                <p v-else class="mt-1 text-[13px] italic text-muted-foreground">Empty</p>
              </div>
              <div class="min-w-0">
                <p v-if="!selected.story.blockId" class="text-[12px] text-muted-foreground">
                  This guide has no story yet: write it in the default language in its editor first.
                </p>
                <StoryEditor
                  v-else
                  :key="`${selected.id}:${targetInfo.languageCode}`"
                  :project-id="project.id"
                  :blocks="form.story"
                  :language="targetInfo"
                  :assets="assets"
                  :readonly="!editable"
                  :field-error="noFieldError"
                  :heading="`Story · ${targetInfo.displayName}`"
                  @uploaded="assets.unshift($event)"
                />
              </div>
            </div>

            <!-- Route stops -->
            <div v-if="selected.stops?.length" class="flex flex-col gap-3 border-t pt-4">
              <h3 class="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Stops</h3>
              <div v-for="(stop, index) in selected.stops" :key="stop.id ?? index" class="rounded-md border px-3.5 py-3">
                <div class="mb-2 text-[13px] font-semibold">{{ index + 1 }}. {{ stop.title }}</div>
                <p v-if="!stop.id" class="text-[12px] text-muted-foreground">Added in the pending changes only: translate it after applying them.</p>
                <div v-for="field in STOP_FIELDS" v-else :key="field.key" class="mb-2 grid gap-x-4 gap-y-1 md:grid-cols-2">
                  <div class="min-w-0">
                    <div class="text-[11px] font-semibold text-muted-foreground">{{ field.label }} · {{ sourceInfo?.languageCode }}</div>
                    <p class="whitespace-pre-wrap text-[13px]" :class="stop.texts[defaultLanguage ?? '']?.[field.key] ? 'text-gray-800' : 'italic text-muted-foreground'">
                      {{ stop.texts[defaultLanguage ?? ""]?.[field.key] || "Empty" }}
                    </p>
                  </div>
                  <div class="min-w-0">
                    <label :for="`stop-${stop.id}-${field.key}`" class="text-[11px] font-semibold text-muted-foreground">
                      {{ field.label }} · {{ targetInfo?.languageCode }}
                    </label>
                    <textarea
                      v-if="field.multiline"
                      :id="`stop-${stop.id}-${field.key}`"
                      v-model="form.stops[stop.id!][field.key]"
                      :readonly="!editable"
                      rows="2"
                      class="field-input w-full text-[13px]"
                      :class="{ invalid: fieldError(field.key, index) }"
                    ></textarea>
                    <input
                      v-else
                      :id="`stop-${stop.id}-${field.key}`"
                      v-model="form.stops[stop.id!][field.key]"
                      :readonly="!editable"
                      class="field-input w-full text-[13px]"
                      :class="{ invalid: fieldError(field.key, index) }"
                    />
                    <p v-if="field.helper" class="mt-0.5 text-[11px] text-muted-foreground">{{ field.helper }}</p>
                    <p v-if="fieldError(field.key, index)" class="mt-0.5 text-[11px] font-semibold text-destructive">⚠ {{ fieldError(field.key, index) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>
