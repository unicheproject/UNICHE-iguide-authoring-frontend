<script setup lang="ts">
/*
 * Create a Project (`12` §4): 1. create it in the Catalogue; 2. pick a Template version and a style preset;
 * 3. languages and surfaces, then `POST /initialize`. Creation and initialization are separate systems, so a
 * Project created but not initialized reopens here at step 2 ("resume initialization", `?resume=<id>`) with the
 * values it already has (DECISIONS.md D-045, backend D-040).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/platform/api";
import { createProject, fetchProject, type Project } from "@/platform/catalogue";
import { fetchProjectLanguages, type TextDirection } from "@/platform/languages";
import { fetchSurfaces, type SurfaceName } from "@/platform/surfaces";
import {
  fetchTemplates,
  initializeProject,
  inkOn,
  loadFonts,
  type ApplicationTemplate,
  type StylePreset,
} from "@/platform/templates";
import { KNOWN_LANGUAGES } from "@/lib/languageCatalogue";
import { SLUG_PATTERN, slugify } from "@/lib/format";
import { canCreateProjects, manageableOrganisations, projectsState, upsertProject } from "@/stores/projects";
import { showToast } from "@/stores/toast";

const router = useRouter();
const route = useRoute();

// Step 1 -----------------------------------------------------------------------------------------------

const orgId = ref("");
const name = ref("");
const slug = ref("");
const slugEdited = ref(false);
const submitting = ref(false);

const nameError = ref<string | null>(null);
const slugError = ref<string | null>(null);
const formError = ref<{ title: string; detail: string; requestId: string | null } | null>(null);

/** The Project once step 1 succeeded, or the one being resumed. */
const created = ref<Project | null>(null);
const resuming = ref(false);
const resumeError = ref<ApiError | null>(null);

watch(
  manageableOrganisations,
  (orgs) => {
    if (!orgs.some((o) => o.id === orgId.value)) orgId.value = orgs[0]?.id ?? "";
  },
  { immediate: true },
);

// The slug follows the name until the author edits it, as in the mockup.
watch(name, (value) => {
  if (!slugEdited.value) slug.value = slugify(value);
});

function onSlugInput(event: Event) {
  slugEdited.value = true;
  slug.value = (event.target as HTMLInputElement).value;
}

const selectedOrgName = computed(
  () => manageableOrganisations.value.find((o) => o.id === orgId.value)?.name ?? "",
);

function validate(): boolean {
  nameError.value = name.value.trim() ? null : "Enter a name. It identifies the Project in the Catalogue and in the picker.";
  slugError.value = SLUG_PATTERN.test(slug.value)
    ? null
    : "Use lowercase Latin letters, digits, and single hyphens, for example cycladic-gallery-guide.";
  return !nameError.value && !slugError.value;
}

async function submit() {
  formError.value = null;
  if (!validate() || submitting.value) return;
  submitting.value = true;
  try {
    const project = await createProject(orgId.value, { name: name.value.trim(), slug: slug.value });
    upsertProject(project);
    created.value = project;
    // A reload or a return from the picker resumes this Project at step 2.
    await router.replace({ query: { resume: project.id } });
    showToast("Project created", "If you leave now, the picker offers to resume initialization.");
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    showError(e);
  } finally {
    submitting.value = false;
  }
}

function showError(e: ApiError) {
  switch (e.status) {
    case 409:
      slugError.value = `Another Project in ${selectedOrgName.value} already uses this slug. Choose a different one.`;
      return;
    case 403:
      formError.value = {
        title: "The UNICHE Catalogue did not allow this",
        detail: `Only managers of ${selectedOrgName.value} can create Projects in it.`,
        requestId: e.requestId,
      };
      return;
    case 400:
    case 422:
      formError.value = {
        title: "The UNICHE Catalogue rejected the Project",
        detail: "Check the name and the slug, then try again.",
        requestId: e.requestId,
      };
      return;
    default:
      formError.value = {
        title: e.platformUnavailable ? "The UNICHE platform is not reachable" : "The Project could not be created",
        detail: e.platformUnavailable
          ? "Nothing was created. Try again in a moment."
          : e.message,
        requestId: e.requestId,
      };
  }
}

