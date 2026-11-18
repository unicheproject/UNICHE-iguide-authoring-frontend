<script setup lang="ts">
/**
 * The line under a row title that says a search hit came through another language (C2-48): "Matches Ελληνικά:
 * Ακρόπολη". The language name and the matched text are isolated (`bdi`) and carry their `lang`, so a right-to-left or
 * Greek title does not reorder the sentence. Build the match with `matchedInOtherLanguage` (`listRows.ts`).
 */
import type { LanguageMatch } from "@/views/workspace/listRows";

defineProps<{ match: LanguageMatch; languageName: string }>();
</script>

<template>
  <p class="text-compact text-muted-foreground">
    Matches <bdi :lang="match.languageCode" class="font-medium text-ink-2">{{ languageName }}</bdi>:
    <bdi :lang="match.languageCode" dir="auto">{{ match.text }}</bdi>
  </p>
</template>
