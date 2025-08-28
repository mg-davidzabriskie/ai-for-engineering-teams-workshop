/**
 * CustomerService - Service layer for customer management operations
 * 
 * Provides a comprehensive abstraction layer for all customer-related CRUD operations,
 * search functionality, and business logic. Designed to integrate seamlessly with
 * existing mock data while being ready for future API integration.
 * 
 * @implements CustomerServiceInterface
 */

import { Customer } from '@/data/mock-customers';
import { mockCustomers } from '@/data/mock-customers';

// Service-specific types and interfaces
export interface CustomerServiceInterface {
  getAll(): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
  update(id: string, updates: Partial<Customer>): Promise<Customer>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Customer[]>;
  validateCustomer(customer: Partial<Customer>): ValidationResult;
  checkDuplicateByNameCompany(name: string, company: string, excludeId?: string): Promise<boolean>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: keyof Customer;
  message: string;
  code: string;
}

export interface ServiceError extends Error {
  code: string;
  statusCode: number;
  details?: any;
}

// Customer service implementation
export class CustomerService implements CustomerServiceInterface {
  private customers: Customer[] = [];
  private nextId: number = 1;

  constructor() {
    // Initialize with mock data and establish proper ID sequence
    this.customers = [...mockCustomers];
    this.nextId = this.calculateNextId();
  }

  /**
   * Calculate the next available ID based on existing customers
   */
  private calculateNextId(): number {
    const numericIds = this.customers
      .map(c => parseInt(c.id))
      .filter(id => !isNaN(id));
    
    return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
  }

  /**
   * Generate a new unique customer ID
   */
  private generateId(): string {
    const id = this.nextId.toString();
    this.nextId++;
    return id;
  }

