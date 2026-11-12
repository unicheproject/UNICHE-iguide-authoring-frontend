<script setup lang="ts">
/*
 * The stand-in visitor app of Visitor app → Preview (`12` §3 Preview; DECISIONS.md D-015): a shell with the
 * Project's main menu and footer links when it has them (`03` §13, D-055), else a default menu, Home, a list per kind, search, and the detail screens of `ResourceContent`, navigated on a
 * stack with Back. Triggers arrive through `fire`: a QR code opens its target, a beacon or geo-proximity
 * area only suggests it (`03` §14, `13` §7). Drawn in the Project's theme and with its app shell choices
 * (`04` §9–11, `workspace/projectTheme.ts`): search and the language switcher where the shell puts them, a bottom
 * bar or a burger menu on mobile, tiles or a header menu on a kiosk's Home. The parent sets the theme's CSS
 * variables; the menu's labels follow the previewed language (`strings.ts`).
 */
import { computed, ref, watch } from "vue";
import type { Trigger } from "@/platform/triggers";
import { previewHas, type PreviewData } from "@/workspace/previewData";
import { cardImage, modelFor, summaryOf, titleMissing, titleOf, type PreviewContext } from "@/workspace/previewModels";
import type { PreviewMenuItem, PreviewTarget } from "@/workspace/preview";
import type { PreviewTheme } from "@/workspace/projectTheme";
import ResourceContent from "./ResourceContent.vue";
import { previewStrings } from "./strings";
import type { Surface } from "./surfaces";

const props = defineProps<{
  data: PreviewData;
  language: string | null;
  defaultLanguage: string | null;
  surface: Surface;
  appName: string;
  theme: PreviewTheme;
  timeZone?: string | null;
  /** The PRIMARY Navigation; while it has no items a default menu of the content kinds stands in. */
  menu?: PreviewMenuItem[];
  /** The FOOTER links. */
  footer?: PreviewMenuItem[];
}>();

type Kind = PreviewTarget["type"];
type Screen =
  | { kind: "home" }
  | { kind: "list"; type: Kind }
  | { kind: "detail"; target: PreviewTarget; note?: string }
  | { kind: "search" };

const t = computed(() => previewStrings(props.language));
const KINDS = computed<{ type: Kind; label: string }[]>(() => [
  { type: "PLACE", label: t.value.places },
  { type: "POI", label: t.value.pois },
  { type: "ROUTE", label: t.value.routes },
  { type: "GUIDE", label: t.value.guides },
  { type: "EVENT", label: t.value.events },
]);
const kindLabel = (type: Kind) => KINDS.value.find((k) => k.type === type)!.label;

/** One entry of the menu the shell draws: a link, or a heading whose entries open under it. */
interface Entry {
  key: string;
  label: string;
  active: boolean;
  run?: () => void;
  children: Entry[];
}
const openGroup = ref<string | null>(null);
function toEntry(item: PreviewMenuItem): Entry {
  const target = item.target && previewHas(props.data, item.target) ? item.target : null;
  const s = screen.value;
  const self: Entry = {
    key: item.key,
    label: item.label,
    active: !!target && s.kind === "detail" && s.target.type === target.type && s.target.id === target.id,
    run: target ? () => go({ kind: "detail", target }, true) : undefined,
    children: [],
  };
  // Entries whose target this mode does not show are left out, as the runtime leaves out dead entries.
  const children = item.children.map(toEntry).filter((e) => e.run || e.children.length);
  // A link with entries under it opens them, itself first.
  return children.length ? { ...self, children: self.run ? [self, ...children] : children } : self;
}
const entries = computed<Entry[]>(() =>
  props.menu?.length
    ? props.menu.map(toEntry).filter((e) => e.run || e.children.length)
    : KINDS.value.map((k) => ({
        key: k.type,
        label: k.label,
        active: screen.value.kind === "list" && screen.value.type === k.type,
        run: () => go({ kind: "list", type: k.type }, true),
        children: [],
      })),
);
const footerEntries = computed(() => (props.footer ?? []).map(toEntry).filter((e) => e.run));
/** An entry with entries under it opens them; a link runs. */
function choose(entry: Entry) {
  if (entry.children.length) {
    openGroup.value = openGroup.value === entry.key ? null : entry.key;
    return;
  }
  openGroup.value = null;
  entry.run?.();
}
const groupEntries = computed(() => entries.value.find((e) => e.key === openGroup.value)?.children ?? []);
const shell = computed(() => props.theme.shell);
const menuOpen = ref(false);
/** A kiosk with tiles on Home shows no header menu (`04` §11 `kioskHome`). */
const tiles = computed(() => props.surface === "KIOSK" && shell.value.kioskHome === "TILES");
const logo = computed(() => (props.surface === "MOBILE" ? props.theme.compactLogoUrl : props.theme.logoUrl));

