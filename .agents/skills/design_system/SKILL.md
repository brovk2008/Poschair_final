---
name: design-system
description: Tactile claymorphism design language using custom rounded 3D shapes, border constraints, and shadows.
---

# Design System — Agent Instructions

This skill describes the visual design language for all UI output. Every component, layout, and page should follow the design specs in the module files below. These describe what the design looks like — you choose how to implement the styles.

## Style
A claymorphism-inspired interface featuring inflated, clay-like 3D shapes with warm cream backgrounds, deep inner shadows, soft outer elevation, and pill-shaped interactive elements that create a friendly, tactile browsing experience.

## Foundation

### Colors
- **neutral-primary-soft**: Light `#FAF6F0`, Dark `#121214` (stealth black/gray)
- **neutral-primary**: Light `#FAF6F0`, Dark `#0C0C0E`
- **neutral-secondary-medium**: Light `#F3EDE4`, Dark `#1E1E22`
- **neutral-tertiary-medium**: Light `#EBE4D8`, Dark `#2A2A30`
- **brand**: Light `#1C398E`, Dark `#3b82f6` (blue)
- **danger**: Light `#C70036`, Dark `#ef4444` (red)
- **heading**: Light `#2C2215`, Dark `#FAF6F0`
- **body**: Light `#6B5C4A`, Dark `#A99880`

### Shadows
- **shadow-sm** (buttons): `4px 8px 16px rgba(0,0,0,0.1), inset -3px -4px 8px rgba(0,0,0,0.05), inset 3px 4px 8px rgba(255,255,255,0.6)`
- **shadow-md** (cards): `6px 12px 24px rgba(0,0,0,0.12), inset -4px -6px 10px rgba(0,0,0,0.05), inset 4px 6px 10px rgba(255,255,255,0.55)`

### Radius
- **base** (cards, containers): `36px`
- **default** (buttons, inputs): `999px` (pill shape)
