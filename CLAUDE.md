# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (opens http://localhost:3000)
- **Build for production**: `npm run build`
- **Type checking**: `npm run type-check` (run this before commits)
- **Linting**: `npm run lint` (uses ESLint with Next.js config)
- **Install dependencies**: `npm install`

## Project Architecture

This is a **Customer Intelligence Dashboard** built using **spec-driven development** methodology for an AI engineering teams workshop. The application progressively builds components through structured exercises.

### Core Structure
- **Next.js 15** with App Router architecture
- **React 19** with TypeScript for type safety
- **Tailwind CSS v4** for styling
- Mock data-driven development (no external APIs initially)

### Key Directories
- `src/app/` - Next.js App Router pages (layout.tsx, page.tsx)
- `src/data/` - Mock data files (customers, market intelligence)
- `src/components/` - React components (created through exercises)
- `exercises/` - Workshop exercise instructions
- `requirements/` - Feature specifications and requirements
- `specs/` - Generated specifications from AI agents
- `templates/` - Specification templates for consistent AI input

### Component Architecture Pattern
Components are developed using a **progressive showcase** pattern:
- Main dashboard (`src/app/page.tsx`) dynamically imports completed components
- Uses try/catch blocks to gracefully handle missing components
- Shows progress indicators for implemented vs pending features
- Each exercise builds upon previous components

### Data Models
Customer interface (`src/data/mock-customers.ts`):
```typescript
interface Customer {
  id: string;
  name: string;
  company: string;
  healthScore: number; // 0-100 customer health metric
  email?: string;
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  domains?: string[]; // For health checking exercises
  createdAt?: string;
  updatedAt?: string;
}
```

### Spec-Driven Development Workflow
1. Use template from `templates/spec-template.md` for new features
2. Store generated specifications in `specs/` directory
3. Components should be created in `src/components/` following existing patterns
4. Use TypeScript path alias `@/*` for imports from `src/`

### Important Reminders
- Using @templates/spec-template.md stores generated specs in @specs/
- Under no circumstances perform a deletion of files or directories without user approval

### Workshop Exercise Integration
- Exercises are numbered 01-10 and build incrementally
- Main page shows progress indicators for each completed exercise
- Components auto-discover when implemented (no manual registration needed)
- Follow exercise requirements in `requirements/` directory for specifications

### Accessibility Standards
All components must follow the accessibility requirements defined in `requirements/claude-standards/accessibility-standards.md` (WCAG 2.1 AA compliance).

### Code Quality Standards
All code must follow the quality requirements defined in `requirements/claude-standards/code-quality-standards.md`.

### Configuration Notes
- ESLint uses Next.js recommended config with TypeScript support
- TypeScript configured with strict mode and Next.js plugin
- Tailwind CSS v4 with PostCSS integration
- Path mapping: `@/*` maps to `./src/*`

