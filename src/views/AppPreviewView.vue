<script setup lang="ts">
/*
 * "Open in new tab" of Visitor app → Preview (`12` §3; D-082): the stand-in visitor app alone under the author's own
 * session, at the surface's real size (fit to the window, or unscaled with "Open at real size"), under a slim control bar
 * for surface, language and content. The URL carries no token and opens nothing for anyone else. Parameters are read
 * without regard to case; one that names nothing known (or is malformed) is reported in a fixed sentence that never
 * repeats the value (C3-70), not silently replaced. `orientation` and `real` arrive as route props (C3-64) and the bar
 * states the scale in use. `<html lang>` follows the previewed content language while the page is open (the CMS bar is
 * marked `lang="en"`). The tab's title names what it shows, in every state. With `?t={code}`, the address a QR code encodes (`11` §9), it fires that QR trigger once the content is loaded,
 * standing in for the visitor app until it exists (DECISIONS.md D-019).
 */
import { Lock, SearchX, WifiOff } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, ref, watch, watchEffect } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import DeviceFrame from "@/components/preview/DeviceFrame.vue";
import PreviewApp from "@/components/preview/PreviewApp.vue";
import { parseSurface, SURFACES, SURFACE_KEYS, type Orientation, type Surface } from "@/components/preview/surfaces";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { StateCard } from "@/components/ui/state-card";
import { formatPercent } from "@/lib/format";
import { hints } from "@/lib/glossary";
import { ApiError } from "@/platform/api";
import { fetchProject } from "@/platform/catalogue";
import { listNavigations, type Navigation } from "@/platform/navigation";
import { previewMenu } from "@/workspace/navigationMenu";
import { sectionLocation } from "@/workspace/sections";
import { loadPreviewData, visibleData, withWorkingCopies, type PreviewData, type PreviewMode } from "@/workspace/previewData";
import { useProjectSettings } from "@/workspace/projectSettings";
import { themeStyle, useProjectTheme } from "@/workspace/projectTheme";

/** A query value as vue-router gives it: text, a list when repeated, or nothing. */
type Param = string | (string | null)[] | null | undefined;
const props = defineProps<{ projectId: string; surface?: Param; lang?: Param; mode?: Param; orientation?: Param; real?: Param; t?: Param }>();
const router = useRouter();
const route = useRoute();

/** The first value of a query parameter, trimmed; empty text counts as absent. */
function first(value: Param): string {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" ? v.trim() : "";
}
const rawSurface = computed(() => first(props.surface));
const rawLang = computed(() => first(props.lang));
const rawMode = computed(() => first(props.mode));
/** A parameter is in the address but the route dropped it (a malformed value): said without repeating it. */
const dropped = (key: "surface" | "lang" | "mode" | "t") => {
  const raw = route.query[key];
  const given = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return !!given && !first(props[key]);
};
const surface = computed<Surface>(() => parseSurface(rawSurface.value) ?? "WEB");
const mode = computed<PreviewMode>(() => (rawMode.value.toUpperCase() === "LIVE" ? "LIVE" : "WORKING"));
const orientation = computed<Orientation>(() => (first(props.orientation).toLowerCase() === "landscape" ? "landscape" : "portrait"));
const real = computed(() => ["1", "true", "yes"].includes(first(props.real).toLowerCase()));

