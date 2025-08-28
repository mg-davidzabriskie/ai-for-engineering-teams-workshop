# Spec Template for Workshop

Copy this template for all workshop exercises:

## Feature: CustomerSelector Component

### Context
- Purpose and role in the application: Main customer selection interface for the Customer Intelligence Dashboard
- How it fits into the larger system: Central component that allows users to browse, search, and select customers for detailed analysis
- Who will use it and when: Customer success teams and account managers who need to quickly find and select customers from a list of 100+ customers for monitoring and analysis

### Requirements
- Functional requirements (what it must do): Display customer cards using the CustomerCard component, provide search/filter functionality by name or company, show visual selection state for chosen customer, persist customer selection across interactions
- User interface requirements: Clean grid layout of customer cards, prominent search input field, highlighted selection state, responsive design for mobile and desktop, loading states for search operations
- Data requirements: Uses mock data from `src/data/mock-customers.ts`, supports filtering and searching customer records, maintains selected customer state
- Integration requirements: Uses the existing CustomerCard component, integrates with dashboard state management, compatible with Next.js App Router architecture

### Constraints
- Technical stack and frameworks (Next.js 15, React 19, TypeScript, Tailwind CSS)
- Performance requirements (load times, rendering thresholds): Efficient search filtering with debouncing, smooth selection transitions, handles 100+ customers without performance degradation
- Design constraints (responsive breakpoints, component size limits): Responsive grid layout using Tailwind breakpoints, search input accessible on mobile devices, customer cards maintain consistent sizing
- File structure and naming conventions: CustomerSelector component in `src/components/CustomerSelector.tsx`, uses existing CustomerCard from `src/components/CustomerCard.tsx`
- Props interface and TypeScript definitions: Strongly typed interface for customer data, search state, and selection callbacks
- Security considerations: Input sanitization for search queries, no sensitive customer data exposure in URL or localStorage

### Acceptance Criteria
- [ ] Displays all customers using CustomerCard components in a grid layout
- [ ] Provides search input that filters customers by name or company in real-time
- [ ] Shows visual highlight/selection state when a customer is clicked
- [ ] Persists selected customer across component re-renders
- [ ] Handles empty search results gracefully with appropriate messaging
- [ ] Responsive design works on mobile, tablet, and desktop screen sizes
- [ ] Search is debounced to avoid excessive filtering operations
- [ ] Integrates seamlessly with existing CustomerCard component
- [ ] Loading states are shown during search operations
- [ ] Clear search functionality to reset filters and show all customers