const stack = ref<Screen[]>([{ kind: "home" }]);
const screen = computed(() => stack.value[stack.value.length - 1]);
const suggestion = ref<{ target: PreviewTarget; text: string } | null>(null);
const query = ref("");
const scroller = ref<HTMLElement | null>(null);

const ctx = computed<PreviewContext>(() => ({
  data: props.data,
  language: props.language,
  defaultLanguage: props.defaultLanguage,
  timeZone: props.timeZone,
}));
const wide = computed(() => props.surface !== "MOBILE");
const mobile = computed(() => props.surface === "MOBILE");

function go(next: Screen, replace = false) {
  menuOpen.value = false;
  openGroup.value = null;
  stack.value = replace ? [{ kind: "home" }, ...(next.kind === "home" ? [] : [next])] : [...stack.value, next];
  scroller.value?.scrollTo({ top: 0 });
}
function back() {
  if (stack.value.length > 1) stack.value = stack.value.slice(0, -1);
}
const open = (target: PreviewTarget, note?: string) => go({ kind: "detail", target, note });

/** Resources of one kind in their order, featured ones first on Home. */
function idsOf(type: Kind): string[] {
  const d = props.data;
  const list: { id: string; featured: boolean; sortOrder: number }[] =
    type === "PLACE" ? d.places : type === "POI" ? d.pois : type === "ROUTE" ? d.routes : type === "GUIDE" ? d.guides : d.events;
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder).map((r) => r.id);
}
const featured = computed(() => {
  const d = props.data;
  const pick = (type: Kind, list: { id: string; featured: boolean }[]) => list.filter((r) => r.featured).map((r) => ({ type, id: r.id }));
  return [...pick("POI", d.pois), ...pick("ROUTE", d.routes), ...pick("GUIDE", d.guides), ...pick("EVENT", d.events), ...pick("PLACE", d.places)];
});

const card = (target: PreviewTarget) => ({
  target,
  title: titleOf(ctx.value, target),
  titleMissing: titleMissing(ctx.value, target),
  summary: summaryOf(ctx.value, target),
  image: cardImage(ctx.value, target),
});

const detail = computed(() => (screen.value.kind === "detail" ? modelFor(ctx.value, screen.value.target) : null));

const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return KINDS.value.flatMap(({ type }) => idsOf(type).map((id) => ({ type, id })))
    .filter((t) => {
      const poi = t.type === "POI" ? props.data.pois.find((p) => p.id === t.id) : undefined;
      return [titleOf(ctx.value, t), summaryOf(ctx.value, t)?.text ?? "", poi?.code ?? ""].some((s) => s.toLowerCase().includes(q));
    })
    .map(card);
});

const screenTitle = computed(() => {
  const s = screen.value;
  if (s.kind === "list") return kindLabel(s.type);
  if (s.kind === "search") return t.value.search;
  if (s.kind === "detail") return detail.value?.kindLabel ?? "";
  return props.appName;
});

/** A trigger reaching the app, as the runtime's trigger handler would receive it (`12` §3 Preview). */
function fire(trigger: Trigger) {
  // Trigger targets and preview targets name the kinds alike (DECISIONS.md D-018).
  const target: PreviewTarget = { type: trigger.targetResourceType, id: trigger.targetResourceId };
  if (!previewHas(props.data, target)) {
    suggestion.value = { target, text: "What this trigger opens is not shown in this mode." };
    return;
  }
  if (trigger.triggerType === "QR_CODE") {
    suggestion.value = null;
    open(target, `Opened by QR code ${trigger.code}`);
  } else {
    suggestion.value = { target, text: `Nearby: ${titleOf(ctx.value, target)}` };
  }
}
defineExpose({ fire, home: () => go({ kind: "home" }, true) });

