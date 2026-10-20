<script setup lang="ts">
/*
 * Visitor app overview (`12` §3, mockup screen 09). Only the content and the languages exist in the backend
 * yet; Pages, Navigation, Theme, Preview, and Launch show their place with a note instead of data
 * (GAPS.md G-009).
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/platform/api";
import { fetchProjectLanguages, type ProjectLanguage } from "@/platform/languages";
import { fetchContentCounts, type ContentCount } from "@/platform/overview";
import { useCurrentProject } from "@/workspace/currentProject";
import { findSection, sectionLocation } from "@/workspace/sections";

const section = findSection("overview")!;
const project = useCurrentProject();
const projectId = computed(() => project.value.id);

const counts = ref<ContentCount[]>([]);
const languages = ref<ProjectLanguage[]>([]);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
let controller: AbortController | null = null;

async function load() {
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  loading.value = true;
  loadError.value = null;
  try {
    const [c, l] = await Promise.all([fetchContentCounts(projectId.value, signal), fetchProjectLanguages(projectId.value, signal)]);
    counts.value = c;
    languages.value = l.languages;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    loadError.value = e;
  } finally {
    if (!signal.aborted) loading.value = false;
  }
}

watch(projectId, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const total = computed(() => counts.value.reduce((n, c) => n + c.active + c.draft, 0));
const defaultLanguage = computed(() => languages.value.find((l) => l.isDefault));

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

interface Step {
  title: string;
  text: string;
  to?: ReturnType<typeof sectionLocation>;
}

const steps = computed<Step[]>(() => [
  {
    title: "Content",
    text: total.value ? `${plural(total.value, "resource", "resources")} authored once` : "No content yet",
    to: sectionLocation(projectId.value, "places"),
  },
  { title: "Pages", text: "Not available yet" },
  { title: "Navigation", text: "Not available yet" },
  {
    title: "App settings",
    text: languages.value.length
      ? `${plural(languages.value.length, "language", "languages")}${defaultLanguage.value ? ` · default ${defaultLanguage.value.displayName}` : ""}`
      : "No languages yet",
    to: sectionLocation(projectId.value, "languages"),
  },
  { title: "Preview and Launch", text: "Not available yet" },
]);

const pending = [
  {
    title: "Pages",
    text: "Each Page with its sections and the menus that reach it; a Page no menu reaches is marked unreachable.",
  },
  { title: "Navigation", text: "The primary menu and the footer links, each item with its target; broken targets in red." },
  { title: "Theme", text: "The theme colours, applied to every Page on every surface, with their contrast checked." },
  { title: "Preview", text: "One thumbnail per enabled surface, opening the Preview on that surface." },
];
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead :title="section.title" :subtitle="section.subtitle" />

    <div v-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold text-destructive">
        {{ loadError.platformUnavailable ? "The UNICHE platform is not reachable" : "The overview could not be loaded" }}
      </strong>
      <p class="mt-1 text-[13px] text-gray-700">{{ loadError.message }}</p>
      <Button variant="outline" size="sm" class="mt-3" @click="load">Try again</Button>
    </div>

    <div v-else-if="loading" class="animate-skeleton space-y-4" aria-busy="true" aria-label="Loading the overview">
      <div class="h-[120px] rounded-[10px] border bg-card"></div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        <div v-for="n in 3" :key="n" class="h-[220px] rounded-[10px] border bg-card"></div>
      </div>
    </div>

    <template v-else>
      <section class="mb-4 rounded-[10px] border bg-card p-[18px]" aria-labelledby="overview-steps">
        <h2 id="overview-steps" class="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground">
          How it fits together
        </h2>
        <ol class="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5">
          <li v-for="(step, i) in steps" :key="step.title" class="min-w-0">
            <component
              :is="step.to ? RouterLink : 'div'"
              :to="step.to"
              class="block h-full rounded-lg border px-3.5 py-3"
              :class="step.to ? 'hover:border-primary hover:bg-accent/40' : 'bg-muted/40'"
            >
              <span class="block text-[10px] font-bold text-muted-foreground">{{ i + 1 }}</span>
              <span class="block text-[14px] font-bold" :class="step.to ? 'text-primary' : 'text-muted-foreground'">
                {{ step.title }}
              </span>
              <span class="block text-[12px] text-muted-foreground">{{ step.text }}</span>
            </component>
          </li>
        </ol>
      </section>

      <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-start gap-4">
        <section class="rounded-[10px] border bg-card" aria-labelledby="overview-content">
          <div class="flex items-center justify-between border-b px-[18px] py-3.5">
            <h2 id="overview-content" class="text-[14px] font-bold">Content</h2>
            <span class="text-[12px] text-muted-foreground">active · draft</span>
          </div>
          <ul class="divide-y">
            <li v-for="c in counts" :key="c.kind.path">
              <RouterLink
                :to="sectionLocation(projectId, c.kind.section)"
                class="flex items-center justify-between px-[18px] py-2.5 text-[13px] hover:bg-accent/40"
                :class="c.active + c.draft ? '' : 'text-muted-foreground'"
              >
                <span class="font-semibold">{{ c.kind.label }}</span>
                <span class="tabular-nums">
                  <span :class="c.active ? 'font-bold' : ''">{{ c.active }}</span>
                  <span class="text-muted-foreground"> · {{ c.draft }}</span>
                </span>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section v-for="p in pending" :key="p.title" class="rounded-[10px] border bg-card" :aria-label="p.title">
          <div class="border-b px-[18px] py-3.5">
            <h2 class="text-[14px] font-bold">{{ p.title }}</h2>
          </div>
          <div class="px-[18px] py-4 text-[13px]">
            <p class="text-muted-foreground">{{ p.text }}</p>
            <p class="mt-2 font-semibold">Not available yet: the authoring backend does not offer {{ p.title }} yet.</p>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>
