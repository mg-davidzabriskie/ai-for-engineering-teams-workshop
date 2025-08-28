# Accessibility Standards

All components must meet **WCAG 2.1 AA standards**:

## Core Requirements
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Semantic HTML**: Proper heading hierarchy and semantic structure  
- **ARIA Support**: Labels and descriptions for complex components
- **Color Contrast**: 4.5:1 ratio for normal text, 3:1 for large text
- **Focus Management**: Clear, visible focus indicators
- **Screen Reader Support**: Alt text for images, logical content structure
- **Inclusive Design**: Support for reduced motion preferences and assistive technologies

## Implementation Guidelines
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- Provide `aria-label` or `aria-labelledby` for interactive elements
- Ensure logical tab order with `tabindex` when needed
- Test with keyboard-only navigation
- Verify color contrast using accessibility tools
- Include `alt` attributes for all informative images
- Support `prefers-reduced-motion` media query