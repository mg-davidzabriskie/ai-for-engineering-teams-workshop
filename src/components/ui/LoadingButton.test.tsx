import { render, screen, fireEvent } from '@testing-library/react'
import { LoadingButton } from './LoadingButton'

describe('LoadingButton', () => {
  it('renders button text when not loading', () => {
    render(<LoadingButton>Click me</LoadingButton>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('shows loading spinner when loading is true', () => {
    render(<LoadingButton loading>Loading...</LoadingButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('disables interaction when loading', () => {
    const mockClick = jest.fn()
    render(
      <LoadingButton loading onClick={mockClick}>
        Loading...
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(mockClick).not.toHaveBeenCalled()
  })

  it('handles click events when not loading', () => {
    const mockClick = jest.fn()
    render(<LoadingButton onClick={mockClick}>Click me</LoadingButton>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('respects disabled prop', () => {
    const mockClick = jest.fn()
    render(
      <LoadingButton disabled onClick={mockClick}>
        Disabled
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(mockClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(
      <LoadingButton className="custom-class">
        Custom
      </LoadingButton>
    )
    
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('has proper accessibility attributes during loading', () => {
    render(<LoadingButton loading>Loading...</LoadingButton>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-live', 'polite')
  })
})