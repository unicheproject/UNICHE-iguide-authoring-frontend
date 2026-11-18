<script setup lang="ts">
/**
 * The open `askConfirm` question in the CMS dialog style (D-078). Focus lands on the dialog (title read first); the
 * confirming action is primary on the right (danger-styled when the question loses work), Cancel is secondary on its left.
 */
import AppDialog from "@/components/AppDialog.vue";
import { Button } from "@/components/ui/button";
import { answerConfirm, confirmOpener, confirmState } from "@/stores/confirm";
</script>

<template>
  <AppDialog
    v-if="confirmState.current"
    :key="confirmState.current.id"
    :title="confirmState.current.title"
    size="sm"
    :return-focus-to="confirmOpener()"
    @close="answerConfirm(false)"
  >
    <p class="text-sm text-ink-2">{{ confirmState.current.body }}</p>
    <template #actions>
      <Button variant="secondary" @click="answerConfirm(false)">
        {{ confirmState.current.cancelLabel ?? "Cancel" }}
      </Button>
      <Button :variant="confirmState.current.danger ? 'danger' : 'primary'" @click="answerConfirm(true)">
        {{ confirmState.current.confirmLabel }}
      </Button>
    </template>
  </AppDialog>
</template>
