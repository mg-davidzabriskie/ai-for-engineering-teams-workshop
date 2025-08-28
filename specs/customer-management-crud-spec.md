# Spec Template for Workshop

Copy this template for all workshop exercises:

## Feature: Customer Management CRUD Operations

### Context
- **Purpose**: Provides comprehensive Create, Read, Update, Delete (CRUD) operations for customer management within the Customer Intelligence Dashboard
- **Role in Application**: Central data management layer that bridges the UI components with customer data persistence, enabling full lifecycle management of customer records
- **System Integration**: Builds upon existing CustomerCard component and mock customer data structure, integrating with Next.js API routes and service layer architecture
- **Users**: Dashboard administrators and customer success managers who need to maintain accurate customer records and health metrics
- **Usage Scenarios**: Creating new customer profiles, updating customer information, viewing customer details, removing inactive customers, bulk operations for customer management

### Requirements

#### Functional Requirements
- **Create**: Add new customers with all required fields (name, company, healthScore) and optional fields (email, subscriptionTier, domains, timestamps)
- **Read**: Retrieve individual customers by ID and list all customers with filtering/search capabilities
- **Update**: Modify existing customer records with validation and optimistic UI updates
- **Delete**: Remove customers with confirmation dialogs and soft delete options
- **Validation**: Input validation for all customer fields with proper error handling
- **Search/Filter**: Search customers by name, company, or email with real-time filtering
- **Bulk Operations**: Multi-select for batch updates and deletions

#### User Interface Requirements
- **Integration with CustomerCard**: Seamless integration with existing CustomerCard component for display
- **Customer Form**: Modal or dedicated form component for create/edit operations
- **Customer List**: Grid or list view that incorporates CustomerCard components
- **Delete Confirmation**: Modal dialogs for delete confirmation with clear warnings
- **Loading States**: Proper loading indicators during async operations
- **Error States**: User-friendly error messages and retry mechanisms
- **Responsive Design**: Mobile-first approach with breakpoints at 640px, 768px, 1024px
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support

#### Data Requirements
- **Customer Interface Compliance**: Strict adherence to existing Customer interface from `@/data/mock-customers.ts`
- **Validation Rules**:
  - `name`: Required, 2-100 characters, no special characters
  - `company`: Required, 2-100 characters
  - `healthScore`: Required, number 0-100
  - `email`: Optional, valid email format
  - `subscriptionTier`: Optional, enum ('basic' | 'premium' | 'enterprise')
  - `domains`: Optional, array of valid domain names
  - `id`: Auto-generated UUID
  - `createdAt`/`updatedAt`: Auto-managed ISO timestamps
- **Data Integrity**: Ensure no duplicate customers by name+company combination
- **Health Score Handling**: Proper handling of edge cases (null, NaN, out of range values)

#### Integration Requirements
- **Service Layer**: CustomerService class for business logic abstraction
- **API Layer**: Next.js Route Handlers at `/api/customers` with full REST operations
- **State Management**: React state with optimistic updates and error recovery
- **Mock Data Integration**: Seamless transition from mock data to service-based data
- **CustomerCard Integration**: Maintain full compatibility with existing CustomerCard props and behavior

### Constraints

#### Technical Stack and Frameworks
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with existing utility classes and design tokens
- **State Management**: React hooks (useState, useOptimistic, useEffect)
- **Data Handling**: Service layer pattern with repository abstraction
- **API**: Next.js Route Handlers with proper HTTP methods and status codes

#### Performance Requirements
- **Initial Load**: Customer list renders within 200ms for up to 100 customers
- **Search Performance**: Real-time search with debouncing (300ms delay)
- **Form Submission**: Create/update operations complete within 500ms
- **Optimistic Updates**: Immediate UI feedback with proper error rollback

#### Design Constraints
- **Responsive Breakpoints**: 
  - Mobile: 320px-639px (1 column)
  - Tablet: 640px-1023px (2 columns)
  - Desktop: 1024px+ (3-4 columns)
- **Component Size Limits**: CustomerCard max-width of 400px, height auto-adjusting
- **Modal Constraints**: Max-width 600px, mobile-responsive with full-screen on small devices
- **Color Scheme**: Consistent with existing CustomerCard health score colors