/** Reopens a Project created earlier at step 2, with its current languages and surfaces. */
async function resume(projectId: string) {
  resuming.value = true;
  resumeError.value = null;
  try {
    const project = await fetchProject(projectId);
    if (project.initialized) {
      await router.replace({ name: "project", params: { projectId } });
      return;
    }
    created.value = project;
    const [languages, surfaces] = await Promise.all([fetchProjectLanguages(projectId), fetchSurfaces(projectId)]);
    if (languages.languages.length) {
      chosenLanguages.value = languages.languages.map((l) => ({
        languageCode: l.languageCode,
        displayName: l.displayName,
        direction: l.direction,
      }));
      defaultLanguage.value = languages.languages.find((l) => l.isDefault)?.languageCode ?? languages.languages[0].languageCode;
      languagesTouched.value = true;
    }
    const enabled = surfaces.filter((s) => s.enabled).map((s) => s.surface);
    if (enabled.length) {
      chosenSurfaces.value = new Set(enabled);
      surfacesTouched.value = true;
    }
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    resumeError.value = e;
  } finally {
    resuming.value = false;
  }
}

// Step 2 -----------------------------------------------------------------------------------------------

const templates = ref<ApplicationTemplate[]>([]);
const templatesLoading = ref(true);
const templatesError = ref<ApiError | null>(null);
const templateId = ref("");
const presetKey = ref("");
/** Whether the author picked a style; until then the selection follows the Template's suggestion. */
const presetPicked = ref(false);
const styleDone = ref(false);

const template = computed(() => templates.value.find((t) => t.id === templateId.value) ?? null);
const preset = computed<StylePreset | null>(
  () => template.value?.stylePresets.find((p) => p.key === presetKey.value) ?? null,
);
const fontFamily = (key: string) => template.value?.fonts.find((f) => f.key === key)?.family ?? key;

let controller: AbortController | null = null;
async function loadTemplates() {
  controller?.abort();
  controller = new AbortController();
  templatesLoading.value = true;
  templatesError.value = null;
  try {
    templates.value = await fetchTemplates(controller.signal);
    if (!template.value && templates.value.length) chooseTemplate(templates.value[0].id);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    templatesError.value = e;
  } finally {
    templatesLoading.value = false;
  }
}

function chooseTemplate(id: string) {
  templateId.value = id;
  const t = template.value!;
  if (!presetPicked.value || !t.stylePresets.some((p) => p.key === presetKey.value)) {
    presetKey.value = t.defaultStylePreset;
    presetPicked.value = false;
  }
  if (!languagesTouched.value) {
    chosenLanguages.value = t.defaultLanguages.map((l) => ({
      languageCode: l.languageCode,
      displayName: l.displayName,
      direction: l.direction,
    }));
    defaultLanguage.value = t.defaultLanguages.find((l) => l.isDefault)?.languageCode ?? t.defaultLanguages[0]?.languageCode ?? "";
  }
  if (!surfacesTouched.value) chosenSurfaces.value = new Set(t.supportedSurfaces);
  loadFonts(t.fonts.map((f) => f.family));
}

function choosePreset(key: string) {
  presetKey.value = key;
  presetPicked.value = true;
}

const RADIUS: Record<string, { card: string; label: string }> = {
  SHARP: { card: "0px", label: "Square" },
  SOFT: { card: "8px", label: "Soft" },
  ROUND: { card: "16px", label: "Round" },
};
const DENSITY: Record<string, { pad: string; gap: string; label: string }> = {
  COMPACT: { pad: "9px 10px", gap: "6px", label: "Compact" },
  REGULAR: { pad: "12px 13px", gap: "9px", label: "Regular" },
  SPACIOUS: { pad: "16px 17px", gap: "13px", label: "Spacious" },
};

function presetSummary(p: StylePreset): string {
  return `${fontFamily(p.headingFont)} and ${fontFamily(p.bodyFont)} · ${RADIUS[p.cornerRadius]?.label ?? p.cornerRadius} corners · ${
    DENSITY[p.density]?.label ?? p.density
  } spacing`;
}

// Step 3 -----------------------------------------------------------------------------------------------

const chosenLanguages = ref<{ languageCode: string; displayName: string; direction: TextDirection }[]>([]);
const defaultLanguage = ref("");
const languagesTouched = ref(false);
const chosenSurfaces = ref(new Set<SurfaceName>());
const surfacesTouched = ref(false);
const addLanguageCode = ref("");

const addableLanguages = computed(() =>
  KNOWN_LANGUAGES.filter((k) => !chosenLanguages.value.some((l) => l.languageCode === k.code)),
);

