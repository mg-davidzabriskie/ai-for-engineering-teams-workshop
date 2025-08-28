# Health Score Calculator Specification

## Feature: Customer Health Score Calculator

### Context
- **Purpose**: Build a comprehensive customer health scoring system that provides predictive analytics for customer relationship health and churn risk assessment within the Customer Intelligence Dashboard
- **Role in Application**: Core business intelligence component that transforms multiple data streams into actionable customer health insights, serving as the foundation for proactive customer success management
- **System Integration**: Seamlessly integrates with the progressive dashboard architecture, utilizing existing CustomerSelector components and following established widget patterns for consistent user experience
- **Users and Usage**: Customer Success Managers, Account Managers, and Business Intelligence teams will use this during daily customer review sessions, weekly health assessments, and quarterly business reviews to prioritize interventions and identify at-risk accounts

### Requirements

#### Functional Requirements
- **Health Score Calculation**: Implement a multi-factor scoring algorithm that calculates customer health scores on a 0-100 scale with clear risk level categorization
- **Pure Function Architecture**: Modular calculator functions in `lib/healthCalculator.ts` with individual scoring functions for each factor (payment, engagement, contract, support) and a main `calculateHealthScore` function that combines all factors
- **Real-time Computation**: Calculate health scores dynamically based on current customer data with efficient algorithms suitable for dashboard responsiveness
- **Score Breakdown**: Provide detailed breakdown showing individual factor contributions, confidence levels, and data quality indicators
- **Trend Analysis**: Include trending indicators showing improving vs declining customer health trajectories over time
- **Risk Classification**: Categorize customers into three risk levels: Healthy (71-100), Warning (31-70), Critical (0-30)

#### User Interface Requirements  
- **CustomerHealthDisplay Widget**: React component following established dashboard patterns with consistent styling, loading states, and error handling
- **Visual Health Indicators**: Color-coded visualization using existing green/yellow/red palette matching CustomerCard health score indicators
- **Interactive Breakdown**: Expandable detailed view showing individual factor scores, confidence levels, and data quality metrics
- **Integration Points**: Seamless integration with CustomerSelector component for real-time health score updates when customer selection changes
- **Responsive Design**: Mobile-first responsive design supporting all dashboard breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Accessibility Compliance**: Full WCAG 2.1 AA compliance with screen reader support, keyboard navigation, and proper ARIA labels

#### Data Requirements
- **Payment History Inputs**: Days since last payment, average payment delay, overdue amounts, payment method reliability, billing cycle adherence
- **Engagement Metrics**: Login frequency, feature usage count, session duration trends, page views, support ticket volume
- **Contract Information**: Days until renewal, contract value, subscription tier, recent upgrades/downgrades, auto-renewal status
- **Support Data**: Average resolution time, satisfaction scores, escalation counts, self-service vs assisted support ratio
- **Data Validation**: Comprehensive input validation with descriptive error messages for all data types and ranges
- **Missing Data Handling**: Graceful degradation with reasonable defaults and confidence scoring for data quality assessment

#### Integration Requirements
- **Dashboard Layout**: Consistent integration with existing dashboard widget grid system and responsive breakpoints
- **State Management**: Integration with CustomerSelector state management patterns for selected customer updates
- **Error Boundaries**: React error boundary integration following existing dashboard error handling patterns  
- **Loading States**: Consistent loading skeleton animations matching other dashboard widgets
- **Real-time Updates**: Automatic health score recalculation when customer data changes or different customer is selected

### Constraints

#### Technical Stack and Frameworks
- **Next.js 15** with App Router architecture for server-side rendering and optimal performance
- **React 19** with TypeScript for type safety, modern hooks, and component composition patterns
- **Tailwind CSS v4** for consistent styling following existing dashboard design system
- **Pure Function Architecture** for predictable testing, debugging, and mathematical accuracy verification

#### Performance Requirements
- **Load Time Targets**: Initial component render within 200ms, health score calculation completion within 100ms for real-time dashboard responsiveness
- **Rendering Thresholds**: Support up to 1000 customers with smooth scrolling and selection performance
- **Memory Optimization**: Efficient data structures and memoization strategies for repeated calculations
- **Caching Strategy**: Implement intelligent caching for health score calculations to minimize computational overhead during rapid customer selection changes

#### Design Constraints
- **Responsive Breakpoints**: Mobile (320px+), tablet (768px+), desktop (1024px+), wide (1280px+) with progressive enhancement
- **Component Size Limits**: Maximum widget height of 600px on desktop, 400px on mobile with vertical scrolling for detailed breakdown
- **Color Accessibility**: High contrast ratios (4.5:1 minimum) for all health score indicators and text combinations
- **Typography Scale**: Consistent with existing dashboard typography using Inter font family

