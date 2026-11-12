import { cva, type VariantProps } from "class-variance-authority";

export { default as Button } from "./Button.vue";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-bold uppercase tracking-[0.06em] transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        // Primary call to action of the mockup: the UNICHE gradient, its stops deepened so white text keeps at
        // least 5.9:1 on every part of it (`14` §2 and §4, DECISIONS.md D-053).
        brand:
          "bg-[linear-gradient(135deg,#b3156f_0%,#7b3aa8_50%,#0b6f7c_100%)] text-white shadow-[0_3px_16px_rgba(123,58,168,0.3)] hover:brightness-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-[22px] py-[11px]",
        sm: "px-4 py-2 text-[11px]",
        lg: "px-7 py-3.5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
