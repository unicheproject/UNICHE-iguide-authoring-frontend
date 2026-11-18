<script setup lang="ts">
/**
 * The progress of Create Project: four named steps with their state in words (Done, Current, Not started), a check
 * for finished ones, `aria-current="step"` on the current one. Circles are top-aligned with the first line of the label, so
 * a label that wraps never moves its circle (C3-95); the current circle keeps a thick `ButtonText` border in forced colours. `aria-current` sits on the label, not on the
 * whole item: the forced-colours rule `[aria-current] *` would otherwise repaint the circle's number in `HighlightText` on its Canvas fill. A step the author may return to is a button; below 640 px
 * only the current step's name shows, with "Step 2 of 4" beside it, so the row never overflows (WCAG 1.4.10). On a short
 * window (200% zoom) the state words of the other steps stay for screen readers only, so the form is not pushed off the fold.
 */
import { Check } from "lucide-vue-next";
import type { StepKey } from "./useCreateProject";

const props = defineProps<{
  steps: { key: StepKey; label: string }[];
  current: StepKey;
  /** Whether the author may open a step now. */
  canGo: (key: StepKey) => boolean;
}>();
defineEmits<{ go: [key: StepKey] }>();

const currentIndex = () => props.steps.findIndex((s) => s.key === props.current);
</script>

<template>
  <nav aria-label="Create Project progress" class="mb-6">
    <ol class="flex gap-x-1">
      <li
        v-for="(s, i) in steps"
        :key="s.key"
        class="flex min-w-0 items-start"
        :class="s.key === current ? 'flex-1 sm:flex-1' : 'flex-none sm:flex-1'"
      >
        <component
          :is="canGo(s.key) && s.key !== current ? 'button' : 'span'"
          :type="canGo(s.key) && s.key !== current ? 'button' : undefined"
          class="flex min-h-control min-w-0 items-start gap-2 rounded-md py-1 pr-2 text-left text-sm sm:pl-1"
          :class="[
            s.key === current ? 'font-semibold text-foreground' : i < currentIndex() ? 'text-ink-2' : 'text-muted-foreground',
            canGo(s.key) && s.key !== current ? 'hover:bg-surface-hover' : '',
          ]"
          @click="canGo(s.key) && s.key !== current ? $emit('go', s.key) : undefined"
        >
          <span
            class="flex size-7 flex-none items-center justify-center rounded-full border text-xs font-semibold tabular"
            :class="
              i < currentIndex()
                ? 'border-primary bg-primary text-primary-foreground'
                : s.key === current
                  ? 'forced-step-current border-primary bg-accent text-primary'
                  : 'border-input bg-card text-muted-foreground'
            "
            aria-hidden="true"
          >
            <Check v-if="i < currentIndex()" class="size-4" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="min-w-0 rounded-sm" :class="s.key === current ? '' : 'max-sm:sr-only [@media(max-height:480px)]:sr-only'" :aria-current="s.key === current ? 'step' : undefined">
            <span class="block leading-7">{{ s.label }}</span>
            <span class="-mt-1 block text-xs font-normal text-muted-foreground" :class="s.key === current ? '' : '[@media(max-height:480px)]:sr-only'">
              <template v-if="s.key === current">Step {{ i + 1 }} of {{ steps.length }}</template>
              <template v-else-if="i < currentIndex()">Done</template>
              <template v-else>Not started</template>
            </span>
          </span>
        </component>
      </li>
    </ol>
  </nav>
</template>
