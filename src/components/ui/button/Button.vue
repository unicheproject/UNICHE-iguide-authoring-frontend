<script setup lang="ts">
/**
 * The one button of the CMS (D-072). `loading` keeps the width, shows a spinner left of the label and sets
 * `aria-busy`; `disabledReason` makes the button `aria-disabled` (it stays focusable) and states why, as a tooltip
 * and in its accessible description. An icon-only button (`size="icon"`) needs `label`, its accessible name.
 * With `asChild` the child element (a link) is the button; `loading` and `disabledReason` then only set attributes.
 */
import { computed, useId, type HTMLAttributes } from "vue";
import { Primitive, type PrimitiveProps } from "radix-vue";
import { type ButtonVariants, buttonVariants } from ".";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { cn } from "@/lib/utils";

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  class?: HTMLAttributes["class"];
  /** Shows progress and blocks clicks. */
  loading?: boolean;
  /** Why the button cannot be used now; when set the button is `aria-disabled`. */
  disabledReason?: string;
  /** Accessible name of an icon-only button. */
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
  loading: false,
  disabledReason: undefined,
  label: undefined,
});

const reasonId = useId();
const blocked = computed(() => props.loading || !!props.disabledReason);

if (import.meta.env.DEV && props.size === "icon" && !props.label) {
  console.warn("Button size=\"icon\" needs a `label` (its accessible name).");
}

/** A blocked button swallows the click, so it can stay focusable and keep its reason. */
function onClickCapture(event: MouseEvent) {
  if (blocked.value) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    :data-variant="variant === 'default' || variant === 'brand' ? 'primary' : variant === 'destructive' ? 'danger' : (variant ?? 'primary')"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :aria-disabled="blocked ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :aria-label="label"
    :aria-describedby="disabledReason && !asChild ? reasonId : undefined"
    :title="disabledReason"
    @click.capture="onClickCapture"
  >
    <template v-if="asChild"><slot /></template>
    <template v-else>
      <Spinner v-if="loading" class="size-4" />
      <slot />
      <span v-if="disabledReason" :id="reasonId" class="sr-only">{{ disabledReason }}</span>
    </template>
  </Primitive>
</template>
