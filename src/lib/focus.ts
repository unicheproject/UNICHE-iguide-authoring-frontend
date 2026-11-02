import { watch, type Ref } from "vue";

/**
 * Moves focus to the first field marked invalid in the open dialog, so a screen reader announces its error
 * (`14` §4, DECISIONS.md D-042).
 */
export function focusFirstInvalid(): void {
  const field =
    document.querySelector<HTMLElement>('[role="dialog"] [aria-invalid="true"]') ??
    document.querySelector<HTMLElement>('[aria-invalid="true"]');
  // A group, such as a row of choice buttons, takes focus through its first control.
  const target = field?.matches("input, select, textarea, button") ? field : field?.querySelector<HTMLElement>("input, select, textarea, button");
  target?.focus();
}

/** Focuses the first invalid field whenever a dialog's field errors become non-empty, after the DOM shows them. */
export function useFocusOnErrors(errors: Ref<Record<string, string | undefined>>): void {
  watch(
    errors,
    (found) => {
      if (Object.values(found).some(Boolean)) focusFirstInvalid();
    },
    { deep: true, flush: "post" },
  );
}
