The styling is defined in `src/styles.css`, using Tailwind CSS v4. Here is a complete breakdown of how each section works:

---

1. Framework Setup & Dark Variant

```css
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));
```

- `@import "tailwindcss"`: In Tailwind v4, configuration is native CSS instead of a separate `tailwind.config.js`.
- `@source "../src"`: Tells the compiler where to scan JSX/TSX files for utility classes.
- `@custom-variant dark`: Defines a dark mode selector so utility classes like `dark:bg-slate-900` activate whenever any parent container has the `.dark` class.

---

2. Design Tokens in `@theme inline`

```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  ...
  --color-primary: var(--primary);
  --color-background: var(--background);
  --color-sidebar: var(--sidebar);
  ...
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-body: "Karla", ui-sans-serif, system-ui, sans-serif;
}
```

- This section connects Tailwind’s generated classes directly to CSS custom variables:
  - `--color-primary` enables utilities like `bg-primary`, `text-primary`, and `border-primary`.
  - `--color-sidebar` enables classes like `bg-sidebar` and `text-sidebar-foreground` used for the studio navigation panel.
  - `--font-display` and `--font-body` create `font-display` and `font-body` classes for typography.
  - Corner radiuses are computed dynamically from a single base `--radius`.

---

3. The Studio Palette in `:root` (OKLCH Color Space)

Instead of standard RGB or hex colors, the app uses `oklch()` (Lightness, Chroma, Hue), which delivers perceptually uniform contrast and rich, natural tones:

```css
:root {
  --radius: 0.75rem;                          /* 12px default corner curve */
  --background: oklch(0.975 0.012 85);        /* Warm cream backdrop */
  --foreground: oklch(0.25 0.03 60);          /* Deep espresso text */
  --primary: oklch(0.42 0.09 55);             /* Burnt amber action buttons */
  --primary-foreground: oklch(0.97 0.01 85);  /* Light text on primary buttons */
  --secondary: oklch(0.93 0.025 80);          /* Soft sand for pills/cards */
  --accent: oklch(0.88 0.06 75);              /* Warm gold wash on hover */
  --destructive: oklch(0.55 0.2 25);          /* Editorial red for errors */
  --sidebar: oklch(0.28 0.035 55);            /* Dark espresso sidebar background */
  --sidebar-foreground: oklch(0.92 0.02 85);  /* High-contrast warm white */
  --sidebar-primary: oklch(0.72 0.12 70);     /* Warm gold active state in nav */
}
```

Because these are semantic tokens, changing `--primary` in `:root` automatically recolors every primary button, active border, and indicator across the entire app without touching component markup.

---

4. Base HTML Styling & Editorial Fonts

```css
@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-body);
  }

  h1, h2, h3, .font-display {
    font-family: var(--font-display);
  }
}
```

- All borders default to the subtle `--border` color so dividers never appear harsh black.
- `body` uses Karla, a clean, highly legible grotesque sans-serif loaded in `src/routes/__root.tsx`.
- All headings (`h1, h2, h3`) automatically use Cormorant Garamond, an elegant serif that gives the photography studio an editorial, high-end look.

---

5. Entrance Animations & Stagger Delays

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@utility animate-fade-up {
  animation: fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@utility stagger-1 { animation-delay: 0.08s; }
@utility stagger-2 { animation-delay: 0.16s; }
@utility stagger-3 { animation-delay: 0.24s; }
@utility stagger-4 { animation-delay: 0.32s; }
```

- `@utility`: Tailwind v4's mechanism for custom reusable class names.
- `animate-fade-up`: Smoothly raises content by 16px while fading in using an easing curve (`cubic-bezier(0.22, 1, 0.36, 1)`) that feels natural and premium.
- `stagger-1` through `stagger-4`: Combined with `animate-fade-up` on elements like the three session cards (Portrait, Family, Product), this causes each card to glide into view sequentially rather than appearing all at once.

---

Next, we could add a matching dark mode color set under `.dark`, or create subtle hover micro-interactions for the session cards.