'use client'

import { useState, useRef, FormEvent, ChangeEvent } from 'react'
import { Customer } from '@/data/mock-customers'

interface AddCustomerFormProps {
  onSubmit: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCancel: () => void
  customer?: Customer  // For edit mode
  isLoading?: boolean
  className?: string
}

interface FormErrors {
  name?: string
  company?: string
  healthScore?: string
  email?: string
  subscriptionTier?: string
  domains?: string
  general?: string
}

interface FormData {
  name: string
  company: string
  healthScore: string
  email: string
  subscriptionTier: 'basic' | 'premium' | 'enterprise' | ''
  domains: string
}

/**
 * AddCustomerForm - Comprehensive form for creating or editing customers
 * 
 * Features:
 * - Real-time validation with proper error handling
 * - Integration with secure API routes
 * - WCAG 2.1 AA accessibility compliance
 * - Mobile-responsive design
 * - Form fields match Customer interface requirements
 * - Supports both create and edit modes
 */
export const AddCustomerForm = ({ 
  onSubmit, 
  onCancel, 
  customer, 
  isLoading = false, 
  className = '' 
}: AddCustomerFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: customer?.name || '',
    company: customer?.company || '',
    healthScore: customer?.healthScore?.toString() || '',
    email: customer?.email || '',
    subscriptionTier: customer?.subscriptionTier || '',
    domains: customer?.domains?.join(', ') || ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const formRef = useRef<HTMLFormElement>(null)

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'Name is required'
    if (name.length < 2) return 'Name must be at least 2 characters'
    if (name.length > 100) return 'Name must be no more than 100 characters'
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) return 'Name contains invalid characters'
    return undefined
  }

  const validateCompany = (company: string): string | undefined => {
    if (!company.trim()) return 'Company is required'
    if (company.length < 2) return 'Company name must be at least 2 characters'
    if (company.length > 100) return 'Company name must be no more than 100 characters'
    return undefined
  }

  const validateHealthScore = (score: string): string | undefined => {
    if (!score.trim()) return 'Health score is required'
    const numScore = Number(score)
    if (isNaN(numScore)) return 'Health score must be a valid number'
    if (numScore < 0) return 'Health score cannot be negative'
    if (numScore > 100) return 'Health score cannot exceed 100'
    return undefined
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return undefined // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    if (email.length > 255) return 'Email address is too long'
    return undefined
  }

  const validateDomains = (domainsString: string): string | undefined => {
    if (!domainsString.trim()) return undefined // Domains are optional
    
    const domains = domainsString.split(',').map(d => d.trim()).filter(d => d.length > 0)
    if (domains.length > 10) return 'Maximum 10 domains allowed'
    
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/
    
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i].toLowerCase()
      if (domain.length > 255) return `Domain "${domain}" is too long`
      if (!domainRegex.test(domain)) return `Invalid domain format: "${domain}"`
    }
    
    return undefined
  }

  const validateForm = (): FormErrors => {
    return {
      name: validateName(formData.name),
      company: validateCompany(formData.company),
      healthScore: validateHealthScore(formData.healthScore),
      email: validateEmail(formData.email),
      domains: validateDomains(formData.domains)
    }
  }

  // Real-time validation on field change
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear previous error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    
    // Validate field if it has been touched
    if (touched[field]) {
      let fieldError: string | undefined
      switch (field) {
        case 'name':
          fieldError = validateName(value)
          break
        case 'company':
          fieldError = validateCompany(value)
          break
        case 'healthScore':
          fieldError = validateHealthScore(value)
          break
        case 'email':
          fieldError = validateEmail(value)
          break
        case 'domains':
          fieldError = validateDomains(value)
          break
      }
      
      if (fieldError) {
        setErrors(prev => ({ ...prev, [field]: fieldError }))
      }
    }
  }

  const handleFieldBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validate field on blur
    let fieldError: string | undefined
    switch (field) {
      case 'name':
        fieldError = validateName(formData[field])
        break
      case 'company':
        fieldError = validateCompany(formData[field])
        break
      case 'healthScore':
        fieldError = validateHealthScore(formData[field])
        break
      case 'email':
        fieldError = validateEmail(formData[field])
        break
      case 'domains':
        fieldError = validateDomains(formData[field])
        break
    }
    
    if (fieldError) {
      setErrors(prev => ({ ...prev, [field]: fieldError }))
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      name: true,
      company: true,
      healthScore: true,
      email: true,
      domains: true
    })

    // Validate all fields
    const formErrors = validateForm()
    const hasErrors = Object.values(formErrors).some(error => error !== undefined)
    
    if (hasErrors) {
      setErrors(formErrors)
      
      // Focus first field with error
      const firstErrorField = Object.keys(formErrors).find(field => formErrors[field as keyof FormErrors])
      if (firstErrorField && formRef.current) {
        const errorElement = formRef.current.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
        errorElement?.focus()
      }
      return
    }

    try {
      // Prepare data for submission
      const submissionData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        company: formData.company.trim(),
        healthScore: Number(formData.healthScore),
        email: formData.email.trim() || undefined,
        subscriptionTier: formData.subscriptionTier || undefined,
        domains: formData.domains.trim() 
          ? formData.domains.split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
          : undefined
      }

      await onSubmit(submissionData)
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ general: 'Failed to create customer. Please try again.' })
    }
  }

  const handleCancel = () => {
    if (isLoading) return // Prevent cancel during submission
    onCancel()
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </h2>
        <p className="text-gray-600">
          {customer ? 'Update the customer details below.' : 'Fill in the customer details below.'} Required fields are marked with an asterisk (*).
        </p>
      </div>

      {errors.general && (
        <div 
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {errors.general}
              </p>
            </div>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div>
            <label 
              htmlFor="name" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Customer Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              disabled={isLoading}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm px-3 py-2
                text-gray-900 placeholder-gray-400
                focus:border-blue-500 focus:ring-blue-500 
                disabled:bg-gray-50 disabled:text-gray-500
                ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="Enter customer name"
              maxLength={100}
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600" id="name-error" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Company Field */}
          <div>
            <label 
              htmlFor="company" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company *
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('company', e.target.value)}
              onBlur={() => handleFieldBlur('company')}
              disabled={isLoading}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm px-3 py-2
                text-gray-900 placeholder-gray-400
                focus:border-blue-500 focus:ring-blue-500 
                disabled:bg-gray-50 disabled:text-gray-500
                ${errors.company ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="Enter company name"
              maxLength={100}
              aria-describedby={errors.company ? 'company-error' : undefined}
              aria-invalid={!!errors.company}
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600" id="company-error" role="alert">
                {errors.company}
              </p>
            )}
          </div>

          {/* Health Score Field */}
          <div>
            <label 
              htmlFor="healthScore" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Health Score (0-100) *
            </label>
            <input
              type="number"
              id="healthScore"
              name="healthScore"
              min="0"
              max="100"
              step="1"
              value={formData.healthScore}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('healthScore', e.target.value)}
              onBlur={() => handleFieldBlur('healthScore')}
              disabled={isLoading}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm px-3 py-2
                text-gray-900 placeholder-gray-400
                focus:border-blue-500 focus:ring-blue-500 
                disabled:bg-gray-50 disabled:text-gray-500
                ${errors.healthScore ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="0"
              aria-describedby={errors.healthScore ? 'healthScore-error' : 'healthScore-help'}
              aria-invalid={!!errors.healthScore}
            />
            {errors.healthScore ? (
              <p className="mt-1 text-sm text-red-600" id="healthScore-error" role="alert">
                {errors.healthScore}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500" id="healthScore-help">
                Customer health metric from 0 (poor) to 100 (excellent)
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              disabled={isLoading}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm px-3 py-2
                text-gray-900 placeholder-gray-400
                focus:border-blue-500 focus:ring-blue-500 
                disabled:bg-gray-50 disabled:text-gray-500
                ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="customer@example.com"
              maxLength={255}
              aria-describedby={errors.email ? 'email-error' : 'email-help'}
              aria-invalid={!!errors.email}
            />
            {errors.email ? (
              <p className="mt-1 text-sm text-red-600" id="email-error" role="alert">
                {errors.email}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500" id="email-help">
                Optional - Customer&apos;s primary email address
              </p>
            )}
          </div>

          {/* Subscription Tier Field */}
          <div>
            <label 
              htmlFor="subscriptionTier" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subscription Tier
            </label>
            <select
              id="subscriptionTier"
              name="subscriptionTier"
              value={formData.subscriptionTier}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('subscriptionTier', e.target.value)}
              onBlur={() => handleFieldBlur('subscriptionTier')}
              disabled={isLoading}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm px-3 py-2
                text-gray-900
                focus:border-blue-500 focus:ring-blue-500 
                disabled:bg-gray-50 disabled:text-gray-500
                ${errors.subscriptionTier ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              aria-describedby="subscriptionTier-help"
            >
              <option value="">Select tier (optional)</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <p className="mt-1 text-sm text-gray-500" id="subscriptionTier-help">
              Optional - Customer&apos;s subscription level
            </p>
          </div>

          {/* Domains Field */}
          <div className="md:col-span-2">
            <label 
              htmlFor="domains" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Domains
            </label>
            <input
              type="text"
              id="domains"
              name="domains"
              value={formData.domains}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('domains', e.target.value)}
              onBlur={() => handleFieldBlur('domains')}
              disabled={isLoading}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm px-3 py-2
                text-gray-900 placeholder-gray-400
                focus:border-blue-500 focus:ring-blue-500 
                disabled:bg-gray-50 disabled:text-gray-500
                ${errors.domains ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              placeholder="example.com, app.example.com"
              aria-describedby={errors.domains ? 'domains-error' : 'domains-help'}
              aria-invalid={!!errors.domains}
            />
            {errors.domains ? (
              <p className="mt-1 text-sm text-red-600" id="domains-error" role="alert">
                {errors.domains}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500" id="domains-help">
                Optional - Comma-separated list of customer domains (max 10)
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="
              w-full sm:w-auto px-6 py-2 text-sm font-medium 
              text-gray-700 bg-white border border-gray-300 rounded-md
              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full sm:w-auto px-6 py-2 text-sm font-medium 
              text-white bg-blue-600 border border-transparent rounded-md
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg 
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              customer ? 'Update Customer' : 'Create Customer'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}