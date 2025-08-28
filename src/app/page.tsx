'use client';

import { Suspense, useState } from 'react';
import { CustomerCard } from '@/components/CustomerCard';
import { CustomerSelector } from '@/components/CustomerSelector';
import { CustomerManagement } from '@/components/CustomerManagement';
import { mockCustomers, Customer } from '@/data/mock-customers';

// Market Intelligence Widget - Dynamic import with error boundary
const MarketIntelligenceWidget = (() => {
  try {
    const module = require('@/components/MarketIntelligenceWidget');
    return module.MarketIntelligenceWidget;
  } catch {
    return null;
  }
})();

// const CustomerCardDemo = () => {
//   return (
//     <div className="space-y-4">
//       <p className="text-green-600 text-sm font-medium">✅ CustomerCard implemented!</p>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {mockCustomers.slice(0, 6).map((customer) => (
//           <CustomerCard 
//             key={customer.id} 
//             customer={customer}
//             onClick={(customer) => console.log('Selected:', customer.name)}
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

const CustomerSelectorDemo = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectionMode, setSelectionMode] = useState<'single' | 'multi'>('single');
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);

  const handleSingleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    console.log('Selected customer:', customer.name, 'from', customer.company);
  };

  const handleMultiCustomerSelect = (customers: Customer[]) => {
    setSelectedCustomers(customers);
    console.log('Selected customers:', customers.map(c => `${c.name} (${c.company})`).join(', '));
  };

  const toggleMode = () => {
    const newMode = selectionMode === 'single' ? 'multi' : 'single';
    setSelectionMode(newMode);
    // Clear selections when switching modes
    setSelectedCustomer(null);
    setSelectedCustomers([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-green-600 text-sm font-medium">✅ CustomerSelector with multi-select implemented!</p>
        <button
          onClick={toggleMode}
          className="
            px-3 py-2 text-sm font-medium rounded-lg border
            transition-colors duration-200
            bg-white border-gray-300 text-gray-700
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          Mode: {selectionMode === 'single' ? 'Single Select' : 'Multi Select'}
        </button>
      </div>
      
      {selectionMode === 'single' && selectedCustomer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {selectedCustomer.name} from {selectedCustomer.company} 
            (Health Score: {selectedCustomer.healthScore})
          </p>
        </div>
      )}
      
      {selectionMode === 'multi' && selectedCustomers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Selected {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''}:</strong>
          </p>
          <div className="space-y-1">
            {selectedCustomers.map((customer, index) => (
              <p key={customer.id} className="text-sm text-blue-700">
                {index + 1}. {customer.name} from {customer.company} (Health: {customer.healthScore})
              </p>
            ))}
          </div>
        </div>
      )}
      
      <CustomerSelector
        customers={mockCustomers}
        selectionMode={selectionMode}
        selectedCustomerId={selectedCustomer?.id}
        selectedCustomerIds={selectedCustomers.map(c => c.id)}
        onCustomerSelect={handleSingleCustomerSelect}
        onCustomerSelectionChange={handleMultiCustomerSelect}
      />
    </div>
  );
};

const DashboardWidgetDemo = ({ widgetName, exerciseNumber }: { widgetName: string, exerciseNumber: number }) => {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
      {widgetName}
      <br />
      <span className="text-xs">Exercise {exerciseNumber}</span>
    </div>
  );
};

export default function Home() {
  // State for tracking selected customer across components
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const handleSelectedCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Customer Intelligence Dashboard
        </h1>
        <p className="text-gray-600">
          AI for Engineering Teams Workshop - Your Progress
        </p>
      </header>

      {/* Progress Indicator */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Workshop Progress</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>✅ Setup Complete - Next.js app is running</p>
          <p className="text-green-600">✅ Exercise 3: CustomerCard component implemented</p>
          <p className="text-green-600">✅ Exercise 4: CustomerSelector with multi-select completed</p>
          <p className="text-green-600">✅ Customer Management: CRUD operations with secure API</p>
          <p className="text-green-600">✅ Exercise 6: Market Intelligence Widget integrated</p>
          <p className="text-gray-400">⏳ Exercise 5: Domain Health widget</p>
          <p className="text-gray-400">⏳ Exercise 9: Production-ready features</p>
        </div>
      </div>

      {/* Component Showcase Area */}
      <div className="space-y-8">
        {/* Customer Management Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Management System</h3>
          <p className="text-sm text-gray-600 mb-4">
            Complete customer CRUD operations with secure API integration, authentication, and validation.
            {selectedCustomer && (
              <span className="block mt-2 text-blue-600 font-medium">
                Currently selected: {selectedCustomer.name} from {selectedCustomer.company}
              </span>
            )}
          </p>
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading customer management...</span>
            </div>
          }>
            <CustomerManagement 
              selectedCustomer={selectedCustomer}
              onSelectedCustomerChange={handleSelectedCustomerChange}
            />
          </Suspense>
        </section>
        {/* CustomerCard Section */}
        {/* <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">CustomerCard Component</h3>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <CustomerCardDemo />
          </Suspense>
        </section> */}

        {/* CustomerSelector Section */}
        {/* <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">CustomerSelector Component</h3>
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <CustomerSelectorDemo />
          </Suspense>
        </section> */}

        {/* Dashboard Widgets Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Dashboard Widgets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardWidgetDemo widgetName="Domain Health Widget" exerciseNumber={5} />
            {/* Market Intelligence Widget - Show implemented version if available */}
            {MarketIntelligenceWidget ? (
              <div className="space-y-2">
                <p className="text-green-600 text-sm font-medium">✅ Market Intelligence Widget implemented!</p>
                {selectedCustomer && (
                  <p className="text-blue-600 text-xs">
                    Showing data for: {selectedCustomer.company}
                  </p>
                )}
                <Suspense fallback={
                  <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                }>
                  <MarketIntelligenceWidget 
                    className="border border-gray-200 rounded-lg"
                    company={selectedCustomer?.company || "Acme Corp"}
                  />
                </Suspense>
              </div>
            ) : (
              <DashboardWidgetDemo widgetName="Market Intelligence" exerciseNumber={6} />
            )}
            <DashboardWidgetDemo widgetName="Predictive Alerts" exerciseNumber={8} />
          </div>
        </section>

        {/* Security & Features Info */}
        <section className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">🔒 Security Features Implemented</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
            <div>
              <h4 className="font-medium mb-2">Authentication & Authorization</h4>
              <ul className="space-y-1 text-green-700">
                <li>✅ JWT token authentication</li>
                <li>✅ Role-based permissions</li>
                <li>✅ Secure API endpoints</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Input Protection</h4>
              <ul className="space-y-1 text-green-700">
                <li>✅ XSS prevention</li>
                <li>✅ SSRF protection</li>
                <li>✅ Rate limiting</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4">💡 Run `node demo-auth.js` to generate test tokens</p>
        </section>

        {/* Getting Started */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🎉 Customer Management Complete!</h3>
          <p className="text-blue-800 mb-4">
            Full-featured customer management system with secure CRUD operations, authentication, and modern UI components.
          </p>
          <div className="text-sm text-blue-700">
            <p className="mb-1"><strong>Components:</strong> AddCustomerForm, CustomerList, CustomerCard integration</p>
            <p className="mb-1"><strong>Security:</strong> JWT auth, input validation, SSRF protection, rate limiting</p>
            <p className="mb-1"><strong>Accessibility:</strong> WCAG 2.1 AA compliant with keyboard navigation</p>
            <p className="text-xs text-blue-600 mt-2">💡 Try creating, editing, and managing customers above!</p>
          </div>
        </section>
      </div>
    </div>
  );
}
