# MarketIntelligenceWidget Specification

## Feature: MarketIntelligenceWidget

### Context
- Purpose and role in the application: Provides real-time market sentiment analysis and news intelligence for customer companies within the Customer Intelligence Dashboard
- How it fits into the larger system: Integrates with existing customer management system to enhance customer insights with external market data, following the established dashboard widget pattern
- Who will use it and when: Account managers and customer success teams will use this widget when reviewing customer accounts to understand market conditions that might affect customer health and business opportunities

### Requirements

#### Functional requirements (what it must do)
- Accept company name input with real-time validation and search capabilities
- Fetch and display market sentiment analysis with visual indicators (positive/neutral/negative)
- Show recent news headlines (top 3) with source attribution and publication timestamps
- Display total article count and last updated timestamp for data freshness
- Implement caching mechanism with 10-minute TTL to optimize performance
- Provide loading states during data fetching with skeleton UI
- Handle error states gracefully with actionable user feedback
- Support manual refresh functionality for data updates
- Generate realistic mock data for reliable workshop demonstrations
- Implement realistic API delay simulation (200-800ms) for authentic user experience
- Demonstrate automated pattern discovery and component composition techniques
- Use caching with 10-minute TTL expiration for optimal performance

#### User interface requirements
- Clean, card-based layout matching existing dashboard widget patterns
- Company name input field with autocomplete suggestions and validation feedback
- Color-coded sentiment indicators: green (positive), yellow (neutral), red (negative)
- Sentiment score display with confidence percentage
- News headlines list with source, date, and truncated content
- Loading skeleton matching established loading state patterns
- Error states with retry functionality and clear messaging
- Responsive design supporting mobile and desktop viewports
- Accessibility compliance with WCAG 2.1 AA standards

#### Data requirements
- Company name validation (2-100 characters, alphanumeric and common punctuation)
- Market sentiment data structure with score (-1 to 1), label, and confidence
- News headline objects with title, source, publishedAt, and optional URL
- Caching layer for API responses with timestamp tracking
- Mock data generation service for reliable workshop outcomes
- Error tracking and logging for debugging and monitoring

#### Integration requirements
- Seamless integration with existing CustomerManagement component
- Receive company name from selected customer context
- Share loading and error state patterns with other dashboard components
- Follow established API route patterns for consistency
- Integrate with existing TypeScript interfaces and data models
- Maintain consistent styling with existing UI components
- Support the established optimistic update patterns
- Integration with main Dashboard component alongside existing widgets
- Follow same prop passing and state management patterns as customer management
- Maintain responsive grid layout and consistent spacing with existing dashboard

### Constraints

#### Technical stack and frameworks
- Next.js 15 with App Router and Route Handlers for API endpoints
- React 19 with concurrent features and modern hook patterns
- TypeScript strict mode with comprehensive type definitions
- Tailwind CSS v4 for styling with existing design system
- Mock data service following established service layer patterns
- Pure function implementations in service layer for testability and consistency
- Centralized error handling with custom MarketIntelligenceError class
- 10-minute TTL caching mechanism with automatic expiration and cleanup

#### Performance requirements
- Initial load time under 2 seconds with cached data
- API response time under 500ms for mock data generation
- Smooth transitions and animations using CSS transforms
- Efficient re-rendering with React.memo and useMemo optimization
- Client-side caching to reduce API calls and improve UX

#### Design constraints
- Responsive breakpoints: mobile (320px+), tablet (768px+), desktop (1024px+)
- Component maximum width: 400px with flexible height
- Minimum touch target size: 44px for mobile accessibility
- Color contrast ratios meeting WCAG 2.1 AA standards (4.5:1 for normal text)
- Typography using existing system fonts and sizing scale

#### File structure and naming conventions
- Component file: `src/components/MarketIntelligenceWidget.tsx`
- API route: `src/app/api/market-intelligence/[company]/route.ts`
- Service class: `src/services/MarketIntelligenceService.ts`
- Error class: Custom `MarketIntelligenceError` extending base Error class
- Type definitions: Extend existing types in component files
- Test files: `*.test.tsx` with comprehensive coverage
- Hook file: `src/hooks/useMarketIntelligence.ts` following useCustomers pattern

