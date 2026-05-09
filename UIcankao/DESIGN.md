---
name: Modern Debate Design System
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#3f484a'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#6f797a'
  outline-variant: '#bfc8c9'
  surface-tint: '#20686f'
  primary: '#004349'
  on-primary: '#ffffff'
  primary-container: '#0d5c63'
  on-primary-container: '#90d2da'
  inverse-primary: '#8fd1d9'
  secondary: '#9a452c'
  on-secondary: '#ffffff'
  secondary-container: '#ff9476'
  on-secondary-container: '#772b14'
  tertiary: '#222e97'
  on-tertiary: '#ffffff'
  tertiary-container: '#3c48af'
  on-tertiary-container: '#bec3ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#abeef6'
  primary-fixed-dim: '#8fd1d9'
  on-primary-fixed: '#002023'
  on-primary-fixed-variant: '#004f55'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb5a0'
  on-secondary-fixed: '#3b0900'
  on-secondary-fixed-variant: '#7b2e17'
  tertiary-fixed: '#dfe0ff'
  tertiary-fixed-dim: '#bdc2ff'
  on-tertiary-fixed: '#000965'
  on-tertiary-fixed-variant: '#2e3aa2'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  timeline-track: 64px
---

## Brand & Style
The brand personality of the design system is intellectual, balanced, and authoritative. It is designed for a target audience that values civil discourse, logical structuring, and deep-dive reasoning over emotional rhetoric. The UI evokes a sense of "digital parliament"—a space where conflicting ideas are housed within a rigorous, professional framework.

The visual style follows a **Corporate/Modern** aesthetic with **Minimalist** tendencies. It prioritizes clarity and the reduction of visual noise to ensure that the user’s focus remains entirely on the strength of the arguments. High-quality typography and a structured grid serve as the foundation, while a sophisticated dual-palette system categorizes opposing viewpoints without creating a sense of hostility.

## Colors
The color strategy utilizes two distinct "semantic" palettes to represent the dialectic nature of the platform. 

*   **Primary (Deep Teal):** Used for the "Pro" or "Affirmative" side of a debate. It conveys stability, depth, and logic.
*   **Secondary (Terracotta):** Used for the "Con" or "Negative" side. It provides a warm, earth-toned contrast that remains professional and sophisticated rather than aggressive.
*   **Neutral & Background:** A cool gray scale is used for the platform's scaffolding. The background is a very light off-white (`#F8FAFB`) to reduce eye strain during long reading sessions, while borders are kept subtle (`#E2E8F0`) to define space without cluttering the view.

## Typography
Typography in this design system is built for rigorous reading. 

**Hanken Grotesk** is used for headlines. Its sharp, contemporary geometry provides a "newspaper of record" feel that is both modern and authoritative. Bold and Extra Bold weights are used to clearly anchor the start of new arguments.

**Inter** is the workhorse for body copy and reasoning. Its high x-height and neutral character ensure maximum legibility for dense, evidence-based text. 

A strict hierarchy is enforced: 
1. **Headlines (Hanken Grotesk):** For core claims.
2. **Core Arguments (Inter Bold/Medium):** For summarized premises.
3. **Detailed Reasoning (Inter Regular):** For supporting data and citations.

## Layout & Spacing
The layout uses a **Fluid Grid** with a fixed maximum width for the main content area (ideally 960px) to maintain optimal line lengths for readability. 

The central feature is a **Vertical Timeline**. The timeline track is set 64px from the left or centered, acting as the spine of the conversation. Arguments alternate sides or align to the track depending on their stance.

A 4px-based spacing system ensures rhythmic consistency. 
- **Desktop:** 12-column grid with 24px gutters and 48px margins.
- **Mobile:** 4-column grid with 16px gutters and 20px margins. The timeline track may collapse to a thin vertical line on the far left to maximize space for argument cards.

## Elevation & Depth
Depth is created using a combination of **Low-contrast outlines** and **Ambient shadows**. 

The design system avoids heavy shadows to maintain an "objective" and "flat" professional feel. 
- **Base Level:** The background surface (`#F8FAFB`).
- **Card Level:** Arguments sit on white cards with a 1px border (`#E2E8F0`) and a very soft, diffused shadow (Offset: 0, 4px; Blur: 12px; Color: rgba(0,0,0,0.04)).
- **Active State:** When a card is hovered or focused, the shadow deepens slightly, and the border color shifts to match the side’s semantic color (Teal or Terracotta).
- **Overlays:** Modals and dropdowns use a slightly more pronounced shadow (Blur: 24px) to separate from the timeline.

## Shapes
The shape language is **Rounded** (Level 2). 

Standard components (Cards, Inputs) utilize a 0.5rem (8px) corner radius. This creates a modern, approachable feel that softens the "sharpness" of the typography, making the platform feel like a constructive space rather than a combat zone. 

Larger containers like modals or featured argument sections use the `rounded-lg` (16px) or `rounded-xl` (24px) tokens to create a distinct visual hierarchy for structural elements.

## Components
### Argument Cards
The core component. It features a colored top-border (2px) or side-accent to denote the "Pro" or "Con" stance. It includes a clear header, a bolded "Core Argument" summary, and a collapsible section for "Detailed Reasoning" and "Citations."

### Buttons
- **Primary (Pro):** Solid Teal with white text.
- **Secondary (Con):** Solid Terracotta with white text.
- **Neutral:** Ghost buttons with a 1px border for utility actions like "Save" or "Share."

### Timeline Track
A subtle vertical line (`#E2E8F0`) that connects chronological arguments. "Nodes" on the timeline change color (Teal/Terracotta) based on the stance of the argument they represent.

### Chips & Tags
Used for debate categories (e.g., #Economics, #Ethics). These use a light neutral fill with dark text to stay objective and not compete with the Pro/Con semantic colors.

### Input Fields
Clean, 1px bordered boxes that turn Teal or Terracotta on focus, depending on which "side" of the debate the user is currently contributing to.

### Source Indicators
Small, pill-shaped labels at the bottom of cards that link to external evidence, using a high-legibility mono-spaced font style (using Inter) for a technical, verified appearance.