# Knowledge Clipper Design System
## Inspired by Linear.app

### Overview
This document outlines the design system for the Knowledge Clipper Chrome extension, inspired by the clean, structured aesthetic of Linear.app.

## Color Palette

### Primary Brand Colors
- **Primary**: `#5E6AD2` - Main brand color (purple/violet)
- **Primary Hover**: `#4E5BCC` - Interactive states
- **Primary Active**: `#3E4BC2` - Pressed states
- **Primary Light**: `#E5E7FF` - Subtle backgrounds
- **Primary Subtle**: `#F5F6FF` - Very light accents

### Surfaces & Backgrounds
- **Surface**: `#FFFFFF` - Main background
- **Surface Secondary**: `#F7F8F9` - Secondary backgrounds
- **Surface Hover**: `#F0F1F3` - Hover states
- **Surface Accent**: `#FAFBFC` - Accent backgrounds
- **Surface Elevated**: `#FFFFFF` - Cards, modals

### Text Hierarchy
- **Text Primary**: `#16171A` - Main text
- **Text Secondary**: `#68707C` - Secondary text
- **Text Tertiary**: `#9BA1A8` - Tertiary text
- **Text Disabled**: `#C1C6CC` - Disabled states
- **Text Inverse**: `#FFFFFF` - Text on dark backgrounds

### Borders & Dividers
- **Border**: `#E6E8EB` - Default borders
- **Border Medium**: `#D3D6DB` - Medium emphasis
- **Border Strong**: `#B4B9C2` - Strong emphasis

### Semantic Colors
- **Success**: `#00BC6F` with background `#E6FAF3`
- **Warning**: `#FFAB00` with background `#FFF5E6`
- **Error**: `#FF5247` with background `#FFE8E6`
- **Info**: `#5E6AD2` with background `#E5E7FF`

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Font Sizes
- **XS**: 11px - Small labels
- **SM**: 12px - Secondary text
- **Base**: 13px - Body text
- **MD**: 14px - Emphasized body text
- **LG**: 15px - Subheadings
- **XL**: 18px - Headings
- **2XL**: 20px - Large headings

### Line Heights
- **Tight**: 1.25 - Headings
- **Base**: 1.5 - Body text
- **Relaxed**: 1.75 - Long-form content

## Spacing Scale
- **XS**: 4px
- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 24px
- **2XL**: 32px

## Border Radius
- **SM**: 4px - Small elements
- **MD**: 6px - Medium elements
- **LG**: 8px - Large elements
- **XL**: 12px - Extra large elements
- **Full**: 9999px - Fully rounded

## Shadows
- **SM**: `0 1px 2px 0 rgba(22, 23, 26, 0.05)`
- **MD**: `0 4px 6px -1px rgba(22, 23, 26, 0.08), 0 2px 4px -2px rgba(22, 23, 26, 0.05)`
- **LG**: `0 10px 15px -3px rgba(22, 23, 26, 0.08), 0 4px 6px -4px rgba(22, 23, 26, 0.05)`
- **XL**: `0 20px 25px -5px rgba(22, 23, 26, 0.08), 0 8px 10px -6px rgba(22, 23, 26, 0.05)`

## Transitions
- **Fast**: 100ms cubic-bezier(0.4, 0, 0.2, 1) - Quick micro-interactions
- **Base**: 200ms cubic-bezier(0.4, 0, 0.2, 1) - Standard interactions
- **Slow**: 300ms cubic-bezier(0.4, 0, 0.2, 1) - Complex animations

## Iconography

### Icon Set
Using inline SVG icons with a consistent stroke style:
- Stroke width: 2px
- Stroke linecap: round
- Stroke linejoin: round
- No fill (outline style)

### Icon Sizes
- **XS**: 12×12px - Inline with small text
- **SM**: 16×16px - Inline with base text
- **MD**: 20×20px - Standalone small icons
- **LG**: 24×24px - Standard standalone icons
- **XL**: 32×32px - Large icons
- **XXL**: 48×48px - Empty states, illustrations

### Available Icons
- `icon-search` - Search functionality
- `icon-arrow-right` - Forward navigation
- `icon-arrow-left` - Back navigation
- `icon-check` - Success, completion
- `icon-trash` - Delete actions
- `icon-x` - Close, remove
- `icon-tag` - Tags, categories
- `icon-link` - External links
- `icon-file-text` - Documents, notes

## Focus States
- **Focus Ring**: `0 0 0 3px rgba(94, 106, 210, 0.12)`
- **Error Focus Ring**: `0 0 0 3px rgba(255, 82, 71, 0.12)`

## Component Patterns

### Buttons
- Primary: Purple background, white text
- Secondary: Transparent background, border, primary text
- Ghost: Transparent background, no border, primary text

### Input Fields
- Border: Light gray by default
- Focus: Primary color border with focus ring
- Error: Red border with error focus ring

### Cards
- Background: White
- Border: Light gray
- Hover: Subtle shadow elevation

### Chips/Pills
- Background: Primary color
- Text: White
- Rounded: Fully rounded corners
- Remove icon: White X on hover

## Usage Guidelines

### Do's
- ✅ Use consistent spacing from the spacing scale
- ✅ Use semantic color names (e.g., `--color-action` not `--color-blue`)
- ✅ Maintain icon stroke consistency
- ✅ Use proper text hierarchy
- ✅ Apply appropriate focus states to interactive elements

### Don'ts
- ❌ Don't use arbitrary spacing values
- ❌ Don't mix icon styles
- ❌ Don't skip text hierarchy levels
- ❌ Don't use pure black (#000) or pure white (#FFF) for text
- ❌ Don't create new colors without documenting them

## Accessibility

### Contrast Ratios
- Primary text on backgrounds: Minimum 4.5:1
- Secondary text on backgrounds: Minimum 3:1
- Interactive elements: Minimum 3:1

### Focus Indicators
- All interactive elements must have visible focus states
- Focus rings should be consistent across components

### Motion
- Respect `prefers-reduced-motion` for animations
- Keep animations fast (100-300ms) for snappy feel

## Implementation

### CSS Variables
All design tokens are defined as CSS custom properties in `styles.css`:

```css
:root {
  --color-primary: #5E6AD2;
  --spacing-md: 12px;
  --font-size-base: 13px;
  /* ... */
}
```

### Using in Components
```css
.button {
  background: var(--color-action);
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}
```

### Using Icons
```html
<svg class="icon icon-sm">
  <use href="#icon-search"></use>
</svg>
```

## Updates & Maintenance
- Version: 1.0.0
- Last Updated: 2026-01-27
- Maintained by: Development Team
