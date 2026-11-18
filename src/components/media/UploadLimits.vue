<script setup lang="ts">
/**
 * "Accepted formats and limits" shown before an upload starts (`12` §5; D-032, D-080): each accepted type with its
 * file formats and the largest size, then the cap for any file. While the limits cannot be loaded nothing is
 * uploaded, and this says so with a retry. `types` narrows the table (a replacement, a floor-plan field). With
 * `collapsed` (files were added) the table folds into a closed "Accepted formats and limits" disclosure (C2-79).
 */
import { formatBytes, withUnit } from "@/lib/format";
import { ACCEPTED_FORMATS, assetTypeLabel, type AssetLimits, type AssetType } from "@/platform/assets";
import { Button } from "@/components/ui/button";
import { computed } from "vue";

const props = defineProps<{ limits: AssetLimits | null; failed: boolean; types: readonly AssetType[]; collapsed?: boolean }>();
const emit = defineEmits<{ reload: [] }>();

const rows = computed(() => {
  const shown = props.types.map((type) => ({ type, formats: ACCEPTED_FORMATS.find((f) => f.type === type)?.formats ?? (type === "FLOOR_PLAN" ? "Images (JPG, PNG, WebP, SVG)" : "") }));
  return shown.filter((r) => r.formats);
});

/** A limit reads "20 MB", not "20.0 MB": a whole number of megabytes drops the decimal. */
function limitText(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 && Number.isInteger(mb) ? withUnit(mb, "MB") : formatBytes(bytes);
}
const size = (type: AssetType) => (props.limits ? limitText(props.limits.perType[type] ?? props.limits.maxUploadBytes) : "…");
</script>

<template>
  <p v-if="failed && !limits" class="text-sm font-medium text-warning" role="status">
    The size limits could not be loaded, so uploads wait.
    <Button variant="link" @click="emit('reload')">Try again</Button>
  </p>
  <details v-else-if="collapsed" class="text-compact">
    <summary class="inline-flex min-h-8 cursor-pointer items-center text-xs font-semibold text-ink-2 hover:underline">Accepted formats and largest file</summary>
    <table class="mt-1 w-full">
      <caption class="sr-only">Accepted formats and largest file</caption>
      <thead class="sr-only"><tr><th scope="col">Type</th><th scope="col">Formats</th><th scope="col">Largest file</th></tr></thead>
      <tbody>
        <tr v-for="r in rows" :key="r.type" class="align-baseline">
          <th scope="row" class="py-0.5 pr-3 text-left font-semibold text-ink-2">{{ assetTypeLabel(r.type) }}</th>
          <td class="py-0.5 pr-3 text-muted-foreground">{{ r.formats }}</td>
          <td class="tabular py-0.5 text-right text-muted-foreground">{{ size(r.type) }}</td>
        </tr>
        <tr v-if="limits">
          <th scope="row" class="py-0.5 pr-3 text-left font-semibold text-ink-2">Any upload</th>
          <td class="py-0.5 pr-3 text-muted-foreground">Every type above</td>
          <td class="tabular py-0.5 text-right text-muted-foreground">{{ limitText(limits.maxUploadBytes) }}</td>
        </tr>
      </tbody>
    </table>
  </details>
  <table v-else class="w-full text-compact">
    <caption class="pb-1 text-left text-xs font-semibold text-ink-2">Accepted formats and largest file</caption>
    <thead class="sr-only"><tr><th scope="col">Type</th><th scope="col">Formats</th><th scope="col">Largest file</th></tr></thead>
    <tbody>
      <tr v-for="r in rows" :key="r.type" class="align-baseline">
        <th scope="row" class="py-0.5 pr-3 text-left font-semibold text-ink-2">{{ assetTypeLabel(r.type) }}</th>
        <td class="py-0.5 pr-3 text-muted-foreground">{{ r.formats }}</td>
        <td class="tabular py-0.5 text-right text-muted-foreground">{{ size(r.type) }}</td>
      </tr>
      <tr v-if="limits">
        <th scope="row" class="py-0.5 pr-3 text-left font-semibold text-ink-2">Any upload</th>
        <td class="py-0.5 pr-3 text-muted-foreground">Every type above</td>
        <td class="tabular py-0.5 text-right text-muted-foreground">{{ limitText(limits.maxUploadBytes) }}</td>
      </tr>
    </tbody>
  </table>
</template>
