<script setup lang="ts">
/*
 * Visitor app → Preview (`12` §3 Preview, mockup screen 14; D-082): the stand-in visitor app (DECISIONS.md D-015) per
 * surface and language, with "Working" content (drafts, and the pending changes of active items where the API returns
 * them, G-034) or "Live" content (active only), a "fire a trigger" control, and "Open in new tab" under the author's own
 * session. The frame is a named region, its screen inert until the author chooses to interact (Esc stops it). One compact
 * toolbar comes first so the picture starts high on the page (D-093); `?trigger=<id>` (the editors' "Test in preview")
 * chooses the surface the trigger reaches, selects it and fires it (C2-61). Nothing here is shareable or changes what
 * visitors see, and no analytics event is sent.
 */
import { ExternalLink } from "lucide-vue-next";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import PageFrame from "@/components/PageFrame.vue";
import PageHead from "@/components/PageHead.vue";
import FireTrigger from "@/components/preview/FireTrigger.vue";
import PreviewApp from "@/components/preview/PreviewApp.vue";
import PreviewControls from "@/components/preview/PreviewControls.vue";
import PreviewPane from "@/components/preview/PreviewPane.vue";
import PreviewSize from "@/components/preview/PreviewSize.vue";
import { firstEnabledSurface, SURFACE_KEYS, SURFACES, triggerReaches, type Orientation, type Surface, type Zoom } from "@/components/preview/surfaces";
import { ProblemAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { say } from "@/lib/announcer";
import { hints } from "@/lib/glossary";
import { ApiError } from "@/platform/api";
import { listNavigations, type Navigation } from "@/platform/navigation";
import { fetchSurfaces } from "@/platform/surfaces";
import { TRIGGER_LABELS, type Trigger } from "@/platform/triggers";
import { useCurrentProject } from "@/workspace/currentProject";
import { previewMenu } from "@/workspace/navigationMenu";
import { loadPreviewData, visibleData, withWorkingCopies, type PreviewData, type PreviewMode, type WorkingOverlay } from "@/workspace/previewData";
import { titleMissing, titleOf, type PreviewContext } from "@/workspace/previewModels";
import { useProjectSettings } from "@/workspace/projectSettings";
import { themeStyle, useProjectTheme } from "@/workspace/projectTheme";
import { findSection, sectionLocation } from "@/workspace/sections";

const section = findSection("preview")!;
const project = useCurrentProject();
const projectId = computed(() => project.value.id);
const router = useRouter();
const route = useRoute();

/** The rows as the list endpoints return them: drafts and active items, the active ones as they are live. */
const all = ref<PreviewData | null>(null);
/** The same with each active item's Working Copy drawn in place of its live row (`12` §3), once read. */
const working = ref<PreviewData | null>(null);
const overlay = ref<WorkingOverlay | null>(null);
const overlayFailed = ref(false);
/** The Project's menus; the app falls back to its default menu without them (D-055). */
const menus = ref<Navigation[]>([]);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

const surface = ref<Surface>("WEB");
const orientation = ref<Orientation>("portrait");
const zoom = ref<Zoom>("fit");
const language = ref<string | null>(null);
const mode = ref<PreviewMode>("WORKING");
const interactive = ref(false);
/** The trigger last fired, as the chip names it; cleared when the surface, language or content changes. */
const fired = ref<string | null>(null);
const app = ref<InstanceType<typeof PreviewApp> | null>(null);
const firing = ref<InstanceType<typeof FireTrigger> | null>(null);
/** The scale "Fit width" gives, so a size choice that would look the same is not offered. */
const fitScale = ref(1);
/** A phone, or a screen that already fits at real size, is always drawn by Fit width. */
const effectiveZoom = computed<Zoom>(() => (surface.value === "MOBILE" || (zoom.value === "100" && fitScale.value >= 0.995) ? "fit" : zoom.value));
/** Why `?trigger=` could not be fired, said next to the picture. */
const triggerNote = ref("");
const theme = useProjectTheme(projectId);
const settings = useProjectSettings(projectId);

async function load() {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  loading.value = true;
  loadError.value = null;
  working.value = null;
  overlay.value = null;
  overlayFailed.value = false;
  try {
    const [data, navigations, surfaces] = await Promise.all([
      loadPreviewData(projectId.value, signal),
      listNavigations(projectId.value, signal).catch((e) => {
        if (e instanceof ApiError) return [];
        throw e;
      }),
      fetchSurfaces(projectId.value, signal).catch((e) => {
        if (e instanceof ApiError) return [];
        throw e;
      }),
    ]);
    all.value = data;
    menus.value = navigations;
    const codes = data.languages.map((l) => l.languageCode);
    if (!language.value || !codes.includes(language.value)) language.value = defaultLanguage.value;
    // The Project's first enabled surface is where the preview opens; the author's own choice is kept on a reload.
    if (!surfaceChosen) surface.value = firstEnabledSurface(surfaces.filter((s) => s.enabled).map((s) => s.surface));
    loading.value = false;
    void loadWorking(data, signal);
    void applyTriggerParam();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    loadError.value = e;
    loading.value = false;
  }
}
/** Reads the pending changes of active items after the page is up, so the first picture is not held back. */
async function loadWorking(data: PreviewData, signal: AbortSignal) {
  try {
    const result = await withWorkingCopies(projectId.value, data, signal);
    if (signal.aborted) return;
    working.value = result.data;
    overlay.value = result.overlay;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    overlayFailed.value = true;
  }
}
let surfaceChosen = false;
watch(projectId, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const defaultLanguage = computed(() => all.value?.languages.find((l) => l.isDefault)?.languageCode ?? null);
const data = computed(() => {
  if (!all.value) return null;
  return visibleData(mode.value === "WORKING" && working.value ? working.value : all.value, mode.value);
});
const menuOf = (context: "PRIMARY" | "FOOTER") =>
  data.value
    ? previewMenu(menus.value.find((m) => m.context === context), { data: data.value, language: language.value, defaultLanguage: defaultLanguage.value })
    : [];
const activeLanguage = computed(() => all.value?.languages.find((l) => l.languageCode === language.value) ?? null);
const ctx = computed<PreviewContext | null>(() =>
  data.value ? { data: data.value, language: language.value, defaultLanguage: defaultLanguage.value } : null,
);

/** The pane's accessible name, also announced when the view changes: "Preview: Kiosk, Ελληνικά, working content". */
const regionLabel = computed(
  () => `Preview: ${SURFACES[surface.value].label}, ${activeLanguage.value?.displayName ?? "no language"}, ${mode.value === "WORKING" ? "working" : "live"} content`,
);

/** The items whose title the chosen language lacks, named by what visitors see instead (the default language's). */
const missing = computed(() => {
  const d = data.value;
  const c = ctx.value;
  const code = language.value;
  if (!d || !c || !code) return [];
  const kinds = [
    ["Place", "PLACE", d.places],
    ["Point of interest", "POI", d.pois],
    ["Route", "ROUTE", d.routes],
    ["Guide", "GUIDE", d.guides],
    ["Event", "EVENT", d.events],
  ] as const;
  return kinds.flatMap(([kind, type, rows]) =>
    rows.filter((r) => titleMissing(c, { type, id: r.id })).map((r) => ({ key: `${type}:${r.id}`, kind, slug: SLUGS[type], name: titleOf(c, { type, id: r.id }) })),
  );
});
const SLUGS = { PLACE: "places", POI: "pois", ROUTE: "routes", GUIDE: "guides", EVENT: "events" } as const;
/** The missing titles per kind, each with the filtered list ("Needs translation" in the chosen language) that holds them. */
const missingKinds = computed(() => {
  const groups = new Map<string, { kind: string; slug: string; count: number }>();
  for (const m of missing.value) {
    const g = groups.get(m.slug) ?? { kind: m.kind, slug: m.slug, count: 0 };
    g.count += 1;
    groups.set(m.slug, g);
  }
  return [...groups.values()];
});
/** The filtered list that holds a kind's missing titles: the worklist language and "Needs translation" (C3-51). */
const missingLocation = (slug: string) => ({ ...sectionLocation(projectId.value, slug), query: { lang: language.value ?? undefined, missing: language.value ?? undefined } });
const PLURALS = { Place: "places", "Point of interest": "points of interest", Route: "routes", Guide: "guides", Event: "events" } as Record<string, string>;
/** No Place, point of interest, Route, Guide or Event shows in this view (C3-68). */
const isEmpty = computed(() => {
  const d = data.value;
  return !!d && d.places.length + d.pois.length + d.routes.length + d.guides.length + d.events.length === 0;
});
const hasDrafts = computed(() => {
  const d = all.value;
  return !!d && d.places.length + d.pois.length + d.routes.length + d.guides.length + d.events.length > 0;
});

/** What the Working content holds, said plainly (G-034): the pending changes drawn, or why they are not. */
const workingNote = computed(() => {
  const o = overlay.value;
  if (overlayFailed.value) {
    return "Drafts shown. Pending changes of active items could not be read; they are shown in each editor's preview.";
  }
  if (!o) return working.value || !all.value ? "" : "Drafts shown. Reading the pending changes of active items…";
  if (!o.pending) return "Drafts and active content shown. No active item has pending changes.";
  if (!o.applied) return "Drafts shown. Pending changes of active items could not be read; they are shown in each editor's preview.";
  const drawn = `Drafts and ${o.applied} pending change${o.applied === 1 ? "" : "s"} of active items shown.`;
  return o.failed ? `${drawn} ${o.failed} could not be read; their live content is shown instead.` : drawn;
});
const statusLine = computed(() =>
  mode.value === "WORKING" ? workingNote.value : "Active content only, as visitors see it. Drafts and pending changes are not shown.",
);

const allTriggers = computed(() => (all.value?.triggers ?? []).filter((t) => t.status !== "ARCHIVED"));
function targetName(t: Trigger): string {
  const base = all.value;
  if (!base) return "";
  // Names come from the full data, so a trigger whose target is hidden in Live still reads by its name.
  return titleOf({ data: base, language: language.value, defaultLanguage: defaultLanguage.value }, { type: t.targetResourceType, id: t.targetResourceId });
}
/** `?trigger=<id>`: shows the surface the trigger reaches, then chooses and fires it, or says why that is not possible. */
async function applyTriggerParam() {
  const id = typeof route.query.trigger === "string" ? route.query.trigger : "";
  triggerNote.value = "";
  if (!id || !all.value) return;
  const trigger = allTriggers.value.find((t) => t.id === id);
  if (!trigger) {
    triggerNote.value = "The trigger from the link was not found. It may have been archived or deleted.";
    dropTriggerParam();
    return;
  }
  if (!triggerReaches(trigger, surface.value)) surface.value = SURFACE_KEYS.find((key) => triggerReaches(trigger, key)) ?? surface.value;
  if (trigger.status !== "ACTIVE") mode.value = "WORKING";
  // The trigger list and the stand-in follow the surface and content choice on the next render.
  await nextTick();
  await nextTick();
  if (!firing.value?.fireById(id)) {
    triggerNote.value = `${TRIGGER_LABELS[trigger.triggerType]}, ${targetName(trigger)} is not offered on ${SURFACES[surface.value].label} in this view.`;
  }
  dropTriggerParam();
}
/** `?trigger=` is used once: it leaves the address, so a reload or a shared link does not fire it again (C3-69). */
function dropTriggerParam() {
  if (route.query.trigger === undefined) return;
  const { trigger: _used, ...rest } = route.query;
  void router.replace({ query: rest });
}
watch(
  () => route.query.trigger,
  () => {
    if (!loading.value) void applyTriggerParam();
  },
);
function fire(trigger: Trigger, label: string) {
  app.value?.fire(trigger);
  triggerNote.value = "";
  fired.value = label;
  say(`Fired ${label}`);
}
function reset() {
  app.value?.home();
  app.value?.clearNotes();
  fired.value = null;
  say("Preview reset to Home");
}

// A note, or a trigger's chip, belongs to the view it was made in: another surface, language or content drops them.
watch([surface, language, mode], () => {
  app.value?.clearNotes();
  fired.value = null;
  if (!loading.value) say(regionLabel.value);
});
watch(surface, () => (surfaceChosen = true));

function openInNewTab() {
  const href = router.resolve({
    name: "app-preview",
    params: { projectId: projectId.value },
    query: {
      surface: surface.value,
      lang: language.value ?? undefined,
      mode: mode.value,
      orientation: surface.value === "KIOSK" && orientation.value === "landscape" ? "landscape" : undefined,
      real: zoom.value === "100" ? "1" : undefined,
    },
  }).href;
  // One named tab per Project, so a second click refreshes it instead of piling up tabs; no `opener` link back.
  const tab = window.open(href, `iguide-preview-${projectId.value}`);
  if (tab) tab.opener = null;
}
</script>

<template>
  <PageFrame :busy="loading">
    <PageHead :title="section.title" subtitle="The visitor app as it will look, per surface and language. Nothing here changes what visitors see.">
      <template #actions>
        <Button variant="secondary" :disabled-reason="data ? undefined : 'The preview is still loading.'" @click="openInNewTab">
          <ExternalLink aria-hidden="true" />Open in new tab
        </Button>
      </template>
    </PageHead>

    <ProblemAlert v-if="loadError" :error="loadError" action="load the preview" @retry="load" />

    <div v-else-if="loading || !data" class="animate-skeleton space-y-4" role="status" aria-label="Loading the preview">
      <div class="h-16 rounded-lg border border-border bg-card"></div>
      <div class="mx-auto h-stage max-w-4xl rounded-lg border border-border bg-card"></div>
    </div>

    <template v-else>
      <!-- One compact toolbar: what to show, then what to fire. Sticky where the window is tall enough to spare the room. -->
      <div class="z-sticky mb-3 flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-1.5 [@media(min-height:760px)]:sticky [@media(min-height:760px)]:-top-6" data-preview-toolbar>
        <PreviewControls v-model:surface="surface" v-model:language="language" v-model:mode="mode" :languages="all?.languages ?? []" />
        <FireTrigger ref="firing" :triggers="allTriggers" :surface="surface" :mode="mode" :target-name="targetName" :fired="fired" @fire="fire" @reset="reset" />
      </div>
      <p v-if="triggerNote" class="mb-3 text-sm text-warning" role="status">{{ triggerNote }}</p>

      <!-- Outside the frame: why it is empty, where to add content, and what Working and Live mean (C3-68). -->
      <section v-if="isEmpty" aria-labelledby="preview-empty" class="mb-3 flex max-w-3xl flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <h2 id="preview-empty" class="font-semibold">{{ hasDrafts ? "No active content yet" : "This Project has no content yet" }}</h2>
        <p class="text-ink-2">
          {{ hasDrafts && mode === "LIVE" ? "Live shows only active items, and none is active yet. Switch Content to Working to see the drafts." : "Add a Place or a point of interest and it appears here." }}
          {{ hints.previewContent }}
        </p>
        <p>
          <RouterLink :to="sectionLocation(projectId, 'places')" class="hit-44 font-semibold text-primary underline underline-offset-2">Open Places</RouterLink>
          <span aria-hidden="true"> · </span>
          <RouterLink :to="sectionLocation(projectId, 'pois')" class="hit-44 font-semibold text-primary underline underline-offset-2">Open points of interest</RouterLink>
        </p>
      </section>

      <PreviewPane
        v-model:interactive="interactive"
        :surface="surface"
        :orientation="orientation"
        :zoom="effectiveZoom"
        :label="regionLabel"
        :dir="activeLanguage?.direction === 'RTL' ? 'rtl' : 'ltr'"
        :lang="language ?? undefined"
        :style="themeStyle(theme)"
        browser-chrome
        @fit="fitScale = $event"
      >
        <template #actions>
          <PreviewSize v-model:zoom="zoom" v-model:orientation="orientation" :surface="surface" :fit-scale="fitScale" />
        </template>
        <PreviewApp
          ref="app"
          :data="data"
          :language="language"
          :default-language="defaultLanguage"
          :surface="surface"
          :app-name="project.name"
          :theme="theme"
          :time-zone="settings?.timezone"
          :menu="menuOf('PRIMARY')"
          :footer="menuOf('FOOTER')"
        />
      </PreviewPane>

      <!-- What the picture holds, under it: the content state, an approximation notice and the missing titles. -->
      <div class="mt-3 flex max-w-3xl flex-col gap-1 text-xs text-muted-foreground">
        <p role="status">{{ statusLine }}</p>
        <p>
          An approximation in {{ theme.styleName ? `the Project's theme (${theme.styleName})` : "the default theme" }}; the visitor app is not available yet.
          {{ menuOf("PRIMARY").length ? "" : "A default menu stands in until Navigation has one." }} Dashed outlines mark missing texts.
        </p>
        <div v-if="missing.length" class="text-sm">
          <p class="font-semibold text-ink-2">
            {{ missing.length }} missing title{{ missing.length === 1 ? "" : "s" }} in {{ activeLanguage?.displayName }}.
            <span class="font-normal text-muted-foreground">Visitors of this language see the default language's title for these.</span>
          </p>
          <ul class="flex flex-wrap gap-x-4">
            <li v-for="g in missingKinds" :key="g.slug">
              <RouterLink :to="missingLocation(g.slug)" class="hit-44 font-semibold text-primary underline underline-offset-2">
                {{ g.count }} in {{ PLURALS[g.kind] ?? g.kind.toLowerCase() }}<span class="sr-only">: show them in the list</span>
              </RouterLink>
            </li>
          </ul>
          <details>
            <summary class="cursor-pointer py-1 font-semibold text-primary">Which ones</summary>
            <ul class="mt-1 columns-1 gap-6 sm:columns-2">
              <li v-for="m in missing" :key="m.key" class="break-inside-avoid py-0.5"><span>{{ m.kind }}:</span> {{ m.name }}</li>
            </ul>
          </details>
        </div>
        <p v-else>No missing titles in {{ activeLanguage?.displayName }}.</p>
      </div>
    </template>
  </PageFrame>
</template>
