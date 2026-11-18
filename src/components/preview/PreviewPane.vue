<script setup lang="ts">
/**
 * The one preview pane (D-082): a named region around a device frame, shared by the Preview page, the editors'
 * "Preview in app" panel and any place that draws the stand-in. The stand-in is a picture of the visitor app, not part of
 * the CMS: it is `inert` until the author chooses "Interact with the preview", so it adds no tab stops and no
 * headings to the page; a "Skip preview" link comes first, so the CMS chrome after the frame stays one Tab away
 * (`14` §4 "labelled preview frame"). While the author interacts, Esc stops it and returns focus to the Interact button
 * (a second Esc is then the host's, for example closing the editor panel; D-093). The scale in use is stated under the frame's caption. The default slot is the screen's
 * content; the `actions` slot sits beside the caption (for example "Open at real size").
 */
import { MousePointerClick } from "lucide-vue-next";
import { computed, nextTick, ref, useId } from "vue";
import { Button } from "@/components/ui/button";
import { say } from "@/lib/announcer";
import { formatPercent } from "@/lib/format";
import DeviceFrame from "./DeviceFrame.vue";
import { surfaceCaption, type Orientation, type Surface, type Zoom } from "./surfaces";

const props = withDefaults(
  defineProps<{
    surface: Surface;
    /** The region's accessible name, for example "Preview: Kiosk, Ελληνικά, working content". */
    label: string;
    orientation?: Orientation;
    zoom?: Zoom;
    dir?: "ltr" | "rtl";
    lang?: string;
    browserChrome?: boolean;
    /** The author chose to interact: the stand-in then takes focus and clicks like the visitor app. */
    interactive?: boolean;
    /**
     * The slot applies `inert` itself (it receives `{ inert }`), so it can keep a scroll region outside the inert content
     * and the author can still scroll a long screen. Without it the whole screen is inert.
     */
    contentInert?: boolean;
    /** A narrow host (the editor panel): the caption states the scale only, without the advice to change size. */
    compact?: boolean;
  }>(),
  { orientation: "portrait", zoom: "fit", dir: "ltr", lang: undefined, browserChrome: false, interactive: false, contentInert: false, compact: false },
);
const emit = defineEmits<{ "update:interactive": [value: boolean]; scale: [scale: number]; fit: [scale: number] }>();

const scale = ref(1);
const sideways = ref(false);
const interactButton = ref<InstanceType<typeof Button> | null>(null);
const end = ref<HTMLElement | null>(null);
const captionId = useId();
const endId = `preview-end-${useId()}`;

/** "Shown at 57 %", or "Shown at real size". */
const scaleText = computed(() => {
  const percent = Math.round(scale.value * 100);
  if (percent >= 100) return `Shown at real size (${formatPercent(100)})`;
  return `Shown at ${formatPercent(percent)}${props.zoom === "fit" ? " (Fit width)" : ""}`;
});
/** Below 60 % text is small; say what to do rather than leave the author guessing. */
const smallHint = computed(() =>
  props.compact ? "" : scale.value < 0.6
    ? props.zoom === "fit"
      ? "Fit shrinks the screen to the room there is, so text is small. Choose 100 % to read it at real size."
      : "Text is small at this scale. Choose Fit or 100 % for a closer look."
    : "",
);

function onScale(value: number) {
  scale.value = value;
  emit("scale", value);
}
/** Esc inside the frame stops interacting and puts focus back on the Interact button; the event is then spent. */
async function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape" || !props.interactive || event.defaultPrevented) return;
  event.preventDefault();
  emit("update:interactive", false);
  await nextTick();
  (interactButton.value?.$el as HTMLElement | undefined)?.focus();
  say("Stopped interacting with the preview");
}
/** Moves focus past the frame, to the end marker, so the next Tab reaches the CMS again. */
function skip() {
  end.value?.focus();
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2">
    <a
      :href="`#${endId}`"
      class="sr-only focus:not-sr-only focus:inline-flex focus:min-h-control focus:w-fit focus:items-center focus:rounded-md focus:border focus:border-primary focus:bg-card focus:px-4 focus:text-sm focus:font-semibold"
      @click.prevent="skip"
    >
      Skip preview
    </a>
    <section role="region" :aria-label="label" :aria-describedby="captionId" class="flex min-w-0 flex-col gap-2" @keydown="onKeydown">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <!-- Below 860 px the caption has the row to itself with three lines of room, so the controls always sit on the second row and a different surface never moves the picture. -->
        <p :id="captionId" class="min-w-[min(100%,16rem)] flex-1 basis-64 text-xs leading-normal text-muted-foreground max-[860px]:basis-full max-[860px]:min-h-14">
          <span class="font-semibold text-ink-2">{{ surfaceCaption(surface, orientation) }}.</span>
          {{ " " }}<span class="tabular-nums">{{ scaleText }}.</span>
          <template v-if="sideways">{{ " " }}Scroll sideways to see the rest.</template>
          <template v-if="smallHint">{{ " " }}{{ smallHint }}</template>
        </p>
        <slot name="actions" />
        <span v-if="interactive" class="text-xs text-muted-foreground">Esc stops</span>
        <Button ref="interactButton" variant="secondary" :aria-pressed="interactive" @click="emit('update:interactive', !interactive)">
          <MousePointerClick aria-hidden="true" />{{ interactive ? "Stop interacting" : "Interact" }}<span class="sr-only"> with the preview</span>
        </Button>
      </div>
      <DeviceFrame
        :surface="surface"
        :orientation="orientation"
        :zoom="zoom"
        :dir="dir"
        :lang="lang"
        :browser-chrome="browserChrome"
        :inert="!contentInert && !interactive"
        @scale="onScale"
        @fit="emit('fit', $event)"
        @overflow="sideways = $event"
      >
        <slot :inert="!interactive" />
      </DeviceFrame>
    </section>
    <div :id="endId" ref="end" tabindex="-1" class="sr-only">End of preview</div>
  </div>
</template>
