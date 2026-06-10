---
name: Universal Learning Framework
colors:
  surface: '#f7f9ff'
  surface-dim: '#d7dae0'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4fa'
  surface-container: '#ebeef4'
  surface-container-high: '#e5e8ee'
  surface-container-highest: '#dfe3e8'
  on-surface: '#181c20'
  on-surface-variant: '#414754'
  inverse-surface: '#2d3135'
  inverse-on-surface: '#eef1f7'
  outline: '#727785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005bc0'
  primary: '#005bbf'
  on-primary: '#ffffff'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#adc7ff'
  secondary: '#005ac1'
  on-secondary: '#ffffff'
  secondary-container: '#4d8efe'
  on-secondary-container: '#00285c'
  tertiary: '#9e4300'
  on-tertiary: '#ffffff'
  tertiary-container: '#c55500'
  on-tertiary-container: '#0e0200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004494'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783100'
  background: '#f7f9ff'
  on-background: '#181c20'
  surface-variant: '#dfe3e8'
  status-success: '#1E8E3E'
  status-risk: '#D93025'
  status-warning: '#F9AB00'
  surface-background: '#FFFFFF'
  surface-subtle: '#F8F9FA'
  border-low-contrast: '#DADCE0'
  kids-accent-purple: '#8AB4F8'
  kids-accent-orange: '#FA903E'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  kids-nav:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter-desktop: 24px
  margin-desktop: 32px
  gutter-mobile: 16px
  margin-mobile: 16px
  container-max-width: 1280px
---

## Brand & Style

The brand personality is **Adaptive, Empathetic, and Institutional**. It functions as a sophisticated white-label shell that recedes to prioritize the institution's identity while maintaining a high baseline of usability and trust. 

The design style is **Modern Corporate with a Humanist touch**, drawing heavily from high-end SaaS and Material Design principles. It prioritizes clarity and accessibility above all else. For administrative roles, the system is dense and efficient (Minimalism); for students and minors, it transitions into a "Simplified Path" using vibrant accents and larger interactive targets (Tactile) to ensure engagement and ease of use. The emotional response should be one of reliability for parents, efficiency for admins, and approachable excitement for students.

## Colors

The palette is anchored by **Vibrant Blues** to signify intelligence and professional SaaS standards. The system is designed for a **Light Mode** default to ensure maximum readability for educational content and administrative data.

- **Primary & Secondary:** Used for brand expression, primary actions, and active states. These are intended to be swapped by tenant-specific colors in the white-label configuration.
- **Neutrals:** A range of cool grays used for typography and borders. `#DADCE0` serves as the standard hair-line border for cards and dividers.
- **Status Colors:** Non-negotiable semantic colors for "At Risk" (Red) and "Success" (Green) indicators.
- **Kids' Accents:** High-saturation secondary accents used specifically in the `is_minor` interface to provide visual landmarks and engagement.

## Typography

This design system utilizes **Inter** for its exceptional legibility on screens and neutral character, allowing tenant branding to take center stage. 

- **Hierarchy:** Use `headline-xl` only for top-level dashboard welcomes or marketing-style landing pages. `headline-md` is the standard for card titles and section headers.
- **Reading Experience:** `body-lg` is reserved for AI-generated narrative summaries to make them feel more conversational and less "data-heavy."
- **Accessibility:** `body-sm` is the minimum size for any functional text. For the minor's interface, the `kids-nav` token ensures that interactive labels are legible even on smaller, basic tablets.
- **White-labeling:** Typography weights should remain consistent even if the font family is swapped to maintain the established hierarchy.

## Layout & Spacing

The design system employs a **Fluid Grid** model based on a 4px baseline shift to ensure alignment across all components.

- **Desktop (1024px+):** A 12-column grid with 24px gutters. Administrative dashboards should utilize the full width for data tables, while narrative content should be constrained to 8 columns (centered) to prevent overly long line lengths.
- **Tablet (768px - 1023px):** Transition to an 8-column grid. Sidebars should collapse into a "hamburger" or bottom-nav menu depending on role.
- **Mobile (<767px):** A 4-column grid with 16px margins.
- **The "Simplified Path" (Kids):** Padding is doubled (using `spacing.unit * 8` as a minimum) to prevent mis-taps and reduce visual cognitive load. Layout relies on large, centered card-based navigation rather than complex grids.

## Elevation & Depth

Visual hierarchy is conveyed through **Tonal Layers** and **Subtle Ambient Shadows**. 

- **Level 0 (Base):** The `surface-background` (#FFFFFF).
- **Level 1 (Cards/Containers):** Flat with a 1px `border-low-contrast` (#DADCE0). This is the default state for administrative content to keep the UI clean and printable.
- **Level 2 (Interactive/Hover):** When a user interacts with a card or button, apply a soft, diffused shadow: `0px 4px 12px rgba(0, 0, 0, 0.08)`.
- **Level 3 (Modals/Overlays):** Used for AI assistants and critical alerts. Shadows are deeper: `0px 12px 32px rgba(0, 0, 0, 0.12)`.

For the **Kid's Portal**, elevation is more pronounced. Elements use Level 2 as their *base* state to appear "pressable" and tactile, providing clear affordance to non-readers.

## Shapes

The shape language is **Friendly and Approachable**, using the **Rounded (0.5rem)** setting as the system default.

- **Standard Elements:** Input fields, buttons, and administrative cards use 0.5rem (`rounded-md`) corner radii.
- **Containers:** Large dashboard cards and "Kid's Interface" navigation blocks use 1rem (`rounded-lg`) to soften the visual impact.
- **Interactive Pill:** Chips, tags, and certain "Kid-mode" buttons use 1.5rem (`rounded-xl`) or full pill-shaping to distinguish them from data-entry fields.

## Components

- **Buttons:**
  - *Primary:* Solid primary color, white text, 0.5rem radius.
  - *Secondary:* `border-low-contrast` with primary color text.
  - *Kids:* Over-sized (min-height 56px) with primary/accent backgrounds and large icons.
- **Cards:**
  - Clean white surfaces with 1px gray borders. Header sections of cards should have a subtle `surface-subtle` background to separate title from content.
- **Data Tables:**
  - Professional and high-density. Use `body-sm` for cell content. Row hover states use `surface-subtle`. No vertical borders; use horizontal dividers only.
- **Input Fields:**
  - Outlined style with `label-md` as floating labels. On error, the border switches to `status-risk`.
- **Kids' Icons:**
  - 48px to 64px in size, using a "playful" weight and vibrant accent colors. Avoid complex glyphs; use universal metaphors (e.g., a star for rewards, a book for lessons).
- **Status Chips:**
  - Used in tables for "At Risk" or "Paid" status. Low-opacity background of the status color with high-contrast text.
- **Navigation:**
  - *Admin:* Left-hand vertical nav with collapsible labels.
  - *Kids:* Bottom nav or large-tile center-screen nav.