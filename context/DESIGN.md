---
version: 1.0.0
name: 1000 Pomodoros — Obsidian & Vermilion Minimalist Design System
description: An award-winning, editorial-grade minimalist design system that transforms focused practice into a tangible, beautiful chronicle of mastery.
colors:
  primary: "#121110" # Obsidian Ink
  secondary: "#FDFCFB" # Chalk Canvas / Paper
  tertiary: "#C10134" # Vermilion Pomodoro Red
  card: "#FFFFFF" # Pure Card Paper
  border: "rgba(18, 17, 16, 0.08)" # Hairline Divider
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 56px
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: -0.04em
  display-sm:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.035em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.01em
  body-md:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0.02em
  timer-lg:
    fontFamily: Manrope
    fontSize: 88px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.04em
    fontFeature: "'tnum' 1"
  timer-sm:
    fontFamily: Manrope
    fontSize: 64px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.035em
    fontFeature: "'tnum' 1"
rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  full: 9999px
spacing:
  micro: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  section: 80px
  gutter-mobile: 16px
  gutter-desktop: 32px
  content-max: 1140px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "#FFFFFF"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    height: 46px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
  card-default:
    backgroundColor: "{colors.card}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    shadow: "0 1px 2px rgba(18, 17, 16, 0.03), 0 4px 12px rgba(18, 17, 16, 0.02)"
    rounded: "{rounded.lg}"
    padding: 24px
  pomodoro-unit:
    shape: modern-geometric-tomato
    fillColor: "{colors.tertiary}"
    outlineColor: "{colors.primary}"
  logo-mark:
    asset: logo.png
    size: 32px
    treatment: existing tomato mascot with transparent background
iconography:
  family: Lucide
  style: 2px rounded outline icons with familiar silhouettes
  color: "{colors.primary}"
---

# 1000 Pomodoros Design System — Obsidian & Vermilion Edition

## Design Philosophy

The design centers around **"Precision Mastery"**: the union of high-contrast Swiss typography, Dieter Rams-inspired functional minimalism, tactile modern micro-interactions, and atmospheric immersion.

### Key Tenets

1. **Quiet Confidence**: Generous negative space, razor-sharp hairline borders (`border-ink/[0.08]`), and rich contrast.
2. **Unified Typographic Hierarchy**: Manrope carries display, editorial, timer, and statistical readouts, with tabular numerals preserving stable digit widths where numbers change.
3. **Singular Focus**: Exactly one high-contrast primary Vermilion action per view. Peripheral controls gracefully recede.
4. **Spring Physics**: Dynamic micro-interactions powered by natural spring curves (`cubic-bezier(0.16, 1, 0.3, 1)`) for tactile button scaling, drawer reveals, and card hover elevations.
5. **Atmospheric Focus Stage**: Ambient illumination and low-contrast peripheral chrome during active timer sessions to foster deep flow.
6. **Zero Fluff**: Every pixel, token, and line directly serves tracking, focusing, or reviewing mastery.

## Color System

- **Obsidian Ink (`#121110`)**: Deep carbon black for headlines, structural outlines, stems, and high-emphasis controls.
- **Chalk Paper (`#FDFCFB`)**: Warm, premium off-white canvas that eliminates eye strain while preserving crisp contrast.
- **Card Paper (`#FFFFFF`)**: Pure white elevated card surfaces with subtle hairline borders.
- **Vermilion Pomodoro Red (`#C10134`)**: Electrifying, disciplined red used exclusively for the single primary action, completed Pomodoro units, active progress indicators, and milestone moments.
- **Hairline Border (`rgba(18, 17, 16, 0.08)`)**: Ultra-delicate border that provides clear structure without visual weight.
- **OLED Dark Canvas (`#0A0908` background, `#141312` card, `#1B1A19` popovers)**: Instrument-grade dark mode with specular highlights (`ring-1 ring-white/10`).

## Typography Scale

- **Headlines & Storytelling**: Manrope 800 with tight negative tracking (`-0.03em` to `-0.04em`).
- **Readouts & Timers**: Manrope with tabular figures (`tnum`) for countdown timers, statistical counts, target hours, and calendar day numbers.
- **Body & Labels**: Manrope 400/500/700 for maximum readability and legibility.

## Motion & Micro-Interactions

- **Spring Curve**: `--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)` for fluid, mass-bearing transitions.
- **Button Scaling**: `active:scale-[0.98]` tactile press effect, reset with `motion-reduce:active:scale-100` when reduced motion is requested.
- **Accessible Motion**: All animations and spring scaling gracefully fall back to zero transform when `prefers-reduced-motion: reduce` is enabled.

## Visual Units: The Geometric Tomato & "Ink Stamp" Metaphor

The Pomodoro unit is rendered as a clean, modern geometric tomato informed by Japanese Inkan (seal) stationery:
- **Complete**: Solid Vermilion `#C10134` ink fill with organic bleed texture (`<feTurbulence>` displacement filter), Obsidian `#121110` stem, and crisp outline.
- **Partial**: Vermilion fill clipped cleanly from left to right according to elapsed minutes (e.g. 5m = 20%, 15m = 60%), sitting inside an Obsidian outline with ink bleed.
- **Future / Unearned**: Empty Chalk/White fill with a subtle Obsidian hairline outline.
- **Active / Newly Earned**: Triggers the tactile physical `@keyframes ink-stamp` press animation (scale-down, micro-rotation settling, and opacity bloom) with an active focus ring indicator.

## Logo & Iconography

The existing `logo.png` is the canonical product mascot. It appears beside the accessible `1000 Pomodoros` wordmark in the app. Browser chrome continues to use the appropriately sized `favicon.png`, while the larger install icons remain available for platform-specific surfaces.

Navigation and controls use Lucide's familiar 2px rounded outline icons. Icons support labels and never carry meaning through color alone.
