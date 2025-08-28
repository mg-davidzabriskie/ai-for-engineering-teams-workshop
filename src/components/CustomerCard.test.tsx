import { render, screen, fireEvent } from '@testing-library/react'
import { CustomerCard } from './CustomerCard'
import { Customer } from '@/data/mock-customers'

const mockCustomer: Customer = {
  id: '1',
  name: 'John Smith',
  company: 'Acme Corp',
  healthScore: 85,
  email: 'john.smith@acmecorp.com',
  subscriptionTier: 'premium',
  domains: ['acmecorp.com', 'portal.acmecorp.com'],
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
}

describe('CustomerCard', () => {
  it('displays customer name, company, and health score correctly', () => {
    render(<CustomerCard customer={mockCustomer} />)
    
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('shows appropriate color coding for good health score (71-100)', () => {
    const goodHealthCustomer = { ...mockCustomer, healthScore: 85 }
    render(<CustomerCard customer={goodHealthCustomer} />)
    
    const healthScore = screen.getByText('85')
    expect(healthScore).toHaveClass('bg-green-500', 'text-green-50')
  })

  it('shows appropriate color coding for moderate health score (31-70)', () => {
    const moderateHealthCustomer = { ...mockCustomer, healthScore: 50 }
    render(<CustomerCard customer={moderateHealthCustomer} />)
    
    const healthScore = screen.getByText('50')
    expect(healthScore).toHaveClass('bg-yellow-500', 'text-yellow-50')
  })

  it('shows appropriate color coding for poor health score (0-30)', () => {
    const poorHealthCustomer = { ...mockCustomer, healthScore: 20 }
    render(<CustomerCard customer={poorHealthCustomer} />)
    
    const healthScore = screen.getByText('20')
    expect(healthScore).toHaveClass('bg-red-500', 'text-red-50')
  })

  it('displays single domain correctly', () => {
    const singleDomainCustomer = { ...mockCustomer, domains: ['acmecorp.com'] }
    render(<CustomerCard customer={singleDomainCustomer} />)
    
    expect(screen.getByText('acmecorp.com')).toBeInTheDocument()
  })

  it('displays domain count for multiple domains', () => {
    const multipleDomainCustomer = { 
      ...mockCustomer, 
      domains: ['acmecorp.com', 'portal.acmecorp.com', 'api.acmecorp.com'] 
    }
    render(<CustomerCard customer={multipleDomainCustomer} />)
    
    expect(screen.getByText('3 domains')).toBeInTheDocument()
  })

  it('handles missing domains gracefully', () => {
    const noDomainCustomer = { ...mockCustomer, domains: undefined }
    render(<CustomerCard customer={noDomainCustomer} />)
    
    expect(screen.getByText('No domains')).toBeInTheDocument()
  })

  it('handles empty domains array gracefully', () => {
    const emptyDomainsCustomer = { ...mockCustomer, domains: [] }
    render(<CustomerCard customer={emptyDomainsCustomer} />)
    
    expect(screen.getByText('No domains')).toBeInTheDocument()
  })

  it('handles click interaction when onClick is provided', () => {
    const mockOnClick = jest.fn()
    render(<CustomerCard customer={mockCustomer} onClick={mockOnClick} />)
    
    const card = screen.getByRole('button')
    expect(card).toHaveAttribute('aria-label', 'Select customer John Smith from Acme Corp')
    
    fireEvent.click(card)
    expect(mockOnClick).toHaveBeenCalledWith(mockCustomer)
  })

  it('handles keyboard interaction when onClick is provided', () => {
    const mockOnClick = jest.fn()
    render(<CustomerCard customer={mockCustomer} onClick={mockOnClick} />)
    
    const card = screen.getByRole('button')
    
    // Test Enter key
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(mockOnClick).toHaveBeenCalledWith(mockCustomer)
    
    // Test Space key
    fireEvent.keyDown(card, { key: ' ' })
    expect(mockOnClick).toHaveBeenCalledWith(mockCustomer)
  })

  it('does not add interactive attributes when onClick is not provided', () => {
    render(<CustomerCard customer={mockCustomer} />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('John Smith').closest('div')).not.toHaveAttribute('tabindex')
  })

  it('returns null when customer is null or undefined', () => {
    const { container } = render(<CustomerCard customer={null as any} />)
    expect(container.firstChild).toBeNull()
  })

  it('applies custom className', () => {
    render(<CustomerCard customer={mockCustomer} className="custom-class" />)
    
    expect(screen.getByText('John Smith').closest('div')).toHaveClass('custom-class')
  })

  it('truncates long names appropriately', () => {
    const longNameCustomer = {
      ...mockCustomer,
      name: 'This is a very long customer name that should be truncated',
      company: 'This is a very long company name that should be truncated'
    }
    render(<CustomerCard customer={longNameCustomer} />)
    
    const nameElement = screen.getByText(longNameCustomer.name)
    const companyElement = screen.getByText(longNameCustomer.company)
    
    expect(nameElement).toHaveClass('truncate')
    expect(companyElement).toHaveClass('truncate')
  })

  it('has proper accessibility attributes for health score', () => {
    render(<CustomerCard customer={mockCustomer} />)
    
    const healthScore = screen.getByText('85')
    expect(healthScore).toHaveAttribute('aria-label', 'Health score: 85 out of 100')
  })

  describe('Bad data handling', () => {
    it('returns null when customer name is missing', () => {
      const customerWithoutName = { ...mockCustomer, name: '' }
      const { container } = render(<CustomerCard customer={customerWithoutName} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when customer company is missing', () => {
      const customerWithoutCompany = { ...mockCustomer, company: '' }
      const { container } = render(<CustomerCard customer={customerWithoutCompany} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when customer name is null', () => {
      const customerWithNullName = { ...mockCustomer, name: null as any }
      const { container } = render(<CustomerCard customer={customerWithNullName} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when customer company is null', () => {
      const customerWithNullCompany = { ...mockCustomer, company: null as any }
      const { container } = render(<CustomerCard customer={customerWithNullCompany} />)
      expect(container.firstChild).toBeNull()
    })

    it('handles null health score by defaulting to 0 and shows warning border', () => {
      const customerWithNullScore = { ...mockCustomer, healthScore: null as any }
      render(<CustomerCard customer={customerWithNullScore} />)
      
      const healthScore = screen.getByText('0')
      expect(healthScore).toHaveClass('bg-red-500') // Should be red for score 0
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('border-orange-500', 'shadow-lg', 'shadow-orange-500/50', 'animate-pulse')
    })

    it('handles undefined health score by defaulting to 0 and shows warning border', () => {
      const customerWithUndefinedScore = { ...mockCustomer, healthScore: undefined as any }
      render(<CustomerCard customer={customerWithUndefinedScore} />)
      
      const healthScore = screen.getByText('0')
      expect(healthScore).toHaveClass('bg-red-500') // Should be red for score 0
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('border-orange-500', 'shadow-lg', 'shadow-orange-500/50', 'animate-pulse')
    })

    it('handles NaN health score by defaulting to 0 and shows warning border', () => {
      const customerWithNaNScore = { ...mockCustomer, healthScore: NaN }
      render(<CustomerCard customer={customerWithNaNScore} />)
      
      const healthScore = screen.getByText('0')
      expect(healthScore).toHaveClass('bg-red-500') // Should be red for score 0
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('border-orange-500', 'shadow-lg', 'shadow-orange-500/50', 'animate-pulse')
    })

    it('clamps health score above 100 to 100 and shows warning border', () => {
      const customerWithHighScore = { ...mockCustomer, healthScore: 150 }
      render(<CustomerCard customer={customerWithHighScore} />)
      
      const healthScore = screen.getByText('100')
      expect(healthScore).toHaveClass('bg-green-500') // Should be green for score 100
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('border-orange-500', 'shadow-lg', 'shadow-orange-500/50', 'animate-pulse')
    })

    it('clamps negative health score to 0 and shows warning border', () => {
      const customerWithNegativeScore = { ...mockCustomer, healthScore: -25 }
      render(<CustomerCard customer={customerWithNegativeScore} />)
      
      const healthScore = screen.getByText('0')
      expect(healthScore).toHaveClass('bg-red-500') // Should be red for score 0
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('border-orange-500', 'shadow-lg', 'shadow-orange-500/50', 'animate-pulse')
    })

    it('handles string health score by defaulting to 0 and shows warning border', () => {
      const customerWithStringScore = { ...mockCustomer, healthScore: 'invalid' as any }
      render(<CustomerCard customer={customerWithStringScore} />)
      
      const healthScore = screen.getByText('0')
      expect(healthScore).toHaveClass('bg-red-500') // Should be red for score 0
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('border-orange-500', 'shadow-lg', 'shadow-orange-500/50', 'animate-pulse')
    })

    it('does not show warning border for valid health scores', () => {
      render(<CustomerCard customer={mockCustomer} />)
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).not.toHaveClass('border-orange-500', 'shadow-lg', 'shadow-orange-500/50', 'animate-pulse')
      expect(card).toHaveClass('border-l-green-500') // Normal health score border
    })
  })
})