#### Props interface and TypeScript definitions
```typescript
interface MarketIntelligenceWidgetProps {
  company?: string
  onCompanySelect?: (company: string) => void
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface MarketSentiment {
  score: number // -1 to 1
  label: 'positive' | 'neutral' | 'negative'
  confidence: number // 0 to 1
}

interface NewsHeadline {
  title: string
  source: string
  publishedAt: string
  url?: string
}

interface MarketIntelligenceData {
  sentiment: MarketSentiment
  headlines: NewsHeadline[]
  articleCount: number
  lastUpdated: string
  company: string
}

interface MarketIntelligenceCacheEntry {
  data: MarketIntelligenceData
  timestamp: number
  expiresAt: number
}

class MarketIntelligenceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'MarketIntelligenceError'
  }
}
```

#### Security considerations
- Company name input sanitization to prevent XSS attacks
- Mock data generation security to prevent code injection
- API rate limiting following established middleware patterns
- Input validation with whitelist approach for company names
- Error message sanitization to prevent information leakage
- CORS configuration for API endpoints
- Request/response logging for security monitoring

#### Context Compression and Pattern Discovery
- Demonstrate automated pattern discovery by analyzing existing component structures
- Maintain consistency across multiple AI-generated widgets without manual intervention
- Show effective spec generation using existing codebase analysis and pattern extraction
- Illustrate cohesive dashboard composition with multiple AI-generated components
- Use established patterns from CustomerCard, CustomerList, and CustomerManagement
- Follow same loading state, error handling, and interaction patterns discovered from codebase
- Ensure predictable workshop outcomes with reliable mock data generation

### Acceptance Criteria
- [ ] Company name input field validates input and provides real-time feedback
- [ ] Market sentiment displays with appropriate color coding and confidence level
- [ ] News headlines show with proper formatting, source attribution, and timestamps
- [ ] Loading states appear immediately and match existing dashboard patterns
- [ ] Error states provide clear messaging and retry functionality
- [ ] Component renders responsively across all supported breakpoints
- [ ] Accessibility features work with keyboard navigation and screen readers
- [ ] API endpoints follow established security and validation patterns
- [ ] Mock data generation creates realistic, company-specific content
- [ ] Caching mechanism reduces API calls and improves performance
- [ ] Integration with CustomerManagement passes company context correctly
- [ ] Component matches existing dashboard widget styling and behavior
- [ ] TypeScript compilation passes with strict mode enabled
- [ ] All user interactions provide appropriate visual feedback
- [ ] Error boundaries catch and handle component failures gracefully
- [ ] Manual refresh functionality updates data and UI state correctly
- [ ] Component state management follows established patterns from useCustomers hook
- [ ] News headlines truncate appropriately and support expand/collapse functionality
- [ ] Market sentiment calculation uses established mock data algorithms
- [ ] Component can be used standalone or within larger dashboard context
- [ ] Performance meets specified load time and response time requirements
- [ ] API delay simulation provides realistic user experience (200-800ms response times)
- [ ] Custom MarketIntelligenceError class handles service layer errors appropriately
- [ ] Service layer uses pure functions for testability and consistency
- [ ] Caching mechanism expires entries after 10 minutes and handles cleanup
- [ ] Pattern discovery demonstrates consistency with existing dashboard components
- [ ] Integration with main Dashboard follows same prop patterns as customer management
- [ ] Component composition shows automated pattern extraction from existing codebase
- [ ] Hook implementation (useMarketIntelligence) follows established patterns from useCustomers
- [ ] Workshop outcomes are predictable and reliable with mock data generation

#### API Route Testing Criteria
- [ ] GET /api/market-intelligence/[company] returns 200 with valid company name
- [ ] API route returns 400 for invalid company names (empty, too short, special characters)
- [ ] API route returns 400 for company names exceeding 100 character limit
- [ ] API response matches MarketIntelligenceData interface structure exactly
- [ ] API returns consistent sentiment scores between -1 and 1 for same company
- [ ] API generates exactly 3 headlines in response data structure
- [ ] API includes proper lastUpdated timestamp in ISO format
- [ ] API handles URL encoding for company names with spaces correctly
- [ ] API implements rate limiting and returns 429 when exceeded
- [ ] API sanitizes company input to prevent XSS and injection attacks
- [ ] API returns 500 with sanitized error messages for server failures
- [ ] API delay simulation works within 200-800ms range consistently
- [ ] API caching returns cached data for duplicate requests within TTL window
- [ ] API cache expiration works correctly after 10-minute TTL period
- [ ] API route follows same authentication patterns as customer API routes
- [ ] API request/response logging captures security monitoring data
- [ ] API CORS configuration matches existing endpoint security policies
- [ ] MarketIntelligenceService throws MarketIntelligenceError for invalid inputs
- [ ] Service layer caching mechanism handles concurrent requests safely
- [ ] Mock data generation creates realistic company-specific headlines consistently 