#### File Structure and Naming Conventions
```
src/
├── lib/
│   ├── healthCalculator.ts          # Core calculation functions
│   ├── healthCalculator.test.ts     # Comprehensive unit tests
│   └── types/
│       └── healthScore.ts           # TypeScript interfaces
├── components/
│   ├── CustomerHealthDisplay.tsx    # Main widget component
│   ├── CustomerHealthDisplay.test.tsx
│   └── HealthScoreBreakdown.tsx     # Detailed breakdown component
└── hooks/
    └── useHealthScore.ts            # Custom hook for health score logic
```

#### Props Interface and TypeScript Definitions
```typescript
// Core data interfaces
interface HealthScoreInput {
  paymentHistory: PaymentMetrics;
  engagementData: EngagementMetrics;
  contractInfo: ContractMetrics;
  supportData: SupportMetrics;
}

interface HealthScoreResult {
  overallScore: number;
  riskLevel: 'healthy' | 'warning' | 'critical';
  confidence: number;
  factorScores: FactorBreakdown;
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: string;
}

// Component props
interface CustomerHealthDisplayProps {
  customer: Customer;
  className?: string;
  showBreakdown?: boolean;
  onScoreChange?: (score: HealthScoreResult) => void;
}
```

#### Security Considerations
- **Input Sanitization**: Strict validation and sanitization of all customer data inputs to prevent injection attacks
- **Data Privacy**: No logging or persistence of sensitive customer financial or personal information
- **Error Handling**: Secure error messages that don't expose internal system information or customer data
- **Access Control**: Integration with existing dashboard authentication and authorization patterns

### Acceptance Criteria

#### Core Algorithm Functionality
- [ ] **Multi-factor Calculation**: Health score accurately calculated using weighted formula (Payment 40%, Engagement 30%, Contract 20%, Support 10%)
- [ ] **Score Range Validation**: All calculated scores fall within 0-100 range with proper mathematical precision
- [ ] **Risk Level Classification**: Correct categorization into Healthy (71-100), Warning (31-70), Critical (0-30) levels
- [ ] **Individual Factor Scoring**: Each factor (payment, engagement, contract, support) calculated independently with normalized 0-100 sub-scores
- [ ] **Confidence Scoring**: Algorithm provides confidence level (0-1) based on data completeness and quality

#### Edge Cases Handled
- [ ] **New Customer Handling**: Customers with less than 90 days of data receive appropriate default scoring with reduced confidence
- [ ] **Missing Data Graceful Degradation**: Algorithm handles missing data points with reasonable defaults and clear confidence impact
- [ ] **Invalid Data Resilience**: Robust handling of null, undefined, negative, or out-of-range input values with proper error messages
- [ ] **Data Type Validation**: Strong TypeScript typing prevents runtime errors from incorrect data types
- [ ] **Boundary Conditions**: Proper handling of edge cases like zero contract value, infinite payment delays, or extreme engagement patterns

#### User Experience Validated  
- [ ] **Visual Clarity**: Health score immediately understandable through color coding and typography hierarchy
- [ ] **Interactive Elements**: Expandable breakdown section provides detailed factor analysis without overwhelming primary display
- [ ] **Loading Performance**: Smooth transitions and loading states maintain responsive feel during calculations
- [ ] **Error States**: Clear, actionable error messages guide users when data is insufficient or invalid
- [ ] **Accessibility Excellence**: Screen readers announce health scores with appropriate context, keyboard navigation works flawlessly

#### Integration Points Verified
- [ ] **CustomerSelector Integration**: Health score updates immediately when different customer is selected in dashboard
- [ ] **Dashboard Layout Consistency**: Widget maintains visual consistency with other dashboard components across all breakpoints
- [ ] **State Management**: Component properly manages internal state while integrating with parent dashboard state patterns
- [ ] **Error Boundary Integration**: Component failures are gracefully handled by existing dashboard error boundaries
- [ ] **Real-time Responsiveness**: Health score calculations complete within performance thresholds without blocking UI interactions

#### Algorithm Design Validation
- [ ] **Mathematical Accuracy**: All calculations produce mathematically correct results verified through comprehensive test scenarios
- [ ] **Normalization Consistency**: Data normalization strategies produce consistent results across different input ranges and types
- [ ] **Business Logic Alignment**: Algorithm weighting and factor calculations align with documented business requirements and stakeholder expectations
- [ ] **Trend Analysis Accuracy**: Trending indicators correctly identify improving, stable, or declining customer health patterns
- [ ] **Explainable Results**: Algorithm decisions and calculations can be clearly explained to business stakeholders for transparency and validation

#### Testing and Quality Assurance
- [ ] **Unit Test Coverage**: Comprehensive unit test coverage (>50%) for all calculation functions and edge cases