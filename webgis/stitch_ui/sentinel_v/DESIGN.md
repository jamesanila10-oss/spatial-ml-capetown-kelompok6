---
name: Sentinel-V
colors:
  surface: '#fbf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fbf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f4'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45474c'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#006d30'
  on-secondary: '#ffffff'
  secondary-container: '#92f5a4'
  on-secondary-container: '#007233'
  tertiary: '#001907'
  on-tertiary: '#ffffff'
  tertiary-container: '#003014'
  on-tertiary-container: '#00a555'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#95f8a7'
  secondary-fixed-dim: '#79db8d'
  on-secondary-fixed: '#00210a'
  on-secondary-fixed-variant: '#005323'
  tertiary-fixed: '#6dfe9c'
  tertiary-fixed-dim: '#4de082'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005227'
  background: '#fbf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e3'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-bold:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: monospace
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  nav_height: 5vh
  sidebar_control_width: 20%
  map_viewport_width: 55%
  sidebar_analytics_width: 25%
  gutter: 1px
  panel_padding: 1rem
---

## Brand & Style
The design system is engineered for high-precision environmental monitoring and geospatial analysis. It targets environmental scientists, urban planners, and disaster response teams who require immediate, legible insights from complex satellite data. 

The aesthetic is **Corporate / Modern** with a focus on **Systematic Minimalism**. It prioritizes technical clarity over decorative flair, using a structured layout to organize dense data sets. The emotional response is one of reliability, authority, and scientific rigor, achieved through a controlled palette and high-density information architecture.

## Colors
This design system utilizes a functional color strategy where hues denote specific environmental states. 

- **Primary (Indigo):** Reserved for structural framing (navigation and sidebars) to provide a stable, non-intrusive container for data.
- **Success/Vegetation Scales:** A bifurcated green scale distinguishes between the 2024 (Dark Green) and 2025 (Light Green) temporal datasets.
- **Semantic Accents:** Blue and Red are strictly reserved for "Gain" and "Loss" delta analysis to ensure immediate cognitive mapping during fire scar assessment.
- **Neutral Surfaces:** The workspace uses a light gray background to minimize eye strain during long-form data analysis, with white surfaces used for elevated interactive cards.

## Typography
The typography system uses **Inter** for its neutral, highly legible character, particularly at small sizes in dense data tables.

- **Headlines:** Used sparingly for panel titles and primary metrics. 
- **Body Text:** Scaled down to 14px for general descriptions and 12px for interactive controls to maximize information density.
- **Labels:** Uppercase bold labels are used for legend categories and metadata headers to create clear visual anchors.
- **Monospace:** Use system monospace for coordinate data, pixel values, and confusion matrix coefficients to ensure vertical alignment of digits.

## Layout & Spacing
The layout follows a **Fixed 3-Column Grid** designed for a 16:9 widescreen viewing environment, typical of GIS workstations.

1.  **Top Navigation (5vh):** A slim, persistent bar for high-level app switching and user profile.
2.  **Control Sidebar (20%):** Left-aligned. Houses layer toggles, date pickers, and workflow process diagrams.
3.  **Interactive Map (55%):** The central viewport. This area is fluid within its container but constrained by the sidebars.
4.  **Analytics Panel (25%):** Right-aligned. Dedicated to data visualization, confusion matrices, and delta statistics.

**Rhythm:** Use a tight 4px baseline grid. Internal panel padding is fixed at 16px (1rem) to maintain a compact, "instrument-panel" feel. Use 1px borders (Indigo-900 or Slate-200) instead of large gutters to maximize screen real estate.

## Elevation & Depth
This design system prioritizes a **Flat / Tonal Layering** approach to maintain focus on the map data. 

- **Level 0 (Base):** The map canvas itself.
- **Level 1 (Submerged):** The control sidebar and analytics panels, styled with a subtle background color (`#F8FAFC`) to distinguish them from the map.
- **Level 2 (Surface):** White cards within the sidebars used to group related metrics or workflow steps. These use a **Low-contrast outline** (1px Slate-200) rather than shadows.
- **Level 3 (Floating):** Only map tools (zoom, measure, compass) use a soft, ambient shadow to appear "above" the geographic data.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a subtle modern touch without sacrificing the professional, "engineered" look of the dashboard. 

- **Primary UI Elements:** Buttons, input fields, and dropdowns use the base 4px radius.
- **Data Containers:** Large analytics cards and the map viewport container also use the 4px radius to maintain consistency.
- **Process Flow:** Workflow diagrams use squared-off edges or minimal 2px radii to emphasize a logical, step-by-step sequence.

## Components
- **Tabbed Top Nav:** Flat tabs with a 2px bottom border indicator in Primary Indigo. No background change on hover, only text color shift.
- **Control Toggles:** Compact switch components. When active, use the semantic color associated with the data layer (e.g., Green for Vegetation).
- **Process Flow Diagrams:** Vertical or horizontal boxes connected by 1px lines. Use "Chevron" shapes for directional flow. Completed steps use the Success/Vegetation 2024 Green.
- **Confusion Matrix:** A strictly bordered grid. Headers are Dark Indigo with white text. Cell backgrounds should use a sequential opacity scale of the primary color based on the value density.
- **Metric Cards:** Compact labels on top, large 18px-20px values below. Include a small "sparkline" or "delta indicator" (+/- %) using the Gain/Loss colors.
- **Map Overlays:** Legend overlays must have a semi-transparent white background (80% opacity) with a 1px Slate border.