#### File Structure and Naming Conventions
```
src/
├── services/
│   ├── CustomerService.ts          # Main service class
│   └── types/
│       └── customer-service.ts     # Service-specific types
├── components/
│   ├── CustomerForm.tsx            # Create/Edit form component
│   ├── CustomerList.tsx            # List component with CustomerCard
│   ├── DeleteCustomerDialog.tsx    # Confirmation dialog
│   └── customer/                   # Customer-specific components
├── app/api/customers/
│   ├── route.ts                    # GET, POST endpoints
│   └── [id]/
│       └── route.ts                # GET, PUT, DELETE by ID
└── hooks/
    └── useCustomers.ts             # Custom hook for customer operations
```

#### Props Interface and TypeScript Definitions
```typescript
// Service Layer Types
interface CustomerServiceInterface {
  getAll(): Promise<Customer[]>
  getById(id: string): Promise<Customer | null>
  create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>
  update(id: string, updates: Partial<Customer>): Promise<Customer>
  delete(id: string): Promise<void>
  search(query: string): Promise<Customer[]>
}

// Form Component Props
interface CustomerFormProps {
  customer?: Customer
  mode: 'create' | 'edit'
  onSubmit: (customer: Customer) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

// List Component Props
interface CustomerListProps {
  customers: Customer[]
  onCustomerSelect?: (customer: Customer) => void
  onCustomerEdit?: (customer: Customer) => void
  onCustomerDelete?: (customer: Customer) => void
  selectionMode?: 'single' | 'multi'
  searchQuery?: string
  isLoading?: boolean
}
```

#### Security Considerations
- **Input Sanitization**: All user inputs sanitized before processing
- **CSRF Protection**: Built-in Next.js CSRF protection for API routes
- **Rate Limiting**: Basic rate limiting for API endpoints (100 requests/minute per IP)
- **Data Validation**: Server-side validation matching client-side rules
- **Error Information**: No sensitive information exposed in error messages

### Acceptance Criteria

#### Core CRUD Operations
- [ ] **Create Customer**: Successfully create new customer with all required fields
- [ ] **Create Customer Validation**: Reject invalid data with clear error messages
- [ ] **Read Single Customer**: Retrieve customer by ID with proper error handling for not found
- [ ] **Read All Customers**: List all customers with proper loading states
- [ ] **Update Customer**: Modify existing customer with optimistic updates
- [ ] **Update Validation**: Validate updates and handle conflicts gracefully
- [ ] **Delete Customer**: Remove customer with confirmation dialog
- [ ] **Delete Safety**: Prevent accidental deletions with proper warnings

#### Edge Cases Handled
- [ ] **Duplicate Prevention**: Prevent duplicate customers (name + company combination)
- [ ] **Invalid Health Scores**: Handle null, NaN, and out-of-range health scores gracefully
- [ ] **Network Errors**: Graceful handling of network failures with retry options
- [ ] **Concurrent Updates**: Handle concurrent modification conflicts
- [ ] **Empty States**: Proper empty state displays when no customers exist
- [ ] **Loading States**: Consistent loading indicators across all operations
- [ ] **Form Validation**: Real-time validation with debounced error messages

#### User Experience Validated
- [ ] **Accessibility**: Full keyboard navigation and screen reader compatibility
- [ ] **Responsive Design**: Proper layout and functionality across all screen sizes
- [ ] **Performance**: Meets performance requirements for loading and operations
- [ ] **Error Recovery**: Users can recover from errors without losing data
- [ ] **Optimistic Updates**: Immediate feedback with proper error rollback
- [ ] **Search Experience**: Real-time search with proper debouncing and results highlighting
- [ ] **Form UX**: Clear form labels, validation messages, and submission feedback

#### Integration Points Verified
- [ ] **CustomerCard Integration**: Existing CustomerCard component works seamlessly
- [ ] **Service Layer**: CustomerService properly abstracts data operations
- [ ] **API Integration**: Route handlers function correctly with proper status codes
- [ ] **State Management**: React state updates correctly across components
- [ ] **Type Safety**: Full TypeScript coverage with no `any` types
- [ ] **Mock Data Compatibility**: Seamless integration with existing mock customer data
- [ ] **Component Reusability**: Components can be easily reused in other parts of the application