import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomerSelector } from './CustomerSelector'
import { Customer } from '@/data/mock-customers'

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Smith',
    company: 'Acme Corp',
    healthScore: 85,
    email: 'john.smith@acmecorp.com',
    subscriptionTier: 'premium',
    domains: ['acmecorp.com'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    company: 'TechStart Inc',
    healthScore: 45,
    email: 'sarah@techstart.io',
    subscriptionTier: 'basic',
    domains: ['techstart.io'],
    createdAt: '2024-01-20T14:22:00Z',
    updatedAt: '2024-01-20T14:22:00Z'
  },
  {
    id: '3',
    name: 'Michael Brown',
    company: 'Global Solutions',
    healthScore: 15,
    email: 'mbrown@globalsolutions.com',
    subscriptionTier: 'basic',
    domains: ['globalsolutions.com'],
    createdAt: '2024-01-25T09:45:00Z',
    updatedAt: '2024-01-25T09:45:00Z'
  }
]

describe('CustomerSelector', () => {
  it('displays all customers by default', () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    expect(screen.getByText('Michael Brown')).toBeInTheDocument()
    expect(screen.getByText('3 customers found')).toBeInTheDocument()
  })

  it('provides search functionality', () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    expect(searchInput).toBeInTheDocument()
  })

  it('filters customers by name', async () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.queryByText('Sarah Johnson')).not.toBeInTheDocument()
      expect(screen.queryByText('Michael Brown')).not.toBeInTheDocument()
      expect(screen.getByText('1 customer found')).toBeInTheDocument()
    })
  })

  it('filters customers by company', async () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    fireEvent.change(searchInput, { target: { value: 'TechStart' } })
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Michael Brown')).not.toBeInTheDocument()
      expect(screen.getByText('1 customer found')).toBeInTheDocument()
    })
  })

  it('shows empty state for no search results', async () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    fireEvent.change(searchInput, { target: { value: 'NonexistentCustomer' } })
    
    await waitFor(() => {
      expect(screen.getByText('No customers found')).toBeInTheDocument()
      expect(screen.getByText('No customers match "NonexistentCustomer". Try a different search term.')).toBeInTheDocument()
    })
  })

  it('provides clear search functionality', async () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    await waitFor(() => {
      expect(screen.getByText('1 customer found')).toBeInTheDocument()
    })
    
    const clearButton = screen.getByLabelText('Clear search')
    fireEvent.click(clearButton)
    
    await waitFor(() => {
      expect(screen.getByText('3 customers found')).toBeInTheDocument()
      expect(searchInput).toHaveValue('')
    })
  })

  it('shows "Show all customers" button when searching', async () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    await waitFor(() => {
      expect(screen.getByText('Show all customers')).toBeInTheDocument()
    })
    
    const showAllButton = screen.getByText('Show all customers')
    fireEvent.click(showAllButton)
    
    await waitFor(() => {
      expect(screen.getByText('3 customers found')).toBeInTheDocument()
      expect(searchInput).toHaveValue('')
    })
  })

  it('handles customer selection', () => {
    const mockOnSelect = jest.fn()
    render(<CustomerSelector customers={mockCustomers} onCustomerSelect={mockOnSelect} />)
    
    const johnCard = screen.getByText('John Smith').closest('div')
    if (johnCard) {
      fireEvent.click(johnCard)
      expect(mockOnSelect).toHaveBeenCalledWith(mockCustomers[0])
    }
  })

  it('shows visual selection state', () => {
    render(
      <CustomerSelector 
        customers={mockCustomers} 
        selectedCustomerId="1"
      />
    )
    
    const selectedCard = screen.getByText('John Smith').closest('div')
    expect(selectedCard).toHaveClass('ring-2', 'ring-blue-500')
  })

  it('handles empty customer list', () => {
    render(<CustomerSelector customers={[]} />)
    
    expect(screen.getByText('0 customers found')).toBeInTheDocument()
  })

  it('shows searching state temporarily', async () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    // Should briefly show "Searching..." before showing results
    expect(screen.getByText('Searching...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('1 customer found')).toBeInTheDocument()
    })
  })

  it('search is case insensitive', async () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    fireEvent.change(searchInput, { target: { value: 'JOHN' } })
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('1 customer found')).toBeInTheDocument()
    })
  })

  it('trims search queries', async () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    fireEvent.change(searchInput, { target: { value: '  John  ' } })
    
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('1 customer found')).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    const { container } = render(
      <CustomerSelector customers={mockCustomers} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles partial matches in search', async () => {
    render(<CustomerSelector customers={mockCustomers} />)
    
    const searchInput = screen.getByPlaceholderText('Search customers by name or company...')
    fireEvent.change(searchInput, { target: { value: 'Tech' } })
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.getByText('TechStart Inc')).toBeInTheDocument()
      expect(screen.getByText('1 customer found')).toBeInTheDocument()
    })
  })
})