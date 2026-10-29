<script setup lang="ts">
/**
 * The size limits shown before an upload starts (`12` §5; DECISIONS.md D-032): the largest file of each listed type
 * and of any upload. While the limits cannot be loaded nothing is uploaded, and this says so with a retry.
 */
import { assetTypeLabel, formatBytes, type AssetLimits, type AssetType } from "@/platform/assets";

defineProps<{ limits: AssetLimits | null; failed: boolean; types: readonly AssetType[] }>();
const emit = defineEmits<{ reload: [] }>();
</script>

<template>
  <p v-if="failed && !limits" class="text-[11px] font-semibold text-[#9a6200]">
    The size limits could not be loaded, so uploads wait.
    <button type="button" class="font-bold text-primary" @click="emit('reload')">Try again</button>
  </p>
  <table v-else-if="limits" class="w-full text-[11px] text-muted-foreground">
    <caption class="sr-only">Largest file per type</caption>
    <tbody class="flex flex-wrap gap-x-4 gap-y-1">
      <template v-for="t in types" :key="t">
        <tr v-if="limits.perType[t] !== undefined" class="flex gap-1.5">
          <th scope="row" class="font-semibold">{{ assetTypeLabel(t) }}</th>
          <td>{{ formatBytes(limits.perType[t]!) }}</td>
        </tr>
      </template>
      <tr class="flex gap-1.5">
        <th scope="row" class="font-semibold">Any file</th>
        <td>{{ formatBytes(limits.maxUploadBytes) }}</td>
      </tr>
    </tbody>
  </table>
</template>
