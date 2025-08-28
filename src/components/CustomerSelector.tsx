import { useState, useEffect, useMemo, useCallback } from 'react'
import { Customer } from '@/data/mock-customers'
import { CustomerCard } from '@/components/CustomerCard'

type SelectionMode = 'single' | 'multi'

interface CustomerSelectorProps {
  customers: Customer[]
  // Single select props (backward compatibility)
  selectedCustomerId?: string
  onCustomerSelect?: (customer: Customer) => void
  // Multi select props
  selectionMode?: SelectionMode
  selectedCustomerIds?: string[]
  onCustomerSelectionChange?: (customers: Customer[]) => void
  className?: string
}

/**
 * CustomerSelector component provides customer browsing, searching, and selection functionality
 * @param customers - Array of customer data to display
 * @param selectedCustomerId - ID of currently selected customer (single mode)
 * @param onCustomerSelect - Callback when a customer is selected (single mode)
 * @param selectionMode - Selection mode: 'single' or 'multi'
 * @param selectedCustomerIds - Array of selected customer IDs (multi mode)
 * @param onCustomerSelectionChange - Callback when selection changes (multi mode)
 * @param className - Additional CSS classes
 */
export const CustomerSelector = ({
  customers,
  selectedCustomerId,
  onCustomerSelect,
  selectionMode = 'single',
  selectedCustomerIds = [],
  onCustomerSelectionChange,
  className = ''
}: CustomerSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Debounce search query to avoid excessive filtering
  useEffect(() => {
    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  /**
   * Filter and sort customers based on search query
   * Searches both name and company fields case-insensitively
   * Sorts results alphabetically by company name
   */
  const filteredCustomers = useMemo(() => {
    let result = customers
    
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase().trim()
      result = customers.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.company.toLowerCase().includes(query)
      )
    }

    // Sort alphabetically by company name
    return result.sort((a, b) => a.company.localeCompare(b.company))
  }, [customers, debouncedQuery])

  /**
   * Handle customer selection for single mode
   */
  const handleSingleSelect = useCallback((customer: Customer) => {
    if (onCustomerSelect) {
      onCustomerSelect(customer)
    }
  }, [onCustomerSelect])

  /**
   * Handle customer selection for multi mode
   */
  const handleMultiSelect = useCallback((customer: Customer) => {
    if (!onCustomerSelectionChange) return

    const isSelected = selectedCustomerIds.includes(customer.id)
    let newSelectedIds: string[]

    if (isSelected) {
      // Remove from selection
      newSelectedIds = selectedCustomerIds.filter(id => id !== customer.id)
    } else {
      // Add to selection
      newSelectedIds = [...selectedCustomerIds, customer.id]
    }

    const selectedCustomers = customers.filter(c => newSelectedIds.includes(c.id))
    onCustomerSelectionChange(selectedCustomers)
  }, [customers, selectedCustomerIds, onCustomerSelectionChange])

  /**
   * Handle customer selection based on mode
   */
  const handleCustomerSelect = selectionMode === 'single' ? handleSingleSelect : handleMultiSelect

  /**
   * Select all customers
   */
  const handleSelectAll = useCallback(() => {
    if (selectionMode === 'multi' && onCustomerSelectionChange) {
      onCustomerSelectionChange(filteredCustomers)
    }
  }, [selectionMode, onCustomerSelectionChange, filteredCustomers])

  /**
   * Clear all selections
   */
  const handleClearAll = useCallback(() => {
    if (selectionMode === 'multi' && onCustomerSelectionChange) {
      onCustomerSelectionChange([])
    }
  }, [selectionMode, onCustomerSelectionChange])

  // Current selection state
  const selectedCount = selectionMode === 'multi' ? selectedCustomerIds.length : (selectedCustomerId ? 1 : 0)
  const isAllSelected = selectionMode === 'multi' && selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0

  /**
   * Clear search query and reset to show all customers
   */
  const clearSearch = () => {
    setSearchQuery('')
    setDebouncedQuery('')
  }

  const hasResults = filteredCustomers.length > 0
  const showEmptyState = !hasResults && debouncedQuery.trim() !== ''

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Search Input Section */}
      <div className="space-y-2" role="search" aria-labelledby="search-heading">
        <div className="sr-only" id="search-heading">Customer Search</div>
        <div className="sr-only" id="search-instructions">
          Type to search customers by name or company. Use arrow keys to navigate results.
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="
              block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg
              placeholder-gray-500 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              sm:text-sm transition-colors duration-200
            "
            placeholder="Search customers by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search customers"
            aria-describedby="search-instructions search-status"
          />
          {/* Loading Spinner or Clear Button */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isSearching ? (
              <svg
                className="motion-safe:animate-spin h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-label="Searching"
                role="status"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : searchQuery ? (
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Clear search"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Search Status and Selection Controls */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span id="search-status" aria-live="polite" aria-atomic="true">
            {isSearching ? (
              'Searching...'
            ) : selectionMode === 'multi' ? (
              `${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''} found • ${selectedCount} selected`
            ) : (
              `${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''} found`
            )}
          </span>
          <div className="flex items-center gap-2">
            {selectionMode === 'multi' && filteredCustomers.length > 0 && (
              <>
                <button
                  onClick={isAllSelected ? handleClearAll : handleSelectAll}
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
                  aria-label={isAllSelected ? 'Deselect all customers' : 'Select all customers'}
                >
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </button>
                {selectedCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedCount} selected
                  </span>
                )}
              </>
            )}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                Show all customers
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {showEmptyState ? (
        /* Empty State */
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20a7.962 7.962 0 01-6-2.709M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No customers match &quot;{debouncedQuery}&quot;. Try a different search term.
          </p>
          <button
            onClick={clearSearch}
            className="
              mt-4 inline-flex items-center px-4 py-2 border border-transparent
              text-sm font-medium rounded-md text-blue-600 bg-blue-50
              hover:bg-blue-100 transition-colors duration-200
            "
          >
            Clear search
          </button>
        </div>
      ) : (
        /* Customer Grid */
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          role="grid"
          aria-label={`Customer ${selectionMode} selection grid`}
        >
          {filteredCustomers.map((customer) => {
            const isSelected = selectionMode === 'single' 
              ? selectedCustomerId === customer.id
              : selectedCustomerIds.includes(customer.id)
            
            return (
              <div
                key={customer.id}
                role="gridcell"
                className={`
                  transition-all duration-200
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                `.trim()}
              >
                <CustomerCard
                  customer={customer}
                  onClick={handleCustomerSelect}
                  isSelected={isSelected}
                  selectedCustomerId={selectionMode === 'single' ? selectedCustomerId : undefined}
                />
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}