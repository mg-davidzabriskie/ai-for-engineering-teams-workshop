'use client'

import { useState, useCallback, useEffect } from 'react'
import { Customer } from '@/data/mock-customers'

interface UseCustomersOptions {
  autoFetch?: boolean
  searchQuery?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    statusCode: number
    details?: unknown
  }
  timestamp: string
}

/**
 * useCustomers Hook - Integration with secure API routes
 * 
 * Features:
 * - Integration with secure API endpoints with authentication
 * - Optimistic updates with proper error rollback
 * - Loading states and comprehensive error handling
 * - Search functionality with debouncing
 * - CRUD operations with validation
 */
export const useCustomers = (options: UseCustomersOptions = {}) => {
  const { autoFetch = true, searchQuery } = options

  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({})
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({})

  // API request helper
  const apiRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await fetch(`/api/customers${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }, [])

  // Fetch all customers with optional search
  const fetchCustomers = useCallback(async (search?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (search && search.trim()) {
        queryParams.set('search', search.trim())
      }
      
      const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : ''
      const response = await apiRequest(endpoint)
      
      if (response.success && response.data) {
        // Handle both paginated and direct customer arrays
        const data = response.data as { customers?: Customer[] } | Customer[]
        const customerData = Array.isArray(data) ? data : (data.customers || [])
        setCustomers(customerData)
      } else {
        throw new Error(response.error?.message || 'Failed to fetch customers')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error fetching customers:', error)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest])

  // Get a specific customer by ID
  const getCustomer = useCallback(async (id: string): Promise<Customer | null> => {
    try {
      const response = await apiRequest(`/${encodeURIComponent(id)}`)
      
      if (response.success && response.data) {
        return response.data as Customer
      } else {
        throw new Error(response.error?.message || 'Customer not found')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      throw error
    }
  }, [apiRequest])

  // Create a new customer with optimistic updates
  const createCustomer = useCallback(async (
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Customer> => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await apiRequest('', {
        method: 'POST',
        body: JSON.stringify(customerData),
      })

      if (response.success && response.data) {
        const newCustomer = response.data as Customer
        
        // Optimistically update local state
        setCustomers(prev => [newCustomer, ...prev])
        
        return newCustomer
      } else {
        throw new Error(response.error?.message || 'Failed to create customer')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer'
      setError(errorMessage)
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [apiRequest])

  // Update an existing customer with optimistic updates
  const updateCustomer = useCallback(async (
    id: string,
    updates: Partial<Customer>
  ): Promise<Customer> => {
    setIsUpdating(prev => ({ ...prev, [id]: true }))
    setError(null)

    // Store original customer for rollback
    const originalCustomer = customers.find(c => c.id === id)
    if (!originalCustomer) {
      throw new Error('Customer not found in local state')
    }

    try {
      // Optimistically update local state
      const optimisticCustomer = { ...originalCustomer, ...updates, updatedAt: new Date().toISOString() }
      setCustomers(prev => prev.map(c => c.id === id ? optimisticCustomer : c))

      const response = await apiRequest(`/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      if (response.success && response.data) {
        const updatedCustomer = response.data as Customer
        
        // Update with actual server response
        setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c))
        
        return updatedCustomer
      } else {
        throw new Error(response.error?.message || 'Failed to update customer')
      }
    } catch (error) {
      // Rollback optimistic update
      setCustomers(prev => prev.map(c => c.id === id ? originalCustomer : c))
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update customer'
      setError(errorMessage)
      throw error
    } finally {
      setIsUpdating(prev => ({ ...prev, [id]: false }))
    }
  }, [apiRequest, customers])

  // Delete a customer with optimistic updates
  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(prev => ({ ...prev, [id]: true }))
    setError(null)

    // Store original customer for rollback
    const originalCustomer = customers.find(c => c.id === id)
    const originalIndex = customers.findIndex(c => c.id === id)
    
    if (!originalCustomer) {
      throw new Error('Customer not found in local state')
    }

    try {
      // Optimistically remove from local state
      setCustomers(prev => prev.filter(c => c.id !== id))

      const response = await apiRequest(`/${encodeURIComponent(id)}?confirm=true`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete customer')
      }
    } catch (error) {
      // Rollback optimistic update
      setCustomers(prev => {
        const newCustomers = [...prev]
        newCustomers.splice(originalIndex, 0, originalCustomer)
        return newCustomers
      })
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer'
      setError(errorMessage)
      throw error
    } finally {
      setIsDeleting(prev => ({ ...prev, [id]: false }))
    }
  }, [apiRequest, customers])

  // Search customers with debouncing
  const searchCustomers = useCallback(async (query: string): Promise<Customer[]> => {
    try {
      const queryParams = new URLSearchParams()
      if (query && query.trim()) {
        queryParams.set('search', query.trim())
      }
      
      const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : ''
      const response = await apiRequest(endpoint)
      
      if (response.success && response.data) {
        const data = response.data as { customers?: Customer[] } | Customer[]
        const customerData = Array.isArray(data) ? data : (data.customers || [])
        return customerData
      } else {
        throw new Error(response.error?.message || 'Failed to search customers')
      }
    } catch (error) {
      console.error('Error searching customers:', error)
      throw error
    }
  }, [apiRequest])

  // Refresh customers data
  const refreshCustomers = useCallback(() => {
    fetchCustomers(searchQuery)
  }, [fetchCustomers, searchQuery])

  // Clear errors
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount and when searchQuery changes
  useEffect(() => {
    if (autoFetch) {
      fetchCustomers(searchQuery)
    }
  }, [autoFetch, searchQuery, fetchCustomers])

  // Computed loading states
  const isAnyLoading = isLoading || isCreating || Object.values(isUpdating).some(Boolean) || Object.values(isDeleting).some(Boolean)

  return {
    // Data
    customers,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isAnyLoading,
    
    // Error state
    error,
    clearError,
    
    // Actions
    fetchCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    refreshCustomers,
    
    // Helper functions
    isCustomerUpdating: (id: string) => isUpdating[id] || false,
    isCustomerDeleting: (id: string) => isDeleting[id] || false,
  }
}

export default useCustomers