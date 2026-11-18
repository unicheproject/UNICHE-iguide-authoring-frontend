import { cva, type VariantProps } from "class-variance-authority";

export { default as Chip } from "./Chip.vue";

/** Chip recipes: state is a word plus an icon plus colour, never colour alone (D-070). */
export const chipVariants = cva(
  "ui-chip inline-flex min-h-6 items-center gap-1 whitespace-nowrap rounded-full border border-transparent px-2.5 text-xs font-semibold [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-ink-2",
        outline: "border-input bg-transparent text-ink-2",
        brand: "bg-accent text-primary",
        success: "bg-success-tint text-success",
        warning: "bg-warning-tint text-warning",
        danger: "bg-destructive-tint text-destructive",
        info: "bg-info-tint text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type ChipVariants = VariantProps<typeof chipVariants>;