// A detail whose Resource left the mode (Live hides drafts) falls back to Home.
watch(
  () => props.data,
  () => {
    if (screen.value.kind === "detail" && !detail.value) go({ kind: "home" }, true);
  },
);
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-col">
    <!-- Shell: the PRIMARY Navigation, or a default menu while it has no items. -->
    <header class="flex items-center gap-[1em] bg-[var(--t-primary)] px-[1.4em] py-[0.9em] text-[var(--t-on-primary)]">
      <button v-if="stack.length > 1" type="button" class="text-[1.2em]" :aria-label="t.back" @click="back">←</button>
      <button v-if="mobile && shell.mobileMenu === 'BURGER'" type="button" class="text-[1.2em]" :aria-label="t.menu" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">☰</button>
      <button type="button" class="flex min-w-0 items-center gap-[0.5em]" @click="go({ kind: 'home' }, true)">
        <img v-if="logo" :src="logo" alt="" class="h-[1.6em] w-auto flex-none object-contain" />
        <span class="truncate text-[1.15em] font-bold [font-family:var(--t-heading)]">{{ mobile ? screenTitle : appName }}</span>
      </button>
      <nav v-if="!mobile && !tiles" class="ml-auto flex items-center gap-[1.2em] text-[0.9em]">
        <button
          type="button"
          :class="screen.kind === 'home' ? 'underline underline-offset-4 font-bold' : 'opacity-85'"
          @click="go({ kind: 'home' }, true)"
        >
          {{ t.home }}
        </button>
        <div v-for="e in entries" :key="e.key" class="relative">
          <button
            type="button"
            :class="e.active ? 'underline underline-offset-4 font-bold' : 'opacity-85'"
            :aria-expanded="e.children.length ? openGroup === e.key : undefined"
            @click="choose(e)"
          >
            {{ e.label }}<span v-if="e.children.length" aria-hidden="true"> ▾</span>
          </button>
          <div
            v-if="openGroup === e.key"
            class="absolute right-0 top-[calc(100%+0.6em)] z-10 flex min-w-[12em] flex-col rounded-[var(--t-radius)] bg-[var(--t-bg)] py-[0.3em] text-[var(--t-text)] shadow-lg"
          >
            <button
              v-for="c in e.children"
              :key="c.key"
              type="button"
              class="px-[1em] py-[0.5em] text-start"
              :class="{ 'font-bold': c.active }"
              @click="choose(c)"
            >
              {{ c.label }}
            </button>
          </div>
        </div>
      </nav>
      <button
        v-if="shell.search === 'HEADER'"
        type="button"
        class="flex-none rounded-full border border-current px-[0.9em] py-[0.2em] text-[0.7em] font-bold uppercase tracking-[0.06em]"
        :class="{ 'ml-auto': mobile || tiles }"
        @click="go({ kind: 'search' })"
      >
        {{ t.search }}
      </button>
      <span
        v-if="shell.languageSwitcher === 'HEADER'"
        class="flex-none rounded-full border border-current px-[0.7em] py-[0.15em] text-[0.7em] font-bold uppercase"
        :class="{ 'ml-auto': shell.search !== 'HEADER' && (mobile || tiles) }"
        :title="t.language"
      >
        {{ language ?? "—" }} ▾
      </span>
    </header>

    <!-- The burger menu (`04` §11 `mobileMenu`). -->
    <nav v-if="mobile && menuOpen" class="absolute inset-x-0 top-[3.2em] z-10 flex flex-col bg-[var(--t-bg)] shadow-lg">
      <button type="button" class="border-b border-[var(--t-border)] px-[1.4em] py-[0.9em] text-start font-semibold" @click="go({ kind: 'home' }, true)">{{ t.home }}</button>
      <template v-for="e in entries" :key="e.key">
        <button
          v-if="!e.children.length"
          type="button"
          class="border-b border-[var(--t-border)] px-[1.4em] py-[0.9em] text-start font-semibold"
          @click="choose(e)"
        >
          {{ e.label }}
        </button>
        <span v-else class="border-b border-[var(--t-border)] px-[1.4em] pb-[0.3em] pt-[0.9em] text-[0.8em] font-bold uppercase text-[var(--t-muted)]">
          {{ e.label }}
        </span>
        <button
          v-for="c in e.children"
          :key="c.key"
          type="button"
          class="border-b border-[var(--t-border)] py-[0.8em] pe-[1.4em] ps-[2.4em] text-start"
          @click="choose(c)"
        >
          {{ c.label }}
        </button>
      </template>
    </nav>

    <!-- A heading chosen in the bottom bar opens its entries above it. -->
    <nav v-if="mobile && shell.mobileMenu === 'BOTTOM_BAR' && groupEntries.length" class="absolute inset-x-0 bottom-[3.1em] z-10 flex flex-col bg-[var(--t-bg)] shadow-lg">
      <button
        v-for="c in groupEntries"
        :key="c.key"
        type="button"
        class="border-t border-[var(--t-border)] px-[1.4em] py-[0.9em] text-start font-semibold"
        @click="choose(c)"
      >
        {{ c.label }}
      </button>
    </nav>

    <div v-if="suggestion" class="flex items-center gap-[0.8em] bg-[var(--t-tint)] px-[1.4em] py-[0.6em] text-[0.9em]">
      <span class="text-[var(--t-accent)]">◎</span>
      <span class="flex-1">{{ suggestion.text }}</span>
      <button
        v-if="data.pois.some((p) => p.id === suggestion!.target.id)"
        type="button"
        class="font-bold text-[var(--t-accent)]"
        @click="open(suggestion.target); suggestion = null"
      >
        Open
      </button>
      <button type="button" aria-label="Dismiss" class="text-[var(--t-muted)]" @click="suggestion = null">×</button>
    </div>

    <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto">
      <!-- Home -->
      <div v-if="screen.kind === 'home'" :class="wide ? 'mx-auto max-w-[60em] px-[2em] py-[1.6em]' : 'px-[1.1em] py-[1.1em]'" class="flex flex-col gap-[calc(1.6em*var(--t-space))]">
        <h1 class="text-[1.9em] font-bold [font-family:var(--t-heading)]">{{ appName }}</h1>
        <p v-if="!KINDS.some((k) => idsOf(k.type).length)" class="text-[var(--t-muted)]">{{ t.nothingInMode }}</p>
        <div v-if="tiles" class="grid grid-cols-3 gap-[0.8em]">
          <button
            v-for="k in KINDS"
            :key="k.type"
            type="button"
            class="rounded-[var(--t-radius)] bg-[var(--t-primary)] px-[1em] py-[1.6em] text-start text-[1.1em] font-bold text-[var(--t-on-primary)] [font-family:var(--t-heading)]"
            @click="go({ kind: 'list', type: k.type })"
          >
            {{ k.label }}
          </button>
        </div>
        <section v-if="featured.length">
          <h2 class="mb-[0.6em] text-[0.8em] font-extrabold uppercase tracking-[0.08em] text-[var(--t-accent)]">{{ t.highlights }}</h2>
          <div class="grid gap-[0.8em]" :class="wide ? 'grid-cols-3' : 'grid-cols-1'">
            <button v-for="c in featured.map(card)" :key="c.target.id" type="button" class="card" @click="open(c.target)">
              <img v-if="c.image" :src="c.image" alt="" class="mb-[0.5em] aspect-[16/9] w-full rounded-[calc(var(--t-radius)*0.7)] object-cover" />
              <span class="block font-bold" :class="{ missing: c.titleMissing }">{{ c.title }}</span>
              <span v-if="c.summary" class="block text-[0.85em] text-[var(--t-muted)]" :class="{ missing: c.summary.missing }">{{ c.summary.text }}</span>
            </button>
          </div>
        </section>
        <template v-for="k in KINDS" :key="k.type">
          <section v-if="idsOf(k.type).length">
            <div class="mb-[0.6em] flex items-baseline">
              <h2 class="text-[0.8em] font-extrabold uppercase tracking-[0.08em] text-[var(--t-accent)]">{{ k.label }}</h2>
              <button type="button" class="ml-auto text-[0.8em] font-bold text-[var(--t-accent)]" @click="go({ kind: 'list', type: k.type })">{{ t.seeAll }}</button>
            </div>
            <div class="grid gap-[0.8em]" :class="wide ? 'grid-cols-4' : 'grid-cols-2'">
              <button
                v-for="c in idsOf(k.type).slice(0, wide ? 4 : 2).map((id) => card({ type: k.type, id }))"
                :key="c.target.id"
                type="button"
                class="card"
                @click="open(c.target)"
              >
                <img v-if="c.image" :src="c.image" alt="" class="mb-[0.5em] aspect-[16/9] w-full rounded-[calc(var(--t-radius)*0.7)] object-cover" />
                <span class="block font-bold" :class="{ missing: c.titleMissing }">{{ c.title }}</span>
                <span v-if="c.summary" class="line-clamp-3 block text-[0.85em] text-[var(--t-muted)]" :class="{ missing: c.summary.missing }">{{ c.summary.text }}</span>
              </button>
            </div>
          </section>
        </template>
      </div>

      <!-- A list per kind -->
      <div v-else-if="screen.kind === 'list'" :class="wide ? 'mx-auto max-w-[60em] px-[2em] py-[1.6em]' : 'px-[1.1em] py-[1.1em]'" class="flex flex-col gap-[1em]">
        <h1 v-if="!mobile" class="text-[1.7em] font-extrabold [font-family:var(--t-heading)]">{{ screenTitle }}</h1>
        <p v-if="!idsOf(screen.type).length" class="text-[var(--t-muted)]">{{ t.nothingYet }}</p>
        <div class="grid gap-[0.8em]" :class="wide ? 'grid-cols-3' : 'grid-cols-1'">
          <button
            v-for="c in idsOf(screen.type).map((id) => card({ type: (screen as { type: Kind }).type, id }))"
            :key="c.target.id"
            type="button"
            class="card"
            @click="open(c.target)"
          >
            <img v-if="c.image" :src="c.image" alt="" class="mb-[0.5em] aspect-[16/9] w-full rounded-[calc(var(--t-radius)*0.7)] object-cover" />
            <span class="block font-bold" :class="{ missing: c.titleMissing }">{{ c.title }}</span>
            <span v-if="c.summary" class="line-clamp-3 block text-[0.85em] text-[var(--t-muted)]" :class="{ missing: c.summary.missing }">{{ c.summary.text }}</span>
          </button>
        </div>
      </div>

      <!-- Search -->
      <div v-else-if="screen.kind === 'search'" :class="wide ? 'mx-auto max-w-[48em] px-[2em] py-[1.6em]' : 'px-[1.1em] py-[1.1em]'" class="flex flex-col gap-[1em]">
        <input v-model="query" type="search" :placeholder="t.searchPlaceholder" class="w-full rounded-full border border-[var(--t-border)] bg-[var(--t-bg)] px-[1em] py-[0.6em]" />
        <p v-if="query.trim() && !results.length" class="text-[var(--t-muted)]">{{ t.noResults }}</p>
        <button v-for="c in results" :key="c.target.type + c.target.id" type="button" class="card" @click="open(c.target)">
          <span class="block text-[0.7em] font-bold uppercase tracking-[0.06em] text-[var(--t-muted)]">{{ kindLabel(c.target.type) }}</span>
          <span class="block font-bold" :class="{ missing: c.titleMissing }">{{ c.title }}</span>
        </button>
      </div>

      <!-- Detail -->
      <template v-else-if="screen.kind === 'detail'">
        <div v-if="screen.note" class="bg-[#e1f3ea] px-[1.4em] py-[0.5em] text-[0.8em] font-semibold text-[#17643f]">{{ screen.note }}</div>
        <ResourceContent v-if="detail" :model="detail" :wide="wide" navigable @open="open($event)" />
      </template>
    </div>

    <!-- The FOOTER links (`03` §13). -->
    <nav v-if="footerEntries.length" class="flex flex-wrap justify-center gap-x-[1.2em] gap-y-[0.3em] border-t border-[var(--t-border)] px-[1em] py-[0.6em] text-[0.8em] text-[var(--t-muted)]">
      <button v-for="e in footerEntries" :key="e.key" type="button" class="underline underline-offset-2" @click="choose(e)">{{ e.label }}</button>
    </nav>

    <!-- The language switcher in the footer (`04` §11 `languageSwitcher`). -->
    <div v-if="shell.languageSwitcher === 'FOOTER'" class="flex justify-center border-t border-[var(--t-border)] py-[0.5em] text-[0.75em] font-bold uppercase text-[var(--t-muted)]">
      {{ t.language }}: {{ language ?? "—" }} ▾
    </div>

    <!-- On mobile the menu is a bottom bar, unless the shell asks for a burger. -->
    <nav v-if="mobile && shell.mobileMenu === 'BOTTOM_BAR'" class="flex bg-[var(--t-primary)] text-[0.62em] font-semibold text-[var(--t-on-primary)]">
      <button type="button" class="min-w-0 flex-1 truncate px-[0.3em] py-[1em]" :class="screen.kind === 'home' ? 'font-extrabold underline underline-offset-4' : 'opacity-85'" @click="go({ kind: 'home' }, true)">{{ t.home }}</button>
      <button
        v-for="e in entries"
        :key="e.key"
        type="button"
        class="min-w-0 flex-1 truncate px-[0.3em] py-[1em]"
        :class="e.active || openGroup === e.key ? 'font-extrabold underline underline-offset-4' : 'opacity-85'"
        :aria-expanded="e.children.length ? openGroup === e.key : undefined"
        @click="choose(e)"
      >
        {{ e.label }}
      </button>
    </nav>
  </div>
</template>

<style scoped>
.card {
  display: block;
  width: 100%;
  border: 1px solid var(--t-border);
  border-radius: var(--t-radius);
  padding: calc(0.8em * var(--t-space)) calc(0.9em * var(--t-space));
  text-align: start;
  background: var(--t-bg);
}
.card:hover {
  border-color: var(--t-primary);
}
.missing {
  outline: 2px dashed #dc2626;
  outline-offset: 2px;
}
</style>
