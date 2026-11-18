/** A token colour that accepts an alpha (`bg-primary/90`). */
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,vue}"],
  theme: {
    // Navigation drawer below `nav`; the editor's side column from `edit` (plan 2.1, 2.3).
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      nav: "1100px",
      edit: "1180px",
      xl: "1280px",
      "2xl": "1536px",
    },
    // Fixed rem scale, no fluid sizes (D-071). 12 px is the floor.
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1.4" }],
      compact: ["0.8125rem", { lineHeight: "1.45" }],
      sm: ["0.875rem", { lineHeight: "1.5" }],
      base: ["1rem", { lineHeight: "1.4" }],
      lg: ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
      xl: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
    },
    extend: {
      fontFamily: {
        sans: ["Montserrat Variable", "Montserrat", "Montserrat Fallback", "system-ui", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "Cascadia Mono", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        highlight: token("highlight"),
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        "ink-2": token("ink-2"),
        placeholder: token("placeholder"),
        "disabled-ink": token("disabled-ink"),
        sunken: token("muted"),
        "surface-hover": token("surface-hover"),
        "surface-active": token("surface-active"),
        "ring-inverse": token("ring-inverse"),
        scrim: "hsl(var(--scrim))",
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
          active: token("primary-active"),
          foreground: token("primary-foreground"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          tint: token("destructive-tint"),
          active: token("destructive-active"),
          foreground: token("destructive-foreground"),
        },
        success: { DEFAULT: token("success"), tint: token("success-tint") },
        warning: { DEFAULT: token("warning"), tint: token("warning-tint") },
        info: { DEFAULT: token("info"), tint: token("info-tint") },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          strong: token("accent-strong"),
          foreground: token("accent-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        card: token("card"),
      },
      animation: {
        skeleton: "skelpulse 1.4s ease-in-out infinite",
        "fade-in": "ui-fade-in var(--dur-2) var(--ease-out)",
        "rise-in": "ui-rise-in var(--dur-3) var(--ease-out)",
        "slide-in-left": "ui-slide-in-left var(--dur-3) var(--ease-out)",
        spin: "ui-spin 0.9s linear infinite",
      },
      // 4 (checkbox, tag), 8 (button, input, menu), 12 (card, dialog), full.
      borderRadius: {
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
      },
      // `control` is the 40 px (44 coarse) square of an icon-only control: `size-control`, `h-control`, `w-control`.
      spacing: {
        control: "var(--control-h)",
      },
      boxShadow: {
        // Drop-position lines of the reorder lists (before and after the row under the pointer).
        "drop-before": "inset 0 2px 0 0 hsl(var(--primary))",
        "drop-after": "inset 0 -2px 0 0 hsl(var(--primary))",
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
      },
      zIndex: {
        raised: "5",
        sticky: "10",
        drawer: "30",
        popover: "40",
        modal: "50",
        "modal-over": "51",
        // Popovers, menus and tooltips opened from inside a modal sit above it (D-101).
        "popover-over": "calc(var(--z-modal) + 1)",
        toast: "60",
        skip: "70",
      },
      transitionDuration: {
        1: "var(--dur-1)",
        2: "var(--dur-2)",
        3: "var(--dur-3)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        std: "var(--ease-std)",
      },
      transitionProperty: {
        ui: "color, background-color, border-color, box-shadow, opacity, transform",
      },
      height: {
        control: "var(--control-h)",
        header: "var(--header-h)",
        logo: "1.625rem",
        // The loading stand-in of the Preview page: about the height of the device frame.
        stage: "32.5rem",
      },
      minHeight: {
        control: "var(--control-h)",
        row: "var(--row-h)",
      },
      width: {
        nav: "var(--nav-w)",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

