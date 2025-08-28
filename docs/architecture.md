# Architecture Documentation

## Overview

This Customer Intelligence Dashboard demonstrates modern React/Next.js architecture patterns with secure API integration, comprehensive CRUD operations, and accessibility-first design. The application follows spec-driven development methodology where AI agents generate components based on detailed specifications.

## Core Architecture

### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with PostCSS integration
- **Security**: JWT authentication, middleware-based protection
- **Data**: Mock data with API simulation (ready for real backend integration)
- **Testing**: React Testing Library with accessibility testing
- **Build**: TypeScript strict mode, ESLint with Next.js config

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes with authentication
│   │   └── customers/     # CRUD endpoints
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── ui/               # Base UI components (LoadingButton)
│   ├── CustomerCard.tsx   # Individual customer display
│   ├── CustomerList.tsx   # Customer grid with search/filters
│   ├── CustomerSelector.tsx # Customer picker with multi-select
│   ├── AddCustomerForm.tsx # Create/edit form with validation
│   └── CustomerManagement.tsx # Main CRUD container
├── hooks/                # Custom React hooks
│   └── useCustomers.ts   # Customer API integration
├── services/             # Business logic layer
│   └── CustomerService.ts # Data operations
├── middleware/           # Request processing
│   └── security.ts      # Authentication & validation
├── data/                 # Mock data and types
│   ├── mock-customers.ts
│   └── mock-market-intelligence.ts
└── contexts/             # React context providers (future)
```

## Architecture Patterns

### 1. Component Composition Pattern

Components follow a hierarchical composition model:

```
CustomerManagement (Container)
├── CustomerList (Data Display)
│   ├── CustomerCard (Item Display)
│   └── Search/Filter Controls
└── AddCustomerForm (Data Entry)
    └── Form Fields with Validation
```

**Benefits:**
- Reusable components across different contexts
- Clear separation of concerns
- Easy testing and maintenance
- Consistent UI patterns

### 2. Secure API Layer

```
Client Request → Middleware → API Route → Service Layer → Response
     ↓              ↓           ↓           ↓           ↓
Authentication   Validation   Routing   Business    Formatted
Rate Limiting    Sanitization Processing  Logic      Response
```

**Security Features:**
- JWT token authentication
- Input validation and sanitization
- XSS/SSRF protection
- Rate limiting per endpoint
- Role-based access control

### 3. Custom Hooks Pattern

The `useCustomers` hook demonstrates the complete data management pattern:

```typescript
const {
  // State
  customers, isLoading, error,
  
  // Actions  
  createCustomer, updateCustomer, deleteCustomer,
  
  // Utilities
  searchCustomers, refreshCustomers, clearError
} = useCustomers({ autoFetch: true })
```

**Features:**
- Optimistic updates with rollback
- Comprehensive error handling
- Loading state management
- Search with debouncing
- Auto-fetch with dependency tracking

### 4. Form Management Pattern

The `AddCustomerForm` implements enterprise-grade form handling:

- Real-time validation with user feedback
- Accessibility compliance (WCAG 2.1 AA)
- Error state management with field-level errors
- Support for both create and edit modes
- Integration with secure API endpoints

### 5. Progressive Enhancement

Components are built with progressive enhancement:
- Base functionality works without JavaScript
- Enhanced interactions with React
- Graceful degradation for accessibility
- Performance optimized with loading states

## Security Architecture

### Authentication Flow
1. Client requests protected resource
2. Middleware validates JWT token
3. Token decoded and user permissions checked
4. Request forwarded to API route or rejected
5. API route processes request with user context

### Input Validation Pipeline
1. **Client-side**: Form validation with TypeScript types
2. **Middleware**: Request sanitization and validation
3. **Service Layer**: Business logic validation
4. **Database Layer**: Final constraint validation (future)

### Protection Mechanisms
- **XSS Prevention**: Input sanitization, CSP headers
- **SSRF Protection**: URL validation, domain restrictions
- **Rate Limiting**: Per-IP and per-user request limits
- **CORS Configuration**: Strict origin policies
- **Error Handling**: Sanitized error responses

## Data Flow Architecture

### Read Operations (Customer List)
```
Component → useCustomers → API Route → Service → Mock Data → Response
    ↓                                                            ↓
State Update ←─────────────────────────────────────── Formatted Data
```

### Write Operations (Create/Update)
```
Form Submit → Validation → Optimistic Update → API Call
    ↓              ↓             ↓               ↓
Error State ← Rollback ← Local State ← Success/Failure
```

### Search & Filtering
```
User Input → Debounced Query → Client-side Filter → Results Display
                    ↓
            Optional API Search (for large datasets)
```

## Component Integration Patterns

### 1. Container/Presentational Pattern
- **Containers** (`CustomerManagement`): Handle state, API calls, business logic
- **Presentational** (`CustomerCard`): Receive props, render UI, emit events

### 2. Compound Component Pattern
- Components work together but remain independent
- Shared state through props and callbacks
- Example: `CustomerList` + `CustomerCard` + action buttons

### 3. Render Props/Children Pattern
- Flexible component composition
- Used in loading states and error boundaries
- Enables customization without modification

## Accessibility Architecture

### Standards Compliance
- **WCAG 2.1 AA** compliance across all components
- Semantic HTML with proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility

### Implementation Patterns
- Proper heading hierarchy (`h1` → `h2` → `h3`)
- Focus management in modal dialogs
- Loading state announcements with `aria-live`
- Form validation with `aria-invalid` and `aria-describedby`

### Testing Strategy
- Automated accessibility testing with axe-core
- Manual keyboard navigation testing
- Screen reader testing with NVDA/VoiceOver
- Color contrast validation

## Performance Architecture

### Client-Side Optimization
- React 19 concurrent features
- Optimistic updates for perceived performance
- Debounced search to reduce API calls
- Lazy loading for large component trees

### Bundle Optimization
- Tree shaking with ES modules
- Dynamic imports for code splitting
- Tailwind CSS purging for minimal CSS
- TypeScript for better minification

### Network Optimization
- Request deduplication in hooks
- Caching with stale-while-revalidate
- Optimistic updates to reduce perceived latency
- Compression and efficient serialization

## Testing Architecture

### Testing Strategy
- **Unit Tests**: Component logic and utilities
- **Integration Tests**: Component interactions
- **E2E Tests**: Complete user workflows
- **Accessibility Tests**: WCAG compliance

### Testing Patterns
- React Testing Library for user-centric tests
- Mock Service Worker for API mocking
- Custom render utilities with providers
- Accessibility matchers for compliance testing

## Deployment Architecture

### Build Process
1. TypeScript compilation with strict checks
2. ESLint validation for code quality
3. Tailwind CSS optimization and purging
4. Next.js optimization and bundling
5. Asset optimization and compression

### Security Considerations
- Environment variable management
- API key rotation and storage
- HTTPS enforcement
- Security header configuration
- Content Security Policy implementation

## Future Architecture Considerations

### Scalability Patterns
- State management with Zustand/Redux for complex state
- Real-time updates with WebSockets or Server-Sent Events
- Micro-frontend architecture for team scaling
- CDN integration for global performance

### Backend Integration
- REST API with OpenAPI specifications
- GraphQL for flexible data fetching
- Database integration with Prisma/Drizzle
- Event-driven architecture with queues
- Caching layers with Redis

### Monitoring & Observability
- Error tracking with Sentry
- Performance monitoring with Web Vitals
- User analytics with privacy-first solutions
- API monitoring and alerting
- Security event logging

This architecture provides a solid foundation for building scalable, secure, and accessible customer intelligence applications while maintaining developer productivity and code quality.