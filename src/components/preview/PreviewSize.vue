<script setup lang="ts">
/**
 * The frame's size choice (D-093), shown beside the picture it changes: "Fit width" (the default), "100 %" and "50 %",
 * plus a Kiosk's orientation. Choices that would give the same picture as Fit width are not offered: when the room is
 * as wide as the screen there is no 100 %, and a phone is always drawn at real size, so it only says so.
 */
import { computed } from "vue";
import { formatPercent } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Orientation, Surface, Zoom } from "./surfaces";

const props = defineProps<{
  surface: Surface;
  /** The scale "Fit width" gives right now (1 = real size). */
  fitScale: number;
}>();
const zoom = defineModel<Zoom>("zoom", { required: true });
const orientation = defineModel<Orientation>("orientation", { required: true });

/** A phone, or any screen that already fits at real size, has nothing to choose. */
const sameAsReal = computed(() => props.fitScale >= 0.995);
const phone = computed(() => props.surface === "MOBILE");
const zooms = computed<{ key: Zoom; label: string }[]>(() => [
  { key: "fit", label: "Fit width" },
  ...(sameAsReal.value ? [] : [{ key: "100" as const, label: formatPercent(100) }]),
  { key: "50", label: formatPercent(50) },
]);
const trigger = "min-h-control px-2.5";
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <!-- Both groups are always laid out (`invisible`, so out of the tab order and the tree when they do not apply): the
         row is the same height on every surface, so choosing another one never moves the picture (C3-66). -->
    <div class="flex items-center gap-1.5" :class="{ invisible: surface !== 'KIOSK' }" :inert="surface !== 'KIOSK'">
      <Tabs v-model="orientation">
        <TabsList label="Orientation" class="border-b-0">
          <TabsTrigger value="portrait" :class="trigger">Portrait</TabsTrigger>
          <TabsTrigger value="landscape" :class="trigger">Landscape</TabsTrigger>
        </TabsList>
        <TabsContent value="portrait" force-mount class="hidden" />
        <TabsContent value="landscape" force-mount class="hidden" />
      </Tabs>
    </div>
    <div class="grid items-center">
      <div class="col-start-1 row-start-1 flex items-center gap-1.5" :class="{ invisible: phone }" :inert="phone">
        <Tabs v-model="zoom">
          <TabsList label="Size" class="border-b-0">
            <TabsTrigger v-for="z in zooms" :key="z.key" :value="z.key" :class="trigger">{{ z.label }}</TabsTrigger>
          </TabsList>
          <TabsContent v-for="z in zooms" :key="z.key" :value="z.key" force-mount class="hidden" />
        </Tabs>
      </div>
      <p v-if="phone" class="col-start-1 row-start-1 justify-self-start text-xs text-muted-foreground">Fits at real size.</p>
    </div>
  </div>
</template>
