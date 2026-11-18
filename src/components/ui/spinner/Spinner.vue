<script setup lang="ts">
/**
 * A small progress ring. Decorative: the text beside it (or `aria-busy` on its control) carries the meaning. Reduced
 * motion stops the rotation and leaves a still ring.
 */
import { Loader2 } from "lucide-vue-next";
</script>

<template>
  <Loader2 class="ui-spinner animate-spin" aria-hidden="true" />
</template>
