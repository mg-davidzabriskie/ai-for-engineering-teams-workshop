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

  describe('Selection functionality', () => {
    it('shows selection state when isSelected is true', () => {
      render(<CustomerCard customer={mockCustomer} isSelected={true} />)
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-500')
    })

    it('shows selection state when selectedCustomerId matches customer id', () => {
      render(<CustomerCard customer={mockCustomer} selectedCustomerId="1" />)
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-500')
    })

    it('does not show selection state when selectedCustomerId does not match', () => {
      render(<CustomerCard customer={mockCustomer} selectedCustomerId="999" />)
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).not.toHaveClass('bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-500')
      expect(card).toHaveClass('bg-white', 'border-gray-200')
    })

    it('has proper ARIA attributes when selected', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          isSelected={true}
          onClick={mockOnClick} 
        />
      )
      
      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('aria-pressed', 'true')
      expect(card).toHaveAttribute('aria-label', 'Selected customer John Smith from Acme Corp')
    })

    it('has proper ARIA attributes when not selected', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          isSelected={false}
          onClick={mockOnClick} 
        />
      )
      
      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('aria-pressed', 'false')
      expect(card).toHaveAttribute('aria-label', 'Select customer John Smith from Acme Corp')
    })

    it('selection state overrides health score border when selected', () => {
      render(<CustomerCard customer={mockCustomer} isSelected={true} />)
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('border-blue-500')
      expect(card).not.toHaveClass('border-l-green-500')
    })

    it('bad data warning is hidden when card is selected', () => {
      const badDataCustomer = { ...mockCustomer, healthScore: null as any }
      render(<CustomerCard customer={badDataCustomer} isSelected={true} />)
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('border-blue-500')
      expect(card).not.toHaveClass('border-orange-500', 'animate-pulse')
    })

    it('shows bad data warning when not selected', () => {
      const badDataCustomer = { ...mockCustomer, healthScore: null as any }
      render(<CustomerCard customer={badDataCustomer} isSelected={false} />)
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('border-orange-500', 'shadow-lg', 'shadow-orange-500/50', 'motion-safe:animate-pulse')
    })

    it('maintains backward compatibility when no selection props provided', () => {
      const mockOnClick = jest.fn()
      render(<CustomerCard customer={mockCustomer} onClick={mockOnClick} />)
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('bg-white', 'border-gray-200')
      expect(card).not.toHaveClass('bg-blue-50', 'border-blue-500')
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Multi-select functionality', () => {
    it('shows checkbox indicator in multi-select mode when clickable', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          selectionMode="multi"
          onClick={mockOnClick}
        />
      )
      
      // Should show checkbox indicator in top-left corner
      const checkbox = screen.getByRole('button').querySelector('div > div')
      expect(checkbox).toHaveClass('w-5', 'h-5', 'rounded', 'border-2')
    })

    it('shows selected checkbox in multi-select mode', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          selectionMode="multi"
          isSelected={true}
          onClick={mockOnClick}
        />
      )
      
      // Checkbox should be filled with blue background
      const checkbox = screen.getByRole('button').querySelector('div > div')
      expect(checkbox).toHaveClass('bg-blue-500', 'border-blue-500')
      
      // Should contain checkmark SVG
      const checkmark = checkbox?.querySelector('svg')
      expect(checkmark).toBeInTheDocument()
      expect(checkmark).toHaveClass('text-white')
    })

    it('shows unselected checkbox in multi-select mode', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          selectionMode="multi"
          isSelected={false}
          onClick={mockOnClick}
        />
      )
      
      // Checkbox should be white with gray border
      const checkbox = screen.getByRole('button').querySelector('div > div')
      expect(checkbox).toHaveClass('bg-white', 'border-gray-300')
      
      // Should not contain checkmark SVG
      const checkmark = checkbox?.querySelector('svg')
      expect(checkmark).not.toBeInTheDocument()
    })

    it('does not show checkbox in single-select mode', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          selectionMode="single"
          onClick={mockOnClick}
        />
      )
      
      // Should not show checkbox indicator
      const button = screen.getByRole('button')
      const checkbox = button.querySelector('div.absolute.top-3.left-3')
      expect(checkbox).not.toBeInTheDocument()
    })

    it('does not show checkbox when not clickable', () => {
      render(
        <CustomerCard 
          customer={mockCustomer} 
          selectionMode="multi"
        />
      )
      
      // Should not show checkbox when no onClick handler
      const checkbox = screen.getByText('John Smith').closest('div')?.querySelector('div.absolute.top-3.left-3')
      expect(checkbox).not.toBeInTheDocument()
    })

    it('adjusts content padding for checkbox in multi-select mode', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          selectionMode="multi"
          onClick={mockOnClick}
        />
      )
      
      // Content should have left padding to accommodate checkbox
      const nameContainer = screen.getByText('John Smith').parentElement
      expect(nameContainer).toHaveClass('pl-8')
    })

    it('has different selection styling for multi-select mode', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          selectionMode="multi"
          isSelected={true}
          onClick={mockOnClick}
        />
      )
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('bg-blue-50', 'border-blue-500', 'ring-2', 'ring-blue-400')
      expect(card).not.toHaveClass('ring-offset-2') // Multi-select uses different ring styling
    })

    it('has proper ARIA labels for multi-select mode', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          selectionMode="multi"
          isSelected={false}
          onClick={mockOnClick}
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Select customer John Smith from Acme Corp')
    })

    it('has proper ARIA labels for selected multi-select mode', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          selectionMode="multi"
          isSelected={true}
          onClick={mockOnClick}
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Deselect customer John Smith from Acme Corp')
    })

    it('maintains single-select behavior by default', () => {
      const mockOnClick = jest.fn()
      render(
        <CustomerCard 
          customer={mockCustomer} 
          isSelected={true}
          onClick={mockOnClick}
        />
      )
      
      const card = screen.getByText('John Smith').closest('div')
      expect(card).toHaveClass('ring-offset-2') // Single-select styling
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Selected customer John Smith from Acme Corp')
    })
  })
})