const name = ref("");
const theme = useProjectTheme(computed(() => props.projectId));
const settings = useProjectSettings(computed(() => props.projectId));
const all = ref<PreviewData | null>(null);
const working = ref<PreviewData | null>(null);
/** The Project's menus; the app falls back to its default menu without them (D-055). */
const menus = ref<Navigation[]>([]);
const error = ref<ApiError | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  error.value = null;
  all.value = null;
  working.value = null;
  try {
    const [project, data, navigations] = await Promise.all([
      fetchProject(props.projectId, signal),
      loadPreviewData(props.projectId, signal),
      listNavigations(props.projectId, signal).catch((e) => {
        if (e instanceof ApiError) return [];
        throw e;
      }),
    ]);
    name.value = project.name;
    all.value = data;
    menus.value = navigations;
    await nextTick();
    fireCode();
    // The pending changes of active items follow, so "Working" shows them as the Preview page does.
    withWorkingCopies(props.projectId, data, signal)
      .then((result) => {
        if (!signal.aborted) working.value = result.data;
      })
      .catch((e) => {
        if (!(e instanceof ApiError) && !(e instanceof DOMException)) throw e;
      });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    error.value = e;
  }
}
watch(() => props.projectId, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const app = ref<InstanceType<typeof PreviewApp> | null>(null);
/** The link's QR code matches no trigger of the Project (the code itself is never repeated). */
const unknownCode = ref(false);

/** Opens what the `?t=` QR code opens, as a scan would; codes are compared without case. */
function fireCode() {
  const code = first(props.t);
  if (!all.value) return;
  if (!code) {
    unknownCode.value = dropped("t");
    return;
  }
  const trigger = all.value.triggers.find(
    (t) => t.triggerType === "QR_CODE" && t.status !== "ARCHIVED" && t.code?.toLowerCase() === code.toLowerCase(),
  );
  unknownCode.value = !trigger;
  if (trigger) app.value?.fire(trigger);
}

const defaultLanguage = computed(() => all.value?.languages.find((l) => l.isDefault)?.languageCode ?? null);
/** The language asked for, found without regard to case, else the Project's default. */
const matchedLanguage = computed(() => all.value?.languages.find((l) => l.languageCode.toLowerCase() === rawLang.value.toLowerCase()) ?? null);
const language = computed(() => matchedLanguage.value?.languageCode ?? defaultLanguage.value);
const activeLanguage = computed(() => all.value?.languages.find((l) => l.languageCode === language.value) ?? null);
const shown = computed(() => {
  if (!all.value) return null;
  return visibleData(mode.value === "WORKING" && working.value ? working.value : all.value, mode.value);
});
const menuOf = (context: "PRIMARY" | "FOOTER") =>
  shown.value
    ? previewMenu(menus.value.find((m) => m.context === context), { data: shown.value, language: language.value, defaultLanguage: defaultLanguage.value })
    : [];
const direction = computed(() => (activeLanguage.value?.direction === "RTL" ? "rtl" : "ltr"));

/** Parameters that name nothing known, said so the author sees why the tab is not what the link asked for. Fixed sentences: a rejected value is never echoed. */
const problems = computed(() => {
  const list: string[] = [];
  if ((rawSurface.value && !parseSurface(rawSurface.value)) || dropped("surface")) list.push("The surface in the link is not known (Web, Mobile or Kiosk). Showing Web.");
  if ((rawMode.value && !["LIVE", "WORKING"].includes(rawMode.value.toUpperCase())) || dropped("mode")) list.push("The content in the link is not known (Working or Live). Showing Working.");
  if (all.value && ((rawLang.value && !matchedLanguage.value) || dropped("lang"))) {
    list.push(`The language in the link is not a language of this Project. Showing ${activeLanguage.value?.displayName ?? "the default language"}.`);
  }
  return list;
});

/** The content language is the page's language; the CMS's own bar and notices say `lang="en"` themselves. */
watchEffect(() => {
  document.documentElement.lang = language.value ?? "en";
});
onBeforeUnmount(() => {
  document.documentElement.lang = "en";
});

/** The scale the screen is drawn at, stated in the bar (C3-70). */
const scale = ref(1);
const scaleText = computed(() => {
  const percent = Math.round(scale.value * 100);
  return percent >= 100 ? `Shown at real size (${formatPercent(100)})` : `Shown at ${formatPercent(percent)}${real.value ? "" : " (Fit width)"}`;
});

/** Nothing to draw: no Place, point of interest, Route, Guide or Event in this mode. Said outside the frame (C3-68). */
const isEmpty = computed(() => {
  const d = shown.value;
  return !!d && d.places.length + d.pois.length + d.routes.length + d.guides.length + d.events.length === 0;
});
const hasAnyRow = computed(() => {
  const d = all.value;
  return !!d && d.places.length + d.pois.length + d.routes.length + d.guides.length + d.events.length > 0;
});

/** The tab's title names the state: what loads, what failed, what is shown. */
watchEffect(() => {
  const brand = "iGuide CMS";
  if (error.value) {
    const status = error.value.status;
    document.title = `${status === 404 ? "Project not found" : status === 403 ? "No access to this preview" : "Preview unavailable"} · ${brand}`;
  } else if (!all.value) {
    document.title = `Loading preview · ${brand}`;
  } else {
    const content = mode.value === "WORKING" ? "Working content" : "Live content";
    document.title = `${SURFACES[surface.value].label}, ${activeLanguage.value?.displayName ?? "no language"}, ${content} · Preview · ${name.value} · ${brand}`;
  }
});

/** A control changes the address, so the tab can be reloaded or shared with the author's colleagues as it is. */
function setQuery(patch: Record<string, string | undefined>) {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries({ surface: surface.value, lang: language.value ?? "", mode: mode.value, real: real.value ? "1" : "", orientation: orientation.value === "landscape" ? "landscape" : "", t: first(props.t), ...patch })) {
    if (value) query[key] = value;
  }
  void router.replace({ query });
}
/** "Try again": once the preview is back focus goes to the page, never to `<body>` (a failure draws its own card, which takes focus). */
async function retry() {
  await load();
  if (!error.value) await nextTick(() => document.getElementById("main")?.focus({ preventScroll: true }));
}
const surfaceModel = computed({ get: () => surface.value, set: (v) => setQuery({ surface: String(v), orientation: undefined }) });
const languageModel = computed({ get: () => language.value ?? "", set: (v) => setQuery({ lang: String(v) }) });
const modeModel = computed({ get: () => mode.value, set: (v) => setQuery({ mode: String(v) }) });
const realModel = computed({ get: () => real.value, set: (v) => setQuery({ real: v ? "1" : "" }) });
</script>

