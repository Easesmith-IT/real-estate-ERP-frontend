# Spatial Light Enterprise Design System

## Design Direction
- Personality: premium, energetic, modern, spatial, intelligent, calm
- UX target: high scanning speed, low fatigue, strong operational clarity
- Theme model: light-first with optional dark fallback architecture

## Layered Surface Hierarchy
- Layer 0: `--color-app` (`#EEF2F7`) app background
- Layer 1: `--color-workspace` (`#F8FAFC`) workspace sections
- Layer 2: `--color-surface` (`#FFFFFF`) cards and data containers
- Layer 3: floating controls, topbar, overlays with soft elevation and blur

## Central Tokens (`app/globals.css`)
- Color tokens: surfaces, hovers, active, semantics, text hierarchy
- Shadow tokens: enterprise, soft, floating, search elevation
- Radius tokens: button/input/icon/card/modal/floating
- Motion tokens: hover 180ms, modal 250ms, page 300ms
- Spacing tokens: xs-sm-md-lg-xl-2xl-3xl
- Utilities: `surface-workspace`, `sidebar-rail`, `topbar-floating`, `search-elevated`, `card-kpi`, `kpi-icon-shell`

## Shared Architecture
- App shell: floating sidebar + floating topbar + workspace panel
- Navigation: grouped, scan-friendly, active-state emphasis with subtle glow
- Search-first topbar hierarchy for faster global workflows

## Component System
- Buttons: primary/secondary/ghost/danger/ai variants
- Inputs: elevated and focus-visible enterprise controls
- Cards: layered white surfaces with premium shadows
- KPI cards: gradient intelligence cards with icon shells and trend badges
- Table: sticky filter/header, compact mode, row actions, inline edit, skeleton, pagination
- Forms: progressive disclosure sections with consistent spacing rhythm
- Modal/Drawer: spatial elevated overlays

## AI Experience
- Command palette and assistant panel are integrated, non-intrusive, and token-aligned
- Signature AI command button uses controlled gradient/glow for premium identity

## Engineering Rules
- No one-off styling in modules
- Extend tokens first, then primitives
- Preserve layer hierarchy and interaction timings across all modules
- Keep tables/forms/layouts consistent for enterprise maintainability
