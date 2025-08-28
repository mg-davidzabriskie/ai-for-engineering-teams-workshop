# Spec Template for Workshop

Copy this template for all workshop exercises:

## Feature: CustomerCard Component

### Context
- Individual customer display component for Customer Intelligence Dashboard
- Used within CustomerSelector container component to show customer information
- Provides at-a-glance customer information for quick identification and selection
- Foundation component for domain health monitoring integration in later exercises
- Will be used by customer success teams and account managers to quickly assess customer status

### Requirements
- **Functional Requirements:**
  - Display customer name, company name, and health score prominently
  - Show customer domains (websites) for health monitoring context
  - Display domain count when customer has multiple domains
  - Provide visual health score indicator using color coding
  - Support click/selection interaction for customer selection workflows

- **User Interface Requirements:**
  - Clean, card-based visual design with proper spacing and typography
  - Color-coded health indicator system:
    - Red (0-30): Poor health score - requires immediate attention
    - Yellow (31-70): Moderate health score - monitoring needed
    - Green (71-100): Good health score - healthy customer
  - Basic responsive design for mobile and desktop viewports
  - Clear visual hierarchy with customer name as primary information

- **Data Requirements:**
  - Uses mock data from `src/data/mock-customers.ts`
  - Customer interface includes optional `domains` array of website URLs
  - Supports customers with 1 or multiple domains for health checking
  - Health score as numeric value (0-100) for color coding logic

- **Integration Requirements:**
  - Designed to be imported and used within CustomerSelector component
  - Props-based interface for passing customer data
  - Compatible with Next.js App Router architecture
  - Uses TypeScript path alias `@/*` for imports from `src/`

### Constraints
- **Technical Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Performance Requirements:** 
  - Fast rendering for multiple cards in list views
  - Minimal re-renders when customer data updates
- **Design Constraints:**
  - Responsive breakpoints following Tailwind CSS conventions
  - Card component should be reusable and composable
  - Maximum card width for optimal readability
- **File Structure:** Component should be created in `src/components/CustomerCard.tsx`
- **Props Interface:** Strongly typed TypeScript interface for Customer props
- **Security Considerations:** No sensitive customer data exposure in DOM attributes

### Acceptance Criteria
- [ ] Displays customer name, company, and health score correctly
- [ ] Shows appropriate color coding based on health score ranges
- [ ] Displays domain information when available (single domain or count for multiple)
- [ ] Renders responsively on mobile and desktop screen sizes
- [ ] Handles edge cases: missing domains, extreme health scores, long names
- [ ] Integrates cleanly with CustomerSelector component
- [ ] Follows TypeScript strict mode without errors
- [ ] Uses Tailwind CSS classes consistently with project patterns
- [ ] Component can be imported using `@/components/CustomerCard` path alias
- [ ] Graceful handling of undefined or null customer data