<template>
  <div class="flex h-screen w-full min-w-0 flex-1 flex-col bg-muted text-foreground">
    <header v-if="all" lang="en" class="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-border bg-card px-4 py-2">
      <p class="mr-auto min-w-0 self-center truncate text-sm font-semibold">{{ name }} <span class="font-normal text-muted-foreground">· Preview</span></p>
      <div class="flex flex-col gap-0.5">
        <label for="np-surface" class="text-xs font-semibold text-ink-2">Surface</label>
        <Select id="np-surface" v-model="surfaceModel" class="min-w-[8rem]">
          <option v-for="key in SURFACE_KEYS" :key="key" :value="key">{{ SURFACES[key].label }}</option>
        </Select>
      </div>
      <div v-if="all.languages.length" class="flex flex-col gap-0.5">
        <label for="np-lang" class="text-xs font-semibold text-ink-2">Language</label>
        <Select id="np-lang" v-model="languageModel" class="min-w-[9rem]">
          <option v-for="l in all.languages" :key="l.languageCode" :value="l.languageCode">{{ l.displayName }}</option>
        </Select>
      </div>
      <div class="flex flex-col gap-0.5">
        <label for="np-mode" class="text-xs font-semibold text-ink-2">Content</label>
        <Select id="np-mode" v-model="modeModel" class="min-w-[8rem]">
          <option value="WORKING">Working</option>
          <option value="LIVE">Live</option>
        </Select>
      </div>
      <Checkbox v-model="realModel" class="self-end">Open at real size</Checkbox>
      <p class="basis-full text-xs text-muted-foreground" role="status">{{ scaleText }}.</p>
    </header>

    <div v-if="problems.length" lang="en" class="border-b border-border bg-card px-4 py-2">
      <Alert tone="warning" role="status">
        <p v-for="p in problems" :key="p">{{ p }}</p>
      </Alert>
    </div>

    <main v-if="error" id="main" tabindex="-1" class="flex flex-1 items-center overflow-auto p-4">
      <StateCard
        v-if="error.status === 404"
        :title="'This Project is not available'"
        :icon="SearchX"
      >
        It may have been deleted, or the link was mistyped. Projects you can open are listed in the CMS.
        <template #actions><Button as-child variant="secondary"><a href="/">Go to Projects</a></Button></template>
      </StateCard>
      <StateCard v-else-if="error.status === 403" title="You cannot open this preview" :icon="Lock" :request-id="error.requestId">
        Your account has no access to this Project. Ask the Project's owner to add you, or choose another Project.
        <template #actions><Button as-child variant="secondary"><a href="/">Go to Projects</a></Button></template>
      </StateCard>
      <StateCard v-else title="The preview could not be loaded" :icon="WifiOff" :request-id="error.requestId">
        {{ error.message }}
        <template #actions><Button variant="secondary" @click="retry">Try again</Button></template>
      </StateCard>
    </main>
    <main v-else-if="!all" class="m-8 text-sm text-muted-foreground" aria-busy="true" role="status">Loading the preview…</main>
    <main v-else-if="shown" id="main" tabindex="-1" class="min-h-0 flex-1 overflow-auto p-4">
      <p v-if="unknownCode" lang="en" role="status" class="mx-auto mb-3 max-w-3xl rounded-md border border-border bg-warning-tint px-4 py-2 text-sm text-warning">
        The QR code in the link matches no code in this Project. It may have been removed, or the link was mistyped.
      </p>
      <!-- Outside the frame: why it is empty, what to do, and what Working and Live mean (C3-68). -->
      <section v-if="isEmpty" lang="en" aria-labelledby="np-empty" class="mx-auto mb-3 flex max-w-3xl flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <h2 id="np-empty" class="font-semibold">{{ hasAnyRow ? "No active content yet" : "This Project has no content yet" }}</h2>
        <p class="text-ink-2">
          {{ hasAnyRow && mode === "LIVE" ? "Live shows only active items, and none is active. Switch Content to Working to see the drafts." : "Add a Place or a point of interest to see it here." }}
          {{ hints.previewContent }}
        </p>
        <p>
          <RouterLink :to="sectionLocation(projectId, 'places')" class="hit-44 font-semibold text-primary underline underline-offset-2">Open Places</RouterLink>
          <span aria-hidden="true"> · </span>
          <RouterLink :to="sectionLocation(projectId, 'pois')" class="hit-44 font-semibold text-primary underline underline-offset-2">Open points of interest</RouterLink>
        </p>
      </section>
      <DeviceFrame :surface="surface" :orientation="orientation" :zoom="real ? '100' : 'fit'" :dir="direction" :lang="language ?? undefined" :reserved-height="110" :style="themeStyle(theme)" @scale="scale = $event">
        <PreviewApp
          ref="app"
          semantic
          :data="shown"
          :language="language"
          :default-language="defaultLanguage"
          :surface="surface"
          :app-name="name"
          :theme="theme"
          :time-zone="settings?.timezone"
          :menu="menuOf('PRIMARY')"
          :footer="menuOf('FOOTER')"
        />
      </DeviceFrame>
    </main>
  </div>
</template>
