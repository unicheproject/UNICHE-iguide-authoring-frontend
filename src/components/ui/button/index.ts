import { cva, type VariantProps } from "class-variance-authority";

export { default as Button } from "./Button.vue";

/**
 * Button recipes (D-072). One hierarchy: `primary` (solid purple, one per view region), `secondary` (white with a
 * control-border outline), `ghost` (toolbar and row actions), `danger` (solid; only inside a confirmation),
 * `danger-outline` (Archive and similar), `link` (inside running text).
 *
 * The old names stay as aliases so screens not yet migrated keep rendering: `default` and `brand` look like `primary`,
 * `outline` like `secondary`, `destructive` like `danger`. Sizes: `md` 40 px and `sm` 32 px (both 44 px on a coarse
 * pointer), `icon` a 40 px square (44 px coarse); `default` and `lg` are aliases of `md`.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-sm font-semibold no-underline",
    "transition-ui duration-1 ease-std hover:no-underline",
    "aria-disabled:cursor-not-allowed aria-disabled:opacity-60 disabled:cursor-not-allowed disabled:opacity-60",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground active:bg-primary-active",
        secondary:
          "border-input bg-card text-foreground hover:bg-surface-hover hover:text-foreground active:bg-surface-active",
        ghost: "bg-transparent text-foreground hover:bg-surface-hover hover:text-foreground active:bg-surface-active",
        danger:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground active:bg-destructive-active",
        "danger-outline":
          "border-destructive bg-card text-destructive hover:bg-destructive-tint hover:text-destructive active:bg-destructive/20",
        link: "min-h-0 rounded-sm px-0 text-primary underline underline-offset-4 hover:text-highlight hover:underline",
        // Deprecated aliases (restyled, same markup).
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground active:bg-primary-active",
        brand:
          "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground active:bg-primary-active",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground active:bg-destructive-active",
        outline: "border-input bg-card text-foreground hover:bg-surface-hover hover:text-foreground active:bg-surface-active",
      },
      size: {
        md: "min-h-control px-4 py-2",
        default: "min-h-control px-4 py-2",
        lg: "min-h-control px-5 py-2",
        sm: "min-h-8 px-3 py-1 [@media(pointer:coarse)]:min-h-11",
        icon: "size-control p-0",
      },
    },
    compoundVariants: [{ variant: "link", class: "min-h-0 px-0 py-0" }],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