  /**
   * Normalize health score to ensure it's within valid range
   */
  private normalizeHealthScore(score: number | null | undefined): number {
    if (score === null || score === undefined || isNaN(score)) {
      return 0; // Default to 0 for invalid scores
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Create ISO timestamp string
   */
  private createTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Create a service error with proper typing
   */
  private createServiceError(message: string, code: string, statusCode: number = 500, details?: any): ServiceError {
    const error = new Error(message) as ServiceError;
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    return error;
  }

  /**
   * Retrieve all customers
   */
  async getAll(): Promise<Customer[]> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      return [...this.customers].sort((a, b) => {
        // Sort by creation date, newest first
        const dateA = new Date(a.createdAt || '1970-01-01');
        const dateB = new Date(b.createdAt || '1970-01-01');
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      throw this.createServiceError(
        'Failed to retrieve customers',
        'GET_ALL_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Retrieve a customer by ID
   */
  async getById(id: string): Promise<Customer | null> {
    try {
      if (!id || typeof id !== 'string') {
        throw this.createServiceError(
          'Invalid customer ID provided',
          'INVALID_ID',
          400
        );
      }

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 5));

      const customer = this.customers.find(c => c.id === id);
      return customer ? { ...customer } : null;
    } catch (error) {
      if (error instanceof Error && (error as ServiceError).code) {
        throw error;
      }
      
      throw this.createServiceError(
        `Failed to retrieve customer with ID: ${id}`,
        'GET_BY_ID_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Create a new customer
   */
  async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    try {
      // Validate input data
      const validation = this.validateCustomer(customerData);
      if (!validation.isValid) {
        throw this.createServiceError(
          'Customer validation failed',
          'VALIDATION_FAILED',
          400,
          validation.errors
        );
      }

      // Check for duplicates
      const isDuplicate = await this.checkDuplicateByNameCompany(
        customerData.name,
        customerData.company
      );
      
      if (isDuplicate) {
        throw this.createServiceError(
          `Customer with name "${customerData.name}" and company "${customerData.company}" already exists`,
          'DUPLICATE_CUSTOMER',
          409
        );
      }

      // Create new customer with generated fields
      const now = this.createTimestamp();
      const newCustomer: Customer = {
        ...customerData,
        id: this.generateId(),
        healthScore: this.normalizeHealthScore(customerData.healthScore),
        createdAt: now,
        updatedAt: now
      };

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 20));

      // Add to storage
      this.customers.push(newCustomer);

      return { ...newCustomer };
    } catch (error) {
      if (error instanceof Error && (error as ServiceError).code) {
        throw error;
      }
      
      throw this.createServiceError(
        'Failed to create customer',
        'CREATE_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Update an existing customer
   */
  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      if (!id || typeof id !== 'string') {
        throw this.createServiceError(
          'Invalid customer ID provided',
          'INVALID_ID',
          400
        );
      }

      // Find existing customer
      const existingIndex = this.customers.findIndex(c => c.id === id);
      if (existingIndex === -1) {
        throw this.createServiceError(
          `Customer with ID ${id} not found`,
          'CUSTOMER_NOT_FOUND',
          404
        );
      }

      const existingCustomer = this.customers[existingIndex];

      // Prepare updated data (exclude protected fields)
      const { id: _, createdAt, updatedAt, ...allowedUpdates } = updates;
      const updatedData = { ...existingCustomer, ...allowedUpdates };

      // Validate updated data
      const validation = this.validateCustomer(updatedData);
      if (!validation.isValid) {
        throw this.createServiceError(
          'Customer validation failed',
          'VALIDATION_FAILED',
          400,
          validation.errors
        );
      }

      // Check for duplicates if name or company changed
      if (allowedUpdates.name || allowedUpdates.company) {
        const isDuplicate = await this.checkDuplicateByNameCompany(
          updatedData.name,
          updatedData.company,
          id
        );
        
        if (isDuplicate) {
          throw this.createServiceError(
            `Customer with name "${updatedData.name}" and company "${updatedData.company}" already exists`,
            'DUPLICATE_CUSTOMER',
            409
          );
        }
      }

      // Apply updates
      const finalCustomer: Customer = {
        ...updatedData,
        id: existingCustomer.id,
        createdAt: existingCustomer.createdAt,
        updatedAt: this.createTimestamp(),
        healthScore: this.normalizeHealthScore(updatedData.healthScore)
      };

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 15));

      // Update in storage
      this.customers[existingIndex] = finalCustomer;

      return { ...finalCustomer };
    } catch (error) {
      if (error instanceof Error && (error as ServiceError).code) {
        throw error;
      }
      
      throw this.createServiceError(
        `Failed to update customer with ID: ${id}`,
        'UPDATE_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Delete a customer
   */
  async delete(id: string): Promise<void> {
    try {
      if (!id || typeof id !== 'string') {
        throw this.createServiceError(
          'Invalid customer ID provided',
          'INVALID_ID',
          400
        );
      }

      // Find customer to delete
      const existingIndex = this.customers.findIndex(c => c.id === id);
      if (existingIndex === -1) {
        throw this.createServiceError(
          `Customer with ID ${id} not found`,
          'CUSTOMER_NOT_FOUND',
          404
        );
      }

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Remove from storage
      this.customers.splice(existingIndex, 1);
    } catch (error) {
      if (error instanceof Error && (error as ServiceError).code) {
        throw error;
      }
      
      throw this.createServiceError(
        `Failed to delete customer with ID: ${id}`,
        'DELETE_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Search customers by query string
   */
  async search(query: string): Promise<Customer[]> {
    try {
      if (!query || typeof query !== 'string') {
        return this.getAll();
      }

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 8));

      const searchTerm = query.toLowerCase().trim();
      if (!searchTerm) {
        return this.getAll();
      }

      const results = this.customers.filter(customer => {
        const searchableFields = [
          customer.name?.toLowerCase() || '',
          customer.company?.toLowerCase() || '',
          customer.email?.toLowerCase() || '',
          customer.subscriptionTier?.toLowerCase() || '',
          ...(customer.domains || []).map(d => d.toLowerCase())
        ];

        return searchableFields.some(field => 
          field.includes(searchTerm)
        );
      });

      return results.sort((a, b) => {
        // Sort by relevance - exact matches first, then partial matches
        const aExact = a.name.toLowerCase() === searchTerm || a.company.toLowerCase() === searchTerm;
        const bExact = b.name.toLowerCase() === searchTerm || b.company.toLowerCase() === searchTerm;
        
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        
        // Then by health score (descending)
        return b.healthScore - a.healthScore;
      });
    } catch (error) {
      throw this.createServiceError(
        `Failed to search customers with query: ${query}`,
        'SEARCH_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Validate customer data
   */
  validateCustomer(customer: Partial<Customer>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate name
    if (!customer.name || typeof customer.name !== 'string') {
      errors.push({
        field: 'name',
        message: 'Name is required and must be a string',
        code: 'REQUIRED_FIELD'
      });
    } else if (customer.name.length < 2 || customer.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Name must be between 2 and 100 characters',
        code: 'INVALID_LENGTH'
      });
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(customer.name)) {
      errors.push({
        field: 'name',
        message: 'Name contains invalid characters',
        code: 'INVALID_FORMAT'
      });
    }

    // Validate company
    if (!customer.company || typeof customer.company !== 'string') {
      errors.push({
        field: 'company',
        message: 'Company is required and must be a string',
        code: 'REQUIRED_FIELD'
      });
    } else if (customer.company.length < 2 || customer.company.length > 100) {
      errors.push({
        field: 'company',
        message: 'Company name must be between 2 and 100 characters',
        code: 'INVALID_LENGTH'
      });
    }

    // Validate health score
    if (customer.healthScore !== undefined && customer.healthScore !== null) {
      const score = Number(customer.healthScore);
      if (isNaN(score)) {
        errors.push({
          field: 'healthScore',
          message: 'Health score must be a valid number',
          code: 'INVALID_TYPE'
        });
      } else if (score < 0 || score > 100) {
        errors.push({
          field: 'healthScore',
          message: 'Health score must be between 0 and 100',
          code: 'OUT_OF_RANGE'
        });
      }
    }

    // Validate email (optional)
    if (customer.email && typeof customer.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer.email)) {
        errors.push({
          field: 'email',
          message: 'Invalid email format',
          code: 'INVALID_FORMAT'
        });
      }
    }

    // Validate subscription tier (optional)
    if (customer.subscriptionTier) {
      const validTiers = ['basic', 'premium', 'enterprise'];
      if (!validTiers.includes(customer.subscriptionTier)) {
        errors.push({
          field: 'subscriptionTier',
          message: 'Invalid subscription tier',
          code: 'INVALID_VALUE'
        });
      }
    }

    // Validate domains (optional)
    if (customer.domains && Array.isArray(customer.domains)) {
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
      customer.domains.forEach((domain, index) => {
        if (typeof domain !== 'string' || !domainRegex.test(domain)) {
          errors.push({
            field: 'domains',
            message: `Invalid domain format at index ${index}: ${domain}`,
            code: 'INVALID_FORMAT'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a customer with the same name and company already exists
   */
  async checkDuplicateByNameCompany(name: string, company: string, excludeId?: string): Promise<boolean> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 5));

      return this.customers.some(customer => 
        customer.id !== excludeId &&
        customer.name.toLowerCase() === name.toLowerCase() &&
        customer.company.toLowerCase() === company.toLowerCase()
      );
    } catch (error) {
      throw this.createServiceError(
        'Failed to check for duplicate customers',
        'DUPLICATE_CHECK_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Get service statistics and health information
   */
  async getServiceInfo(): Promise<{
    totalCustomers: number;
    healthScoreStats: {
      average: number;
      min: number;
      max: number;
      distribution: { range: string; count: number }[];
    };
    subscriptionTierDistribution: Record<string, number>;
  }> {
    try {
      const customers = await this.getAll();
      const validHealthScores = customers
        .map(c => c.healthScore)
        .filter(score => !isNaN(score) && score !== null);

      const healthScoreStats = {
        average: validHealthScores.length > 0 
          ? Math.round(validHealthScores.reduce((sum, score) => sum + score, 0) / validHealthScores.length)
          : 0,
        min: validHealthScores.length > 0 ? Math.min(...validHealthScores) : 0,
        max: validHealthScores.length > 0 ? Math.max(...validHealthScores) : 0,
        distribution: [
          { range: '0-25', count: validHealthScores.filter(s => s >= 0 && s <= 25).length },
          { range: '26-50', count: validHealthScores.filter(s => s >= 26 && s <= 50).length },
          { range: '51-75', count: validHealthScores.filter(s => s >= 51 && s <= 75).length },
          { range: '76-100', count: validHealthScores.filter(s => s >= 76 && s <= 100).length }
        ]
      };

      const subscriptionTierDistribution = customers.reduce((acc, customer) => {
        const tier = customer.subscriptionTier || 'unspecified';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalCustomers: customers.length,
        healthScoreStats,
        subscriptionTierDistribution
      };
    } catch (error) {
      throw this.createServiceError(
        'Failed to get service information',
        'SERVICE_INFO_FAILED',
        500,
        error
      );
    }
  }
}

// Export singleton instance for use throughout the application
export const customerService = new CustomerService();

// Export default as the singleton instance
export default customerService;