'use client'

import { useState, useCallback } from 'react'
import { Customer } from '@/data/mock-customers'
import { AddCustomerForm } from './AddCustomerForm'
import { CustomerList } from './CustomerList'
import { useCustomers } from '@/hooks/useCustomers'

interface CustomerManagementProps {
  className?: string
}

/**
 * CustomerManagement - Example integration component
 * 
 * Demonstrates how AddCustomerForm and CustomerList work together
 * with the secure API infrastructure and existing CustomerCard component.
 * 
 * Features:
 * - Complete CRUD workflow
 * - Modal-based form for adding customers
 * - Integration with secure API endpoints
 * - Error handling and loading states
 * - Responsive design
 */
export const CustomerManagement = ({ className = '' }: CustomerManagementProps) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  
  const {
    customers,
    isLoading,
    isCreating,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearError,
    refreshCustomers,
    isCustomerUpdating
  } = useCustomers({
    autoFetch: true
  })

  // Handle adding a new customer
  const handleAddCustomer = useCallback(async (
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      await createCustomer(customerData)
      setShowAddForm(false)
      // Success feedback could be added here
    } catch (error) {
      // Error is handled by the hook and displayed in the form
      console.error('Failed to create customer:', error)
    }
  }, [createCustomer])

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: Customer) => {
    console.log('Customer selected:', customer)
    // Could navigate to detail view, etc.
  }, [])

  // Handle customer editing
  const handleCustomerEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer)
    clearError()
  }, [clearError])

  // Handle customer deletion
  const handleCustomerDelete = useCallback(async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name} from ${customer.company}?`)) {
      try {
        await deleteCustomer(customer.id)
        // Success feedback could be added here
      } catch (error) {
        console.error('Failed to delete customer:', error)
        // Error feedback could be added here
      }
    }
  }, [deleteCustomer])

  // Handle form cancellation
  const handleFormCancel = useCallback(() => {
    setShowAddForm(false)
    clearError()
  }, [clearError])

  // Handle edit form cancellation
  const handleEditFormCancel = useCallback(() => {
    setEditingCustomer(null)
    clearError()
  }, [clearError])

  // Handle updating a customer
  const handleUpdateCustomer = useCallback(async (
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!editingCustomer) return
    
    try {
      await updateCustomer(editingCustomer.id, customerData)
      setEditingCustomer(null)
      // Success feedback could be added here
    } catch (error) {
      // Error is handled by the hook and displayed in the form
      console.error('Failed to update customer:', error)
    }
  }, [editingCustomer, updateCustomer])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Add Customer Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="mt-1 text-gray-600">
            Manage your customer database with comprehensive CRUD operations
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="
            inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
            text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={isLoading}
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Global Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error occurred
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-3">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    onClick={clearError}
                    className="px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:bg-red-100"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={refreshCustomers}
                    className="ml-3 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:bg-red-100"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer List */}
      <CustomerList
        customers={customers}
        onCustomerSelect={handleCustomerSelect}
        onCustomerEdit={handleCustomerEdit}
        onCustomerDelete={handleCustomerDelete}
        selectionMode="single"
        isLoading={isLoading}
        error={error}
        showSearch={true}
        showFilters={true}
        emptyMessage="No customers found. Add your first customer to get started."
      />

      {/* Add Customer Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-customer-title"
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <AddCustomerForm
              onSubmit={handleAddCustomer}
              onCancel={handleFormCancel}
              isLoading={isCreating}
              className="border-0 shadow-none"
            />
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-customer-title"
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <AddCustomerForm
              customer={editingCustomer}
              onSubmit={handleUpdateCustomer}
              onCancel={handleEditFormCancel}
              isLoading={isCustomerUpdating(editingCustomer.id)}
              className="border-0 shadow-none"
            />
          </div>
        </div>
      )}

      {/* Modal backdrop click handlers */}
      {showAddForm && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleFormCancel}
          aria-hidden="true"
        />
      )}
      {editingCustomer && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleEditFormCancel}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export default CustomerManagement