<script setup lang="ts">
/** The open `askConfirm` question in the CMS dialog style; the safe choice comes first and has focus. */
import AppDialog from "@/components/AppDialog.vue";
import { answerConfirm, confirmState } from "@/stores/confirm";
</script>

<template>
  <AppDialog
    v-if="confirmState.current"
    :key="confirmState.current.id"
    :title="confirmState.current.title"
    width="460px"
    @close="answerConfirm(false)"
  >
    <p class="text-[13px] text-gray-700">{{ confirmState.current.body }}</p>
    <template #actions>
      <button type="button" class="dialog-secondary" @click="answerConfirm(false)">
        {{ confirmState.current.cancelLabel ?? "Cancel" }}
      </button>
      <button
        type="button"
        class="dialog-primary"
        :class="confirmState.current.danger ? 'bg-destructive' : 'bg-primary'"
        @click="answerConfirm(true)"
      >
        {{ confirmState.current.confirmLabel }}
      </button>
    </template>
  </AppDialog>
</template>