function addLanguage() {
  const known = KNOWN_LANGUAGES.find((k) => k.code === addLanguageCode.value);
  if (!known) return;
  chosenLanguages.value = [...chosenLanguages.value, { languageCode: known.code, displayName: known.displayName, direction: known.direction }];
  if (!defaultLanguage.value) defaultLanguage.value = known.code;
  addLanguageCode.value = "";
  languagesTouched.value = true;
}

function removeLanguage(code: string) {
  chosenLanguages.value = chosenLanguages.value.filter((l) => l.languageCode !== code);
  if (defaultLanguage.value === code) defaultLanguage.value = chosenLanguages.value[0]?.languageCode ?? "";
  languagesTouched.value = true;
}

function makeDefault(code: string) {
  defaultLanguage.value = code;
  languagesTouched.value = true;
}

function toggleSurface(surface: SurfaceName) {
  const next = new Set(chosenSurfaces.value);
  if (next.has(surface)) next.delete(surface);
  else next.add(surface);
  chosenSurfaces.value = next;
  surfacesTouched.value = true;
}

const SURFACE_COPY: Record<SurfaceName, { label: string; note: string }> = {
  WEB: { label: "Web", note: "Browser app, at the organisation's web address" },
  MOBILE: { label: "Mobile", note: "Installable app with beacons and offline use" },
  KIOSK: { label: "Kiosk", note: "A fixed screen in the venue" },
};

/** The surfaces sent: those chosen among the Template's, in its order. */
const surfacesToSend = computed(() => (template.value?.supportedSurfaces ?? []).filter((s) => chosenSurfaces.value.has(s)));

const summary = computed(() => {
  if (!template.value || !preset.value) return "";
  const langs = chosenLanguages.value.map((l) => l.displayName).join(", ") || "no language";
  const def = chosenLanguages.value.find((l) => l.languageCode === defaultLanguage.value)?.displayName ?? "—";
  const surfaces = surfacesToSend.value.map((s) => SURFACE_COPY[s].label).join(", ") || "no surface";
  return `${template.value.name} v${template.value.version} · ${preset.value.name} · ${langs} · default ${def} · ${surfaces}`;
});

const initializing = ref(false);
const initErrors = ref<{ title: string; items: string[]; requestId: string | null } | null>(null);

function localProblems(): string[] {
  const problems: string[] = [];
  if (!chosenLanguages.value.length) problems.push("Languages: pick at least one; the default language cannot be removed later.");
  if (!surfacesToSend.value.length) {
    problems.push(`Surfaces: pick at least one of ${(template.value?.supportedSurfaces ?? []).map((s) => SURFACE_COPY[s].label).join(", ")}.`);
  }
  return problems;
}

/** Where an `initialize` field error belongs, in the words of this page. */
function describeInitPath(path: string): string {
  const lang = /^languages\[(\d+)\]/.exec(path);
  if (lang) return `Language ${chosenLanguages.value[Number(lang[1])]?.displayName ?? Number(lang[1]) + 1}`;
  const surface = /^surfaces\[(\d+)\]/.exec(path);
  if (surface) return `Surface ${SURFACE_COPY[surfacesToSend.value[Number(surface[1])]]?.label ?? Number(surface[1]) + 1}`;
  if (path === "templateId") return "Template";
  if (path === "stylePreset") return "Style";
  if (path === "defaultLanguage") return "Default language";
  if (path === "languages") return "Languages";
  if (path === "surfaces") return "Surfaces";
  return "Initialization";
}

async function initialize() {
  const project = created.value;
  if (!project || !template.value || !preset.value || initializing.value) return;
  initErrors.value = null;
  const problems = localProblems();
  if (problems.length) {
    initErrors.value = { title: "Check languages and surfaces", items: problems, requestId: null };
    return;
  }
  initializing.value = true;
  try {
    const initialized = await initializeProject(project.id, {
      templateId: template.value.id,
      stylePreset: preset.value.key,
      languages: chosenLanguages.value,
      defaultLanguage: defaultLanguage.value,
      surfaces: surfacesToSend.value,
    });
    upsertProject(initialized);
    showToast("Project initialized", `${template.value.name} set up its Categories and the ${preset.value.name} style. The Application starts in DRAFT.`);
    await router.push({ name: "project", params: { projectId: project.id } });
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.code === "PROJECT_ALREADY_INITIALIZED") {
      await router.push({ name: "project", params: { projectId: project.id } });
      return;
    }
    const items = e.fieldErrors.length
      ? e.fieldErrors.map((f) => `${describeInitPath(f.path)}: ${f.message}`)
      : [e.platformUnavailable ? "The UNICHE platform is not reachable. Nothing was initialized; try again in a moment." : e.message];
    initErrors.value = { title: "The Project was not initialized", items, requestId: e.requestId };
  } finally {
    initializing.value = false;
  }
}

