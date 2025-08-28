'use client'

import { useState, useMemo, useCallback, useRef, ChangeEvent } from 'react'
import { Customer } from '@/data/mock-customers'
import { CustomerCard } from './CustomerCard'

interface CustomerListProps {
  customers: Customer[]
  onCustomerSelect?: (customer: Customer) => void
  onCustomerEdit?: (customer: Customer) => void
  onCustomerDelete?: (customer: Customer) => void
  selectionMode?: 'single' | 'multi' | 'none'
  searchQuery?: string
  isLoading?: boolean
  error?: string | null
  className?: string
  emptyMessage?: string
  showSearch?: boolean
  showFilters?: boolean
}

interface FilterState {
  subscriptionTier: string
  healthScoreRange: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

/**
 * CustomerList - Display customers using existing CustomerCard components
 * 
 * Features:
 * - Integration with existing CustomerCard props and functionality
 * - Search and filtering capabilities with debounced input
 * - Loading states and comprehensive error handling
 * - WCAG 2.1 AA accessibility compliance
 * - Mobile-responsive grid layout
 * - Multi-select support with bulk actions
 */
export const CustomerList = ({
  customers,
  onCustomerSelect,
  onCustomerEdit,
  onCustomerDelete,
  selectionMode = 'single',
  searchQuery: externalSearchQuery,
  isLoading = false,
  error = null,
  className = '',
  emptyMessage = 'No customers found.',
  showSearch = true,
  showFilters = true
}: CustomerListProps) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterState>({
    subscriptionTier: '',
    healthScoreRange: '',
    sortBy: 'name',
    sortOrder: 'asc'
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Use external search query if provided, otherwise use internal state
  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery

  // Debounced search functionality
  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers]

    // Apply search filter
    if (activeSearchQuery && activeSearchQuery.trim()) {
      const searchTerm = activeSearchQuery.toLowerCase().trim()
      result = result.filter(customer => {
        const searchableFields = [
          customer.name?.toLowerCase() || '',
          customer.company?.toLowerCase() || '',
          customer.email?.toLowerCase() || '',
          customer.subscriptionTier?.toLowerCase() || '',
          ...(customer.domains || []).map(d => d.toLowerCase())
        ]
        return searchableFields.some(field => field.includes(searchTerm))
      })
    }

    // Apply subscription tier filter
    if (filters.subscriptionTier) {
      result = result.filter(customer => 
        customer.subscriptionTier === filters.subscriptionTier
      )
    }

    // Apply health score range filter
    if (filters.healthScoreRange) {
      result = result.filter(customer => {
        const score = customer.healthScore || 0
        switch (filters.healthScoreRange) {
          case 'poor': return score >= 0 && score <= 30
          case 'moderate': return score >= 31 && score <= 70
          case 'good': return score >= 71 && score <= 100
          default: return true
        }
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof Customer] || ''
      let bValue: any = b[filters.sortBy as keyof Customer] || ''

      // Handle health score sorting
      if (filters.sortBy === 'healthScore') {
        aValue = a.healthScore || 0
        bValue = b.healthScore || 0
      }
      
      // Handle string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      // Handle date comparisons
      if (filters.sortBy === 'createdAt' || filters.sortBy === 'updatedAt') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [customers, activeSearchQuery, filters])

  // Handle customer selection
  const handleCustomerClick = useCallback((customer: Customer) => {
    if (selectionMode === 'none') {
      return
    }

    if (selectionMode === 'single') {
      setSelectedCustomers(new Set([customer.id]))
      onCustomerSelect?.(customer)
    } else if (selectionMode === 'multi') {
      setSelectedCustomers(prev => {
        const newSelection = new Set(prev)
        if (newSelection.has(customer.id)) {
          newSelection.delete(customer.id)
        } else {
          newSelection.add(customer.id)
        }
        return newSelection
      })
      onCustomerSelect?.(customer)
    }
  }, [selectionMode, onCustomerSelect])

  // Handle search input change
  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    // Only update internal search if external search is not provided
    if (externalSearchQuery === undefined) {
      setInternalSearchQuery(e.target.value)
    }
  }, [externalSearchQuery])

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      subscriptionTier: '',
      healthScoreRange: '',
      sortBy: 'name',
      sortOrder: 'asc'
    })
    if (externalSearchQuery === undefined) {
      setInternalSearchQuery('')
    }
    setSelectedCustomers(new Set())
  }, [externalSearchQuery])

  // Select all customers
  const selectAllCustomers = useCallback(() => {
    if (selectionMode !== 'multi') return
    setSelectedCustomers(new Set(filteredAndSortedCustomers.map(c => c.id)))
  }, [selectionMode, filteredAndSortedCustomers])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCustomers(new Set())
  }, [])

  // Get unique subscription tiers for filter dropdown
  const availableSubscriptionTiers = useMemo(() => {
    const tiers = new Set(customers.map(c => c.subscriptionTier).filter(Boolean))
    return Array.from(tiers).sort()
  }, [customers])

  // Loading state
  if (isLoading) {
    return (
      <div className={`${className}`} role="status" aria-live="polite">
        <div className="space-y-4">
          {/* Search skeleton */}
          {showSearch && (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded-md"></div>
            </div>
          )}
          
          {/* Filter skeleton */}
          {showFilters && (
            <div className="animate-pulse flex gap-4">
              <div className="h-10 bg-gray-200 rounded-md flex-1 max-w-xs"></div>
              <div className="h-10 bg-gray-200 rounded-md flex-1 max-w-xs"></div>
            </div>
          )}
          
          {/* Customer cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-40"></div>
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">Loading customers...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`${className}`} role="alert">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading customers
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Search and Filters Section */}
      {(showSearch || showFilters) && (
        <div className="mb-6 space-y-4">
          {/* Search Input */}
          {showSearch && (
            <div className="relative">
              <label htmlFor="customer-search" className="sr-only">
                Search customers
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  id="customer-search"
                  name="customer-search"
                  value={activeSearchQuery}
                  onChange={handleSearchChange}
                  readOnly={externalSearchQuery !== undefined}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Search customers by name, company, email, or domain..."
                  aria-describedby="search-description"
                />
              </div>
              <p id="search-description" className="sr-only">
                Search through customer names, companies, email addresses, and domains
              </p>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 items-end">
              {/* Subscription Tier Filter */}
              <div className="flex-1 min-w-0 max-w-xs">
                <label htmlFor="subscription-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Tier
                </label>
                <select
                  id="subscription-filter"
                  value={filters.subscriptionTier}
                  onChange={(e) => handleFilterChange('subscriptionTier', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All tiers</option>
                  {availableSubscriptionTiers.map(tier => (
                    <option key={tier} value={tier}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Health Score Range Filter */}
              <div className="flex-1 min-w-0 max-w-xs">
                <label htmlFor="health-score-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Health Score
                </label>
                <select
                  id="health-score-filter"
                  value={filters.healthScoreRange}
                  onChange={(e) => handleFilterChange('healthScoreRange', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All scores</option>
                  <option value="poor">Poor (0-30)</option>
                  <option value="moderate">Moderate (31-70)</option>
                  <option value="good">Good (71-100)</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex-1 min-w-0 max-w-xs">
                <label htmlFor="sort-by-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  id="sort-by-filter"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="company">Company</option>
                  <option value="healthScore">Health Score</option>
                  <option value="createdAt">Date Created</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="flex-1 min-w-0 max-w-xs">
                <label htmlFor="sort-order-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <select
                  id="sort-order-filter"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Summary and Bulk Actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700" aria-live="polite">
            {filteredAndSortedCustomers.length === customers.length ? (
              <span>
                Showing <span className="font-medium">{customers.length}</span> customer{customers.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span>
                Showing <span className="font-medium">{filteredAndSortedCustomers.length}</span> of{' '}
                <span className="font-medium">{customers.length}</span> customer{customers.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>

          {selectionMode === 'multi' && selectedCustomers.size > 0 && (
            <p className="text-sm text-blue-600">
              <span className="font-medium">{selectedCustomers.size}</span> selected
            </p>
          )}
        </div>

        {/* Bulk Actions */}
        {selectionMode === 'multi' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllCustomers}
              disabled={selectedCustomers.size === filteredAndSortedCustomers.length}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Select All
            </button>
            {selectedCustomers.size > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Customer Grid */}
      {filteredAndSortedCustomers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              {activeSearchQuery || filters.subscriptionTier || filters.healthScoreRange
                ? 'No customers match your search'
                : 'No customers found'
              }
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {emptyMessage}
            </p>
            {(activeSearchQuery || filters.subscriptionTier || filters.healthScoreRange) && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear filters to see all customers
              </button>
            )}
          </div>
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          role="grid"
          aria-label="Customer list"
        >
          {filteredAndSortedCustomers.map((customer) => (
            <div key={customer.id} role="gridcell" className="group relative">
              <CustomerCard
                customer={customer}
                onClick={selectionMode !== 'none' ? handleCustomerClick : undefined}
                isSelected={selectedCustomers.has(customer.id)}
                selectionMode={selectionMode}
                className="h-full transition-shadow duration-200 hover:shadow-lg"
              />
              
              {/* Overlay action buttons for edit/delete */}
              {(onCustomerEdit || onCustomerDelete) && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {onCustomerEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCustomerEdit(customer)
                      }}
                      className="p-1.5 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-blue-600 hover:text-blue-700"
                      aria-label={`Edit customer ${customer.name}`}
                      title="Edit customer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {onCustomerDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCustomerDelete(customer)
                      }}
                      className="p-1.5 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-red-600 hover:text-red-700"
                      aria-label={`Delete customer ${customer.name}`}
                      title="Delete customer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}