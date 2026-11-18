import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { say } from "@/lib/announcer";
import { SLUG_PATTERN, slugify } from "@/lib/format";
import { KNOWN_LANGUAGES } from "@/lib/languageCatalogue";
import { ApiError } from "@/platform/api";
import { createProject, fetchProject, type Project } from "@/platform/catalogue";
import { fetchProjectLanguages, type TextDirection } from "@/platform/languages";
import { fetchSurfaces, type SurfaceName } from "@/platform/surfaces";
import { fetchTemplates, initializeProject, loadFonts, type ApplicationTemplate, type StylePreset } from "@/platform/templates";
import { manageableOrganisations, projectsState, upsertProject } from "@/stores/projects";
import { showToast } from "@/stores/toast";
import { rememberProject } from "@/workspace/lastProject";

/**
 * Create a Project (`12` §4): 1. create it in the Catalogue; 2. pick a Template version and a style preset;
 * 3. languages and surfaces; 4. review and `POST /initialize`. Creation and initialization are separate systems, so a
 * Project created but not initialized reopens at step 2 ("resume initialization", `?resume=<id>`) with the values it
 * already has (DECISIONS.md D-045, D-084; backend D-040). The step components read this object and call its actions.
 */

export type StepKey = "name" | "template" | "languages" | "review";

export const STEPS: { key: StepKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "template", label: "Template and style" },
  { key: "languages", label: "Languages and surfaces" },
  { key: "review", label: "Review" },
];

/** One line of the error summary: its text, and the id of the control it focuses (null when no control owns it). */
export interface SummaryLine {
  text: string;
  path: string | null;
}
export interface FormSummary {
  title: string;
  items: SummaryLine[];
  requestId: string | null;
}

export interface ChosenLanguage {
  languageCode: string;
  displayName: string;
  direction: TextDirection;
}

export const SURFACE_COPY: Record<SurfaceName, { label: string; note: string }> = {
  WEB: { label: "Web", note: "A browser app at the organisation's web address" },
  MOBILE: { label: "Mobile", note: "An installable app, with beacons and offline use" },
  KIOSK: { label: "Kiosk", note: "A fixed screen in the venue" },
};

/** Ids the summary links point at. */
/** The longest slug the Catalogue accepts. */
export const SLUG_MAX = 100;

export const FIELD_IDS = { name: "project-name", slug: "project-slug", languages: "add-language", defaultLanguage: "default-language", surfaces: "surface-switches" } as const;

/** Creates the wizard's state and actions; call once in `CreateProjectView`. */
export function useCreateProject() {
  const router = useRouter();
  const route = useRoute();

  const step = ref<StepKey>("name");

  // Step 1 --------------------------------------------------------------------------------------------------
  const orgId = ref("");
  const name = ref("");
  const slug = ref("");
  const slugEdited = ref(false);
  const submitting = ref(false);
  const nameError = ref<string | null>(null);
  const slugError = ref<string | null>(null);
  const summary = ref<FormSummary | null>(null);
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
  // The slug follows the name until the author edits it, cut to the Catalogue's limit without a dangling hyphen (C3-96).
  watch(name, (value) => {
    if (!slugEdited.value) slug.value = slugify(value).slice(0, SLUG_MAX).replace(/-+$/, "");
    nameError.value = null;
  });
  watch(slug, () => {
    slugError.value = null;
  });

  function editSlug(value: string) {
    slugEdited.value = true;
    slug.value = value;
  }

  const selectedOrgName = computed(() => manageableOrganisations.value.find((o) => o.id === orgId.value)?.name ?? "");

  /** Shows the summary and moves focus to it, so a screen reader announces it and a keyboard user lands on its links. */
  async function showSummary(value: FormSummary) {
    summary.value = value;
    await nextTick();
    const el = document.querySelector<HTMLElement>("[data-error-summary]");
    el?.focus();
    el?.scrollIntoView({ block: "nearest" });
  }

  function validateName(): boolean {
    nameError.value = name.value.trim() ? null : "Enter a name for the Project. It identifies the Project in the Catalogue and in the picker.";
    slugError.value = !slug.value
      ? name.value.trim() && !slugEdited.value
        ? "Type a slug in Latin letters. This name has none to make one from."
        : "Enter a slug, or type a name and one is made for you."
      : slug.value.length > SLUG_MAX
        ? `A slug has at most ${SLUG_MAX} characters; this one has ${slug.value.length}. Shorten it.`
        : SLUG_PATTERN.test(slug.value)
          ? null
          : "Use lowercase Latin letters, digits and single hyphens, for example cycladic-gallery-guide.";
    const items: SummaryLine[] = [];
    if (nameError.value) items.push({ text: `Project name: ${nameError.value}`, path: FIELD_IDS.name });
    if (slugError.value) items.push({ text: `Slug: ${slugError.value}`, path: FIELD_IDS.slug });
    if (items.length) {
      void showSummary({ title: items.length === 1 ? "1 thing to fix before the Project is created" : `${items.length} things to fix before the Project is created`, items, requestId: null });
      return false;
    }
    summary.value = null;
    return true;
  }

  async function submitName() {
    if (submitting.value) return;
    if (!validateName()) return;
    submitting.value = true;
    try {
      const project = await createProject(orgId.value, { name: name.value.trim(), slug: slug.value });
      upsertProject(project);
      created.value = project;
      summary.value = null;
      // A reload or a return from the picker resumes this Project at step 2.
      await router.replace({ query: { resume: project.id } });
      showToast("Project created", "If you leave now, the picker offers to resume setup.");
      await goTo("template");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      await showCreateError(e);
    } finally {
      submitting.value = false;
    }
  }

  /** The Catalogue's refusal in the author's words: per field where it names one, otherwise in the summary. Never the rejected value. */
  async function showCreateError(e: ApiError) {
    const org = selectedOrgName.value || "this organisation";
    const items: SummaryLine[] = [];
    if (e.status === 409 || e.hasCode("SLUG_ALREADY_EXISTS")) {
      slugError.value = `Another Project in ${org} already uses this slug. Choose a different one.`;
      items.push({ text: `Slug: ${slugError.value}`, path: FIELD_IDS.slug });
    } else if (e.status === 400 || e.status === 422) {
      for (const f of e.fieldErrors) {
        if (f.path === "name" && !nameError.value) {
          nameError.value = "The Catalogue does not accept this name. Change it and try again.";
          items.push({ text: `Project name: ${nameError.value}`, path: FIELD_IDS.name });
        } else if (f.path === "slug" && !slugError.value) {
          slugError.value = "The Catalogue does not accept this slug. Use lowercase letters, digits and single hyphens.";
          items.push({ text: `Slug: ${slugError.value}`, path: FIELD_IDS.slug });
        }
      }
      if (!items.length) items.push({ text: "The Catalogue rejected the Project. Check the name and the slug, then try again.", path: null });
    } else if (e.status === 403) {
      items.push({ text: `Only managers of ${org} can create Projects in it. Ask a manager, or choose another organisation.`, path: null });
    } else if (e.platformUnavailable || e.backendUnreachable) {
      items.push({ text: "The UNICHE platform did not answer. Nothing was created. Try again in a moment.", path: null });
    } else {
      items.push({ text: "The Project could not be created. Nothing was created. Try again; if it keeps happening, send the request id to support.", path: null });
    }
    await showSummary({ title: items.length === 1 ? "The Project was not created" : `The Project was not created: ${items.length} things to fix`, items, requestId: e.requestId });
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
      step.value = "template";
      const [languages, surfaces] = await Promise.all([fetchProjectLanguages(projectId), fetchSurfaces(projectId)]);
      if (languages.languages.length) {
        chosenLanguages.value = languages.languages.map((l) => ({ languageCode: l.languageCode, displayName: l.displayName, direction: l.direction }));
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

  // Step 2 --------------------------------------------------------------------------------------------------
  const templates = ref<ApplicationTemplate[]>([]);
  const templatesLoading = ref(true);
  const templatesError = ref<ApiError | null>(null);
  const templateId = ref("");
  const presetKey = ref("");
  /** Whether the author picked a style; until then the selection follows the Template's suggestion. */
  const presetPicked = ref(false);

  const template = computed(() => templates.value.find((t) => t.id === templateId.value) ?? null);
  const preset = computed<StylePreset | null>(() => template.value?.stylePresets.find((p) => p.key === presetKey.value) ?? null);

  let controller: AbortController | null = null;
  async function loadTemplates() {
    controller?.abort();
    controller = new AbortController();
    templatesLoading.value = true;
    templatesError.value = null;
    try {
      templates.value = await fetchTemplates(controller.signal);
      // No silent default (D-097): a lone Template is the only choice and is selected; with several, the author chooses.
      if (!template.value && templates.value.length === 1) chooseTemplate(templates.value[0].id);
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
    const t = template.value;
    if (!t) return;
    if (!presetPicked.value || !t.stylePresets.some((p) => p.key === presetKey.value)) {
      presetKey.value = t.defaultStylePreset;
      presetPicked.value = false;
    }
    if (!languagesTouched.value) {
      chosenLanguages.value = t.defaultLanguages.map((l) => ({ languageCode: l.languageCode, displayName: l.displayName, direction: l.direction }));
      // Only the language the Template itself marks as default is preselected; otherwise the author must choose (never "first in the list").
      defaultLanguage.value = t.defaultLanguages.find((l) => l.isDefault)?.languageCode ?? "";
      defaultOrigin.value = defaultLanguage.value ? "template" : "";
    }
    if (!surfacesTouched.value) chosenSurfaces.value = new Set(t.supportedSurfaces);
    loadFonts(t.fonts.map((f) => f.family));
  }

  function choosePreset(key: string) {
    presetKey.value = key;
    presetPicked.value = true;
  }

  // Step 3 --------------------------------------------------------------------------------------------------
  const chosenLanguages = ref<ChosenLanguage[]>([]);
  const defaultLanguage = ref("");
  const languagesTouched = ref(false);
  /** Why the default language is set when the author did not pick it: the Template marks it, or it is the only one. */
  const defaultOrigin = ref<"template" | "only" | "">("");
  const chosenSurfaces = ref(new Set<SurfaceName>());
  const surfacesTouched = ref(false);
  const addLanguageCode = ref("");

  const addableLanguages = computed(() => KNOWN_LANGUAGES.filter((k) => !chosenLanguages.value.some((l) => l.languageCode === k.code)));

  function addLanguage() {
    const known = KNOWN_LANGUAGES.find((k) => k.code === addLanguageCode.value);
    if (!known) return;
    chosenLanguages.value = [...chosenLanguages.value, { languageCode: known.code, displayName: known.displayName, direction: known.direction }];
    if (!defaultLanguage.value) {
      defaultLanguage.value = known.code;
      defaultOrigin.value = "only";
    }
    addLanguageCode.value = "";
    languagesTouched.value = true;
    say(`${known.displayName} added`);
  }

  function removeLanguage(code: string) {
    const gone = chosenLanguages.value.find((l) => l.languageCode === code);
    chosenLanguages.value = chosenLanguages.value.filter((l) => l.languageCode !== code);
    if (defaultLanguage.value === code) {
      defaultLanguage.value = chosenLanguages.value.length === 1 ? chosenLanguages.value[0].languageCode : "";
      defaultOrigin.value = defaultLanguage.value ? "only" : "";
    }
    languagesTouched.value = true;
    if (gone) say(`${gone.displayName} removed`);
  }

  function makeDefault(code: string) {
    defaultLanguage.value = code;
    defaultOrigin.value = "";
    languagesTouched.value = true;
  }

  function setSurface(surface: SurfaceName, on: boolean) {
    const next = new Set(chosenSurfaces.value);
    if (on) next.add(surface);
    else next.delete(surface);
    chosenSurfaces.value = next;
    surfacesTouched.value = true;
  }

  /** The surfaces sent: those chosen among the Template's, in its order. */
  const surfacesToSend = computed(() => (template.value?.supportedSurfaces ?? []).filter((s) => chosenSurfaces.value.has(s)));
  const defaultLanguageName = computed(() => chosenLanguages.value.find((l) => l.languageCode === defaultLanguage.value)?.displayName ?? "");

  /** What stops Initialize, as summary lines (empty when it can go ahead). */
  const problems = computed<SummaryLine[]>(() => {
    const list: SummaryLine[] = [];
    if (!chosenLanguages.value.length) {
      list.push({ text: "Languages: add at least one language.", path: FIELD_IDS.languages });
    } else if (!defaultLanguage.value) {
      list.push({ text: "Default language: choose which language is the default.", path: FIELD_IDS.defaultLanguage });
    }
    if (!surfacesToSend.value.length) {
      const names = (template.value?.supportedSurfaces ?? []).map((s) => SURFACE_COPY[s].label).join(", ");
      list.push({ text: `Surfaces: turn on at least one of ${names || "the Template's surfaces"}.`, path: FIELD_IDS.surfaces });
    }
    return list;
  });
  /** The first reason Initialize is blocked, for the button's stated reason. */
  const blockedReason = computed(() => problems.value[0]?.text ?? null);

  // Navigation ----------------------------------------------------------------------------------------------
  const stepIndex = computed(() => STEPS.findIndex((s) => s.key === step.value));
  const created1 = computed(() => !!created.value);

  /** A step is reachable once the Project exists (the first always is). */
  function canGo(key: StepKey): boolean {
    return key === "name" || created1.value;
  }

  async function goTo(key: StepKey) {
    if (!canGo(key)) return;
    summary.value = null;
    step.value = key;
    await nextTick();
    const heading = document.getElementById("step-heading");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "nearest" });
    const position = STEPS.findIndex((s) => s.key === key) + 1;
    say(`Step ${position} of ${STEPS.length}: ${STEPS[position - 1].label}`);
  }

  /** From the languages step: check, then show the review, or the summary of what is missing. */
  async function continueFromLanguages() {
    if (problems.value.length) {
      await showSummary({
        title: problems.value.length === 1 ? "1 thing to fix before the review" : `${problems.value.length} things to fix before the review`,
        items: problems.value,
        requestId: null,
      });
      return;
    }
    await goTo("review");
  }

  // Initialize ----------------------------------------------------------------------------------------------
  const initializing = ref(false);

  /** Where an `initialize` field error belongs, in the words of this page. */
  function describeInitPath(path: string): { label: string; id: string | null } {
    const lang = /^languages\[(\d+)\]/.exec(path);
    if (lang) return { label: `Language ${chosenLanguages.value[Number(lang[1])]?.displayName ?? Number(lang[1]) + 1}`, id: FIELD_IDS.languages };
    const surface = /^surfaces\[(\d+)\]/.exec(path);
    if (surface) return { label: `Surface ${SURFACE_COPY[surfacesToSend.value[Number(surface[1])]]?.label ?? Number(surface[1]) + 1}`, id: FIELD_IDS.surfaces };
    if (path === "templateId") return { label: "Template", id: null };
    if (path === "stylePreset") return { label: "Style", id: null };
    if (path === "defaultLanguage") return { label: "Default language", id: FIELD_IDS.defaultLanguage };
    if (path === "languages") return { label: "Languages", id: FIELD_IDS.languages };
    if (path === "surfaces") return { label: "Surfaces", id: FIELD_IDS.surfaces };
    return { label: "Setup", id: null };
  }

  async function initialize() {
    const project = created.value;
    if (!project || !template.value || !preset.value || initializing.value) return;
    if (problems.value.length) {
      await showSummary({ title: "Setup cannot finish yet", items: problems.value, requestId: null });
      return;
    }
    initializing.value = true;
    summary.value = null;
    try {
      const initialized = await initializeProject(project.id, {
        templateId: template.value.id,
        stylePreset: preset.value.key,
        languages: chosenLanguages.value,
        defaultLanguage: defaultLanguage.value,
        surfaces: surfacesToSend.value,
      });
      upsertProject(initialized);
      rememberProject(project.id);
      showToast("Project ready", `${template.value.name} set up its Categories and the ${preset.value.name} style. The visitor app starts as Draft.`);
      await router.push({ name: "project", params: { projectId: project.id } });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.code === "PROJECT_ALREADY_INITIALIZED") {
        await router.push({ name: "project", params: { projectId: project.id } });
        return;
      }
      const items: SummaryLine[] = e.fieldErrors.length
        ? e.fieldErrors.map((f) => {
            const where = describeInitPath(f.path);
            return { text: `${where.label}: ${f.message}`, path: where.id };
          })
        : [{ text: e.platformUnavailable || e.backendUnreachable ? "The UNICHE platform did not answer. Nothing was set up; try again in a moment." : "Setup did not finish. Nothing was lost; try again.", path: null }];
      await showSummary({ title: "The Project was not set up", items, requestId: e.requestId });
    } finally {
      initializing.value = false;
    }
  }

  // Page ----------------------------------------------------------------------------------------------------
  onMounted(() => {
    void loadTemplates();
    const id = route.query.resume;
    if (typeof id === "string" && id) void resume(id);
  });
  onBeforeUnmount(() => controller?.abort());

  /** Leaves the page: back where the author came from, or Home. */
  function close() {
    if (window.history.state?.back) router.back();
    else void router.push({ name: "home" });
  }

  const loadingOrganisations = computed(() => !created.value && (projectsState.status === "loading" || projectsState.status === "idle"));

  return reactive({
    step,
    stepIndex,
    orgId,
    name,
    slug,
    slugEdited,
    submitting,
    nameError,
    slugError,
    summary,
    created,
    resuming,
    resumeError,
    templates,
    templatesLoading,
    templatesError,
    templateId,
    presetKey,
    template,
    preset,
    chosenLanguages,
    defaultLanguage,
    defaultOrigin,
    defaultLanguageName,
    chosenSurfaces,
    addLanguageCode,
    addableLanguages,
    surfacesToSend,
    problems,
    blockedReason,
    initializing,
    loadingOrganisations,
    selectedOrgName,
    editSlug,
    submitName,
    loadTemplates,
    chooseTemplate,
    choosePreset,
    addLanguage,
    removeLanguage,
    makeDefault,
    setSurface,
    canGo,
    goTo,
    continueFromLanguages,
    initialize,
    close,
  });
}

/** The wizard object the step components receive. */
export type CreateProjectWizard = ReturnType<typeof useCreateProject>;