// Page -----------------------------------------------------------------------------------------------

onMounted(() => {
  void loadTemplates();
  const id = route.query.resume;
  if (typeof id === "string" && id) void resume(id);
});
onBeforeUnmount(() => controller?.abort());

const step1Done = computed(() => !!created.value);
const step3Open = computed(() => step1Done.value && styleDone.value);

function close() {
  if (window.history.state?.back) {
    router.back();
  } else {
    void router.push({ name: "home" });
  }
}
</script>

<template>
  <main class="min-w-0 flex-1 overflow-y-auto px-4 pb-16 pt-6 md:px-7">
    <div class="mx-auto w-full max-w-[860px] pb-10">
      <div class="mb-7 flex items-start gap-6">
        <div class="min-w-0 flex-1">
          <div class="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">New project</div>
          <h1 class="text-[26px] font-extrabold leading-tight tracking-[-0.01em]">Create a Project</h1>
          <p class="mt-1.5 max-w-[560px] text-[13px] text-muted-foreground">
            The Project is created first, then initialized: pick a Template and a style, then its languages and
            surfaces. Creation and initialization are separate, so a failed initialization can be resumed later.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex flex-shrink-0 items-center gap-[7px] rounded-full border bg-card px-[15px] py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground hover:border-destructive hover:text-destructive"
          @click="close"
        >
          <span class="text-[13px] leading-none" aria-hidden="true">✕</span>Close
        </button>
      </div>

      <div
        v-if="resuming || (!created && (projectsState.status === 'loading' || projectsState.status === 'idle'))"
        class="animate-skeleton rounded-[10px] border bg-card px-[26px] py-6"
        aria-busy="true"
      >
        <div class="mb-4 h-3.5 w-1/3 rounded bg-[#dcdde2]"></div>
        <div class="h-11 w-full max-w-[460px] rounded-lg bg-[#e6e7eb]"></div>
        <span class="sr-only">{{ resuming ? "Loading the Project" : "Loading your organisations" }}</span>
      </div>

      <div v-else-if="resumeError" role="alert" class="rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
        <strong class="block text-[13px] font-bold text-destructive">
          {{ resumeError.status === 404 ? "This Project is not available" : "The Project could not be loaded" }}
        </strong>
        <p class="mt-1 text-[13px] text-gray-700">
          {{ resumeError.status === 404 ? "It no longer exists in the UNICHE Catalogue, or you are no longer a member of it." : resumeError.message }}
        </p>
        <p v-if="resumeError.requestId" class="mt-1 font-mono text-[11px] text-muted-foreground">Request id {{ resumeError.requestId }}</p>
      </div>

      <div
        v-else-if="!created && !canCreateProjects"
        role="alert"
        class="rounded-lg border border-l-[3px] border-l-[#855400] bg-card px-[18px] py-4"
      >
        <strong class="block text-[13px] font-bold">You cannot create Projects</strong>
        <p class="mt-1 text-[13px] text-gray-700">
          The UNICHE Catalogue lists no organisation you manage. A manager of your organisation can create the
          Project, or make you a manager in the Catalogue.
        </p>
      </div>

      <div v-else class="flex flex-col gap-4">
        <!-- Step 1 -->
        <form
          novalidate
          class="rounded-[10px] border bg-card px-[26px] py-6"
          :class="step1Done ? '' : 'border-primary shadow-[0_4px_18px_rgba(76,29,139,0.08)]'"
          aria-labelledby="step-1-title"
          @submit.prevent="submit"
        >
          <div class="mb-5 flex items-center gap-3">
            <span
              class="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary bg-primary text-xs font-extrabold text-primary-foreground"
              aria-hidden="true"
            >
              1
            </span>
            <h2 id="step-1-title" class="min-w-0 flex-1 text-[13px] font-extrabold tracking-[0.02em]">
              Create the Project
            </h2>
            <span v-if="step1Done" class="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#0c6d62]">Created</span>
          </div>

          <div v-if="created" class="flex flex-wrap items-baseline gap-3 pl-[38px]">
            <span class="text-[15px] font-bold">{{ created.name }}</span>
            <span class="font-mono text-xs text-muted-foreground">{{ created.slug }}</span>
          </div>

          <div v-else class="flex flex-col gap-4 pl-[38px]">
            <div
              v-if="formError"
              role="alert"
              class="rounded-lg border border-l-[3px] border-l-destructive bg-card px-4 py-3"
            >
              <strong class="block text-[13px] font-bold text-destructive">{{ formError.title }}</strong>
              <p class="mt-0.5 text-[13px] text-gray-700">{{ formError.detail }}</p>
              <p v-if="formError.requestId" class="mt-0.5 font-mono text-[11px] text-muted-foreground">
                Request id {{ formError.requestId }}
              </p>
            </div>

            <div class="flex flex-col gap-[7px]">
              <label for="project-org" class="text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">
                Organisation
              </label>
              <select
                v-if="manageableOrganisations.length > 1"
                id="project-org"
                v-model="orgId"
                class="w-full max-w-[460px] rounded-lg border-[1.5px] bg-card px-3.5 py-3 text-[15px] focus:border-primary focus:outline-none"
              >
                <option v-for="org in manageableOrganisations" :key="org.id" :value="org.id">{{ org.name }}</option>
              </select>
              <span v-else id="project-org" class="text-[15px] font-semibold">{{ selectedOrgName }}</span>
            </div>

            <div class="flex flex-col gap-[7px]">
              <label for="project-name" class="text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">
                Project name
              </label>
              <input
                id="project-name"
                v-model="name"
                type="text"
                autocomplete="off"
                placeholder="Cycladic Gallery Guide"
                :aria-invalid="!!nameError"
                :aria-describedby="nameError ? 'project-name-error' : undefined"
                class="w-full max-w-[460px] rounded-lg border-[1.5px] px-3.5 py-3 text-[15px] focus:border-primary focus:outline-none"
                :class="nameError ? 'border-destructive' : ''"
              />
              <span v-if="nameError" id="project-name-error" class="text-xs text-destructive">{{ nameError }}</span>
            </div>

            <div class="flex flex-col gap-[7px]">
              <label for="project-slug" class="text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">
                Slug
              </label>
              <input
                id="project-slug"
                :value="slug"
                type="text"
                autocomplete="off"
                spellcheck="false"
                placeholder="cycladic-gallery-guide"
                :aria-invalid="!!slugError"
                aria-describedby="project-slug-help"
                class="w-full max-w-[460px] rounded-lg border-[1.5px] px-3.5 py-2.5 font-mono text-[13px] focus:border-primary focus:outline-none"
                :class="slugError ? 'border-destructive' : ''"
                @input="onSlugInput"
              />
              <span v-if="slugError" id="project-slug-help" class="text-xs text-destructive">{{ slugError }}</span>
              <span v-else id="project-slug-help" class="text-xs text-muted-foreground">
                {{ slugEdited ? "Unique within the organisation." : "Updates with the name until you edit it." }}
              </span>
            </div>

            <div>
              <button
                type="submit"
                :disabled="submitting"
                class="rounded-full bg-primary px-[26px] py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-primary-foreground hover:bg-[#3a1469] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ submitting ? "Creating…" : "Create Project" }}
              </button>
            </div>
          </div>
        </form>

        <!-- Step 2 -->
        <section
          class="rounded-[10px] border bg-card px-[26px] py-6"
          :class="step1Done && !styleDone ? 'border-primary shadow-[0_4px_18px_rgba(76,29,139,0.08)]' : ''"
          aria-labelledby="step-2-title"
        >
          <div class="mb-5 flex items-center gap-3">
            <span
              class="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-xs font-extrabold"
              :class="step1Done ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-300 bg-card text-muted-foreground'"
              aria-hidden="true"
            >
              2
            </span>
            <h2 id="step-2-title" class="min-w-0 flex-1 text-[13px] font-extrabold tracking-[0.02em]" :class="step1Done ? '' : 'text-muted-foreground'">
              Pick a Template and a style
            </h2>
            <span v-if="!step1Done" class="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">Locked</span>
          </div>

          <fieldset :disabled="!step1Done" class="min-w-0 pl-[38px]" :class="step1Done ? '' : 'opacity-60'">
            <legend class="sr-only">Template and style</legend>

            <div v-if="templatesLoading" class="animate-skeleton grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-2.5" aria-busy="true">
              <div v-for="n in 3" :key="n" class="h-[92px] rounded-[10px] bg-[#e6e7eb]"></div>
              <span class="sr-only">Loading Templates</span>
            </div>

            <div v-else-if="templatesError" role="alert" class="rounded-lg border border-l-[3px] border-l-destructive bg-card px-4 py-3">
              <strong class="block text-[13px] font-bold text-destructive">
                {{ templatesError.platformUnavailable ? "The UNICHE platform is not reachable" : "The Templates could not be loaded" }}
              </strong>
              <p v-if="templatesError.requestId" class="mt-0.5 font-mono text-[11px] text-muted-foreground">Request id {{ templatesError.requestId }}</p>
              <button type="button" class="mt-2 text-xs font-bold text-primary hover:underline" @click="loadTemplates">Try again</button>
            </div>

            <template v-else-if="template">
              <h3 id="template-label" class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">Template</h3>
              <div class="mb-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-2.5" role="group" aria-labelledby="template-label">
                <button
                  v-for="t in templates"
                  :key="t.id"
                  type="button"
                  :aria-pressed="t.id === templateId"
                  class="flex flex-col gap-[5px] rounded-[10px] border-[1.5px] px-4 py-3.5 text-left hover:border-primary"
                  :class="t.id === templateId ? 'border-primary bg-primary/[0.05]' : 'border-gray-200 bg-card'"
                  @click="chooseTemplate(t.id)"
                >
                  <span class="flex items-baseline gap-[7px]">
                    <span class="text-[13px] font-bold">{{ t.name }}</span>
                    <span class="font-mono text-[10px] text-muted-foreground">v{{ t.version }}</span>
                  </span>
                  <span class="block text-xs leading-normal text-gray-700">{{ t.description }}</span>
                  <span class="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                    {{ t.supportedSurfaces.join(", ") }}
                  </span>
                </button>
              </div>

              <h3 id="style-label" class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">Style</h3>
              <div class="mb-6 flex flex-wrap items-start gap-4">
                <div class="flex min-w-[min(100%,320px)] flex-[1_1_320px] flex-col gap-[11px]">
                  <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,92px),1fr))] gap-2" role="group" aria-labelledby="style-label">
                    <button
                      v-for="p in template.stylePresets"
                      :key="p.key"
                      type="button"
                      :aria-pressed="p.key === presetKey"
                      :aria-label="`${p.name}${p.suggested ? ', suggested' : ''}: ${presetSummary(p)}`"
                      :title="`${p.name} — ${presetSummary(p)}`"
                      class="flex flex-col overflow-hidden rounded-[9px] border-[1.5px] bg-card p-0 text-left"
                      :class="p.key === presetKey ? 'border-primary shadow-[0_0_0_2.5px_rgba(76,29,139,0.16)]' : 'border-gray-200'"
                      @click="choosePreset(p.key)"
                    >
                      <span
                        class="flex w-full items-center gap-[5px] px-[9px] pb-2 pt-[9px]"
                        :style="{
                          background: p.primaryColor,
                          borderRadius: p.cornerRadius === 'SHARP' ? '0' : '7px 7px 0 0',
                        }"
                      >
                        <span class="text-base font-bold leading-none" :style="{ fontFamily: `'${fontFamily(p.headingFont)}', serif`, color: inkOn(p.primaryColor) }">Aa</span>
                        <span class="ml-auto flex gap-[3px]" aria-hidden="true">
                          <span class="h-2.5 w-2.5 border border-black/10" :style="{ background: p.backgroundColor, borderRadius: p.cornerRadius === 'SHARP' ? '1px' : '999px' }"></span>
                          <span class="h-2.5 w-2.5 border border-black/10" :style="{ background: p.textColor, borderRadius: p.cornerRadius === 'SHARP' ? '1px' : '999px' }"></span>
                        </span>
                      </span>
                      <span class="flex w-full flex-col px-[9px] pb-2 pt-1.5" :class="p.key === presetKey ? 'bg-primary/[0.05]' : ''">
                        <span class="text-[11px] font-bold leading-tight">{{ p.name }}</span>
                        <span class="text-[9px] font-extrabold uppercase tracking-[0.06em]" :class="p.key === presetKey ? 'text-primary' : 'text-muted-foreground'">
                          {{ p.key === presetKey ? "Selected" : p.suggested ? "Suggested" : " " }}
                        </span>
                      </span>
                    </button>
                  </div>
                  <p v-if="preset" class="text-xs text-muted-foreground">
                    <strong class="text-foreground">{{ preset.name }}</strong> · {{ presetSummary(preset) }}. {{ preset.description }}
                  </p>
                </div>

                <figure v-if="preset" class="w-[200px] flex-shrink-0" aria-label="Preview of the Home Page in the chosen style">
                  <div
                    class="overflow-hidden border border-black/10 shadow-sm"
                    :style="{ background: preset.backgroundColor, borderRadius: RADIUS[preset.cornerRadius]?.card === '0px' ? '2px' : '12px', fontFamily: `'${fontFamily(preset.bodyFont)}', sans-serif` }"
                  >
                    <div class="flex items-center gap-1.5 px-2.5 py-2" :style="{ background: preset.primaryColor, color: inkOn(preset.primaryColor) }">
                      <span class="min-w-0 flex-1 truncate text-[11px] font-bold" :style="{ fontFamily: `'${fontFamily(preset.headingFont)}', serif` }">
                        {{ created?.name || name || "Project name" }}
                      </span>
                      <span v-if="chosenLanguages.length > 1" class="rounded-full border border-current px-1.5 text-[8px] font-bold">{{ defaultLanguage }} ▾</span>
                    </div>
                    <div class="flex flex-col p-2.5" :style="{ gap: DENSITY[preset.density]?.gap, color: preset.textColor }">
                      <span class="text-sm font-bold" :style="{ fontFamily: `'${fontFamily(preset.headingFont)}', serif` }">Home</span>
                      <span
                        v-for="n in 2"
                        :key="n"
                        class="block border border-black/10"
                        :style="{ borderRadius: RADIUS[preset.cornerRadius]?.card, padding: DENSITY[preset.density]?.pad, background: preset.backgroundColor }"
                      >
                        <span class="block h-1.5 w-3/4 rounded-sm" :style="{ background: preset.textColor, opacity: 0.18 }"></span>
                      </span>
                      <span class="inline-block self-start rounded-full px-2 py-0.5 text-[9px] font-bold" :style="{ background: preset.secondaryColor, color: inkOn(preset.secondaryColor) }">
                        Explore
                      </span>
                    </div>
                  </div>
                  <figcaption class="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                    {{ surfacesToSend.join(" · ") || "No surface" }} · the Home Page in {{ preset.name }}, before any content.
                  </figcaption>
                </figure>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  class="rounded-full border-[1.5px] border-primary px-[26px] py-3 text-[11px] font-bold uppercase tracking-[0.06em]"
                  :class="styleDone ? 'bg-card text-primary' : 'bg-primary text-primary-foreground hover:bg-[#3a1469]'"
                  @click="styleDone = true"
                >
                  {{ styleDone ? "Style confirmed" : "Continue" }}
                </button>
                <span class="text-xs text-muted-foreground" aria-live="polite">
                  {{
                    styleDone
                      ? "Languages and surfaces are unlocked below. Change the Template or style any time before initializing."
                      : `${template.name} in ${preset?.name}. Continue to choose languages and surfaces.`
                  }}
                </span>
              </div>
            </template>
          </fieldset>
        </section>

        <!-- Step 3 -->
        <section
          class="rounded-[10px] border bg-card px-[26px] py-6"
          :class="step3Open ? 'border-primary shadow-[0_4px_18px_rgba(76,29,139,0.08)]' : ''"
          aria-labelledby="step-3-title"
        >
          <div class="mb-5 flex items-center gap-3">
            <span
              class="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-xs font-extrabold"
              :class="step3Open ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-300 bg-card text-muted-foreground'"
              aria-hidden="true"
            >
              3
            </span>
            <h2 id="step-3-title" class="min-w-0 flex-1 text-[13px] font-extrabold tracking-[0.02em]" :class="step3Open ? '' : 'text-muted-foreground'">
              Languages and surfaces
            </h2>
            <span v-if="!step3Open" class="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground">Locked</span>
          </div>

          <fieldset :disabled="!step3Open || !template" class="min-w-0 pl-[38px]" :class="step3Open ? '' : 'opacity-60'">
            <legend class="sr-only">Languages and surfaces</legend>

            <div
              v-if="initErrors"
              role="alert"
              class="mb-4 rounded-lg border border-l-[3px] border-l-destructive bg-card px-4 py-3"
            >
              <strong class="block text-[13px] font-bold text-destructive">{{ initErrors.title }}</strong>
              <ul class="mt-1 list-disc pl-5 text-[13px] text-gray-700">
                <li v-for="item in initErrors.items" :key="item">{{ item }}</li>
              </ul>
              <p v-if="initErrors.requestId" class="mt-0.5 font-mono text-[11px] text-muted-foreground">Request id {{ initErrors.requestId }}</p>
            </div>

            <div class="mb-5 grid gap-6 md:grid-cols-2">
              <div>
                <h3 class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">Languages</h3>
                <ul class="flex flex-col gap-1.5">
                  <li
                    v-for="l in chosenLanguages"
                    :key="l.languageCode"
                    class="flex items-center gap-2 rounded-lg border px-3 py-2"
                  >
                    <span class="min-w-0 flex-1 text-[13px] font-semibold" :lang="l.languageCode" :dir="l.direction === 'RTL' ? 'rtl' : undefined">{{ l.displayName }}</span>
                    <span
                      v-if="l.languageCode === defaultLanguage"
                      class="rounded-full bg-primary/[0.1] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.07em] text-primary"
                    >
                      Default
                    </span>
                    <button
                      v-else
                      type="button"
                      class="text-[11px] font-bold text-primary hover:underline"
                      :aria-label="`Make ${l.displayName} the default language`"
                      @click="makeDefault(l.languageCode)"
                    >
                      Make default
                    </button>
                    <button
                      type="button"
                      class="text-[11px] font-bold text-muted-foreground hover:text-destructive"
                      :aria-label="`Remove ${l.displayName}`"
                      @click="removeLanguage(l.languageCode)"
                    >
                      ✕
                    </button>
                  </li>
                </ul>
                <div class="mt-2 flex gap-2">
                  <label for="add-language" class="sr-only">Add a language</label>
                  <select id="add-language" v-model="addLanguageCode" class="min-w-0 flex-1 rounded-lg border-[1.5px] bg-card px-2.5 py-2 text-[13px]">
                    <option value="">Add a language…</option>
                    <option v-for="k in addableLanguages" :key="k.code" :value="k.code">{{ k.displayName }} ({{ k.englishName }})</option>
                  </select>
                  <button
                    type="button"
                    :disabled="!addLanguageCode"
                    class="rounded-full border px-3.5 text-[11px] font-bold uppercase tracking-[0.06em] text-primary disabled:opacity-50"
                    @click="addLanguage"
                  >
                    Add
                  </button>
                </div>
                <p class="mt-1.5 text-xs text-muted-foreground">The default language is the one every text needs before content can go live.</p>
              </div>

              <div v-if="template">
                <h3 class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">Surfaces</h3>
                <ul class="flex flex-col gap-1.5">
                  <li
                    v-for="s in template.supportedSurfaces"
                    :key="s"
                    class="flex items-center gap-3 rounded-lg border px-3 py-2"
                    :class="chosenSurfaces.has(s) ? 'bg-primary/[0.05]' : 'bg-muted'"
                  >
                    <span class="min-w-0 flex-1">
                      <span :id="`surface-${s}`" class="block text-[13px] font-bold">{{ SURFACE_COPY[s].label }}</span>
                      <span class="block text-[11px] text-muted-foreground">{{ SURFACE_COPY[s].note }}</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      :aria-checked="chosenSurfaces.has(s)"
                      :aria-labelledby="`surface-${s}`"
                      class="relative inline-block h-5 w-9 flex-shrink-0 rounded-full transition-colors"
                      :class="chosenSurfaces.has(s) ? 'bg-primary' : 'bg-gray-400'"
                      @click="toggleSurface(s)"
                    >
                      <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" :class="chosenSurfaces.has(s) ? 'left-[18px]' : 'left-0.5'"></span>
                    </button>
                  </li>
                </ul>
                <p class="mt-1.5 text-xs text-muted-foreground">{{ template.name }} supports {{ template.supportedSurfaces.map((s) => SURFACE_COPY[s].label).join(", ") }}.</p>
              </div>
            </div>

            <p class="mb-3 rounded-lg bg-muted px-3 py-2 text-xs text-gray-700">{{ summary }}</p>
            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                :disabled="initializing"
                class="rounded-full bg-primary px-[26px] py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-primary-foreground hover:bg-[#3a1469] disabled:cursor-not-allowed disabled:opacity-60"
                @click="initialize"
              >
                {{ initializing ? "Initializing…" : "Initialize" }}
              </button>
              <span class="text-xs text-muted-foreground">
                Initialization adds the Template's Categories and the {{ preset?.name }} style; the Application starts in DRAFT.
              </span>
            </div>
          </fieldset>
        </section>
      </div>
    </div>
  </main>
</template>
