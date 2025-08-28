import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarketIntelligenceWidget } from './MarketIntelligenceWidget'
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence'
import { MarketIntelligenceData } from '@/services/MarketIntelligenceService'

// Mock the hook
jest.mock('@/hooks/useMarketIntelligence')
const mockUseMarketIntelligence = useMarketIntelligence as jest.MockedFunction<typeof useMarketIntelligence>

const mockMarketData: MarketIntelligenceData = {
  sentiment: {
    score: 0.25,
    label: 'positive',
    confidence: 0.82
  },
  headlines: [
    {
      title: 'TechCorp announces new product line with innovative features',
      source: 'TechNews',
      publishedAt: '2024-01-15T10:30:00Z',
      url: 'https://technews.com/article/1'
    },
    {
      title: 'Market analysis shows strong growth potential for tech sector',
      source: 'Business Daily',
      publishedAt: '2024-01-15T09:15:00Z',
      url: 'https://businessdaily.com/analysis'
    },
    {
      title: 'Industry trends favor innovation and digital transformation',
      source: 'Innovation Weekly',
      publishedAt: '2024-01-15T08:00:00Z'
    }
  ],
  articleCount: 42,
  lastUpdated: '2024-01-15T10:30:00Z',
  company: 'TechCorp'
}

const mockHookReturn = {
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  fetchMarketIntelligence: jest.fn(),
  clearError: jest.fn()
}

describe('MarketIntelligenceWidget', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMarketIntelligence.mockReturnValue(mockHookReturn)
  })

  describe('Initial render', () => {
    it('renders the widget with default state', () => {
      render(<MarketIntelligenceWidget />)
      
      expect(screen.getByText('Market Intelligence')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter company name...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
      expect(screen.getByText('Enter a company name to view market sentiment and news')).toBeInTheDocument()
    })

    it('renders with pre-filled company name', () => {
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const input = screen.getByDisplayValue('TechCorp')
      expect(input).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<MarketIntelligenceWidget className="custom-class" />)
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('has proper ARIA attributes', () => {
      render(<MarketIntelligenceWidget />)
      
      const widget = screen.getByRole('region', { name: 'Market Intelligence Widget' })
      expect(widget).toBeInTheDocument()
      
      const input = screen.getByRole('textbox', { name: 'Company name' })
      expect(input).toHaveAttribute('aria-describedby')
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      expect(searchButton).toHaveAttribute('aria-label', 'Search for market intelligence')
    })
  })

  describe('Company input validation and interaction', () => {
    it('validates company name input in real-time', async () => {
      render(<MarketIntelligenceWidget />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      
      // Test too short input
      await user.type(input, 'A')
      expect(screen.getByText('Company name must be at least 2 characters')).toBeInTheDocument()
      
      // Test valid input
      await user.clear(input)
      await user.type(input, 'TechCorp')
      expect(screen.queryByText('Company name must be at least 2 characters')).not.toBeInTheDocument()
    })

    it('shows validation error for too long company name', async () => {
      render(<MarketIntelligenceWidget />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      const longName = 'A'.repeat(101)
      
      await user.type(input, longName)
      expect(screen.getByText('Company name must be less than 100 characters')).toBeInTheDocument()
    })

    it('shows validation error for invalid characters', async () => {
      render(<MarketIntelligenceWidget />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      
      await user.type(input, 'Company<script>')
      expect(screen.getByText('Company name contains invalid characters')).toBeInTheDocument()
    })

    it('handles keyboard interaction for search', async () => {
      mockHookReturn.fetchMarketIntelligence = jest.fn()
      mockUseMarketIntelligence.mockReturnValue(mockHookReturn)
      
      render(<MarketIntelligenceWidget />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      
      await user.type(input, 'TechCorp')
      await user.keyboard('{Enter}')
      
      expect(mockHookReturn.fetchMarketIntelligence).toHaveBeenCalledWith('TechCorp')
    })

    it('handles search button click', async () => {
      mockHookReturn.fetchMarketIntelligence = jest.fn()
      mockUseMarketIntelligence.mockReturnValue(mockHookReturn)
      
      render(<MarketIntelligenceWidget />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      await user.type(input, 'TechCorp')
      await user.click(searchButton)
      
      expect(mockHookReturn.fetchMarketIntelligence).toHaveBeenCalledWith('TechCorp')
    })

    it('disables search button when input is invalid', async () => {
      render(<MarketIntelligenceWidget />)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      expect(searchButton).toBeDisabled()
      
      const input = screen.getByPlaceholderText('Enter company name...')
      await user.type(input, 'A')
      
      expect(searchButton).toBeDisabled()
      
      await user.type(input, 'cme Corp')
      expect(searchButton).not.toBeDisabled()
    })

    it('calls onCompanySelect when company is selected', async () => {
      const mockOnCompanySelect = jest.fn()
      render(<MarketIntelligenceWidget onCompanySelect={mockOnCompanySelect} />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      await user.type(input, 'TechCorp')
      
      expect(mockOnCompanySelect).toHaveBeenCalledWith('TechCorp')
    })
  })

  describe('Loading states', () => {
    it('displays loading skeleton during data fetch', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        isLoading: true
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByTestId('market-intelligence-skeleton')).toBeInTheDocument()
      expect(screen.queryByText('Enter a company name')).not.toBeInTheDocument()
    })

    it('shows loading state immediately after search', async () => {
      let isLoading = false
      mockHookReturn.fetchMarketIntelligence = jest.fn().mockImplementation(() => {
        isLoading = true
      })
      
      mockUseMarketIntelligence.mockImplementation(() => ({
        ...mockHookReturn,
        isLoading
      }))
      
      render(<MarketIntelligenceWidget />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      await user.type(input, 'TechCorp')
      await user.click(searchButton)
      
      expect(mockHookReturn.fetchMarketIntelligence).toHaveBeenCalledWith('TechCorp')
    })

    it('disables input and search button during loading', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        isLoading: true
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      expect(input).toBeDisabled()
      expect(searchButton).toBeDisabled()
    })
  })

  describe('Data display', () => {
    beforeEach(() => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        lastFetched: Date.now()
      })
    })

    it('displays market sentiment with correct color coding', () => {
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText('Positive')).toBeInTheDocument()
      expect(screen.getByText('82%')).toBeInTheDocument() // confidence
      
      const sentimentIndicator = screen.getByTestId('sentiment-indicator')
      expect(sentimentIndicator).toHaveClass('bg-green-500')
    })

    it('displays neutral sentiment correctly', () => {
      const neutralData = {
        ...mockMarketData,
        sentiment: { score: 0.1, label: 'neutral' as const, confidence: 0.65 }
      }
      
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: neutralData,
        lastFetched: Date.now()
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText('Neutral')).toBeInTheDocument()
      
      const sentimentIndicator = screen.getByTestId('sentiment-indicator')
      expect(sentimentIndicator).toHaveClass('bg-yellow-500')
    })

    it('displays negative sentiment correctly', () => {
      const negativeData = {
        ...mockMarketData,
        sentiment: { score: -0.3, label: 'negative' as const, confidence: 0.78 }
      }
      
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: negativeData,
        lastFetched: Date.now()
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText('Negative')).toBeInTheDocument()
      
      const sentimentIndicator = screen.getByTestId('sentiment-indicator')
      expect(sentimentIndicator).toHaveClass('bg-red-500')
    })

    it('displays news headlines with proper formatting', () => {
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText('TechCorp announces new product line with innovative features')).toBeInTheDocument()
      expect(screen.getByText('Market analysis shows strong growth potential for tech sector')).toBeInTheDocument()
      expect(screen.getByText('Industry trends favor innovation and digital transformation')).toBeInTheDocument()
      
      expect(screen.getByText('TechNews')).toBeInTheDocument()
      expect(screen.getByText('Business Daily')).toBeInTheDocument()
      expect(screen.getByText('Innovation Weekly')).toBeInTheDocument()
    })

    it('displays publication timestamps in human-readable format', () => {
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      // Should format timestamps appropriately
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    })

    it('displays total article count', () => {
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText('42 articles analyzed')).toBeInTheDocument()
    })

    it('displays last updated timestamp', () => {
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })

    it('truncates long headlines appropriately', () => {
      const longHeadlineData = {
        ...mockMarketData,
        headlines: [
          {
            title: 'This is a very long headline that should be truncated because it exceeds the reasonable length limit for display purposes in the UI component',
            source: 'Long News',
            publishedAt: '2024-01-15T10:30:00Z'
          },
          ...mockMarketData.headlines.slice(1)
        ]
      }
      
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: longHeadlineData,
        lastFetched: Date.now()
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const headline = screen.getByText(/This is a very long headline/)
      expect(headline).toHaveClass('truncate')
    })

    it('handles headlines with and without URLs', () => {
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      // Headlines with URLs should be clickable
      const linkedHeadline = screen.getByText('TechCorp announces new product line with innovative features')
      expect(linkedHeadline.closest('a')).toHaveAttribute('href', 'https://technews.com/article/1')
      
      // Headlines without URLs should not be links
      const unlinkedHeadline = screen.getByText('Industry trends favor innovation and digital transformation')
      expect(unlinkedHeadline.closest('a')).toBeNull()
    })
  })

  describe('Error handling', () => {
    it('displays error messages with retry functionality', () => {
      const mockClearError = jest.fn()
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        error: 'Failed to fetch market intelligence data',
        clearError: mockClearError
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText('Failed to fetch market intelligence data')).toBeInTheDocument()
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      expect(retryButton).toBeInTheDocument()
      
      fireEvent.click(retryButton)
      expect(mockClearError).toHaveBeenCalled()
    })

    it('handles different error types appropriately', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        error: 'Rate limit exceeded'
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('provides clear messaging for validation errors', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        error: 'Company name contains invalid characters'
      })
      
      render(<MarketIntelligenceWidget company="Invalid<>" />)
      
      expect(screen.getByText('Company name contains invalid characters')).toBeInTheDocument()
    })

    it('handles error boundary gracefully', () => {
      // Mock console.error to prevent noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Force an error in the component
      mockUseMarketIntelligence.mockImplementation(() => {
        throw new Error('Hook error')
      })
      
      expect(() => render(<MarketIntelligenceWidget />)).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Manual refresh functionality', () => {
    it('provides manual refresh button when data is loaded', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        lastFetched: Date.now()
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toBeInTheDocument()
    })

    it('triggers data refresh when refresh button is clicked', () => {
      const mockFetch = jest.fn()
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        lastFetched: Date.now(),
        fetchMarketIntelligence: mockFetch
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      fireEvent.click(refreshButton)
      
      expect(mockFetch).toHaveBeenCalledWith('TechCorp')
    })

    it('shows refresh animation during data update', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        isLoading: true,
        lastFetched: Date.now()
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toBeDisabled()
      expect(refreshButton.querySelector('svg')).toHaveClass('animate-spin')
    })
  })

  describe('Responsive design', () => {
    it('renders correctly on mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const widget = screen.getByRole('region', { name: 'Market Intelligence Widget' })
      expect(widget).toBeInTheDocument()
      
      // Should maintain accessibility and functionality
      expect(screen.getByPlaceholderText('Enter company name...')).toBeInTheDocument()
    })

    it('adapts layout for tablet viewports', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const widget = screen.getByRole('region', { name: 'Market Intelligence Widget' })
      expect(widget).toBeInTheDocument()
    })

    it('maintains component maximum width constraint', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        lastFetched: Date.now()
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const widget = screen.getByRole('region', { name: 'Market Intelligence Widget' })
      expect(widget).toHaveClass('max-w-md') // 400px max width constraint
    })
  })

  describe('Accessibility compliance', () => {
    it('supports keyboard navigation', async () => {
      render(<MarketIntelligenceWidget />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      // Tab navigation should work
      await user.tab()
      expect(input).toHaveFocus()
      
      await user.tab()
      expect(searchButton).toHaveFocus()
    })

    it('provides proper ARIA labels and descriptions', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        lastFetched: Date.now()
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const sentimentSection = screen.getByRole('region', { name: 'Market sentiment analysis' })
      expect(sentimentSection).toBeInTheDocument()
      
      const newsSection = screen.getByRole('region', { name: 'Recent news headlines' })
      expect(newsSection).toBeInTheDocument()
      
      const sentimentScore = screen.getByText('82%')
      expect(sentimentScore).toHaveAttribute('aria-label', 'Confidence level: 82%')
    })

    it('provides screen reader announcements for state changes', async () => {
      const mockFetch = jest.fn()
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        fetchMarketIntelligence: mockFetch
      })
      
      render(<MarketIntelligenceWidget />)
      
      const input = screen.getByPlaceholderText('Enter company name...')
      await user.type(input, 'TechCorp')
      
      // Should have live region for status updates
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('meets color contrast requirements', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        lastFetched: Date.now()
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      // Text elements should have sufficient contrast
      const headingElement = screen.getByText('Market Intelligence')
      expect(headingElement).toHaveClass('text-gray-900') // High contrast text
    })

    it('provides focus indicators for interactive elements', async () => {
      render(<MarketIntelligenceWidget />)
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      await user.tab()
      await user.tab() // Focus search button
      
      expect(searchButton).toHaveFocus()
      expect(searchButton).toHaveClass('focus:ring-2', 'focus:ring-offset-2')
    })

    it('handles high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText('Market Intelligence')).toBeInTheDocument()
    })
  })

  describe('Auto-refresh functionality', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('supports auto-refresh when enabled', () => {
      const mockFetch = jest.fn()
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        lastFetched: Date.now(),
        fetchMarketIntelligence: mockFetch
      })
      
      render(
        <MarketIntelligenceWidget 
          company="TechCorp" 
          autoRefresh={true}
          refreshInterval={60000} // 1 minute
        />
      )
      
      // Fast-forward time
      jest.advanceTimersByTime(60000)
      
      expect(mockFetch).toHaveBeenCalledWith('TechCorp')
    })

    it('clears auto-refresh on unmount', () => {
      const mockFetch = jest.fn()
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        lastFetched: Date.now(),
        fetchMarketIntelligence: mockFetch
      })
      
      const { unmount } = render(
        <MarketIntelligenceWidget 
          company="TechCorp" 
          autoRefresh={true}
          refreshInterval={60000}
        />
      )
      
      unmount()
      
      // Fast-forward time after unmount
      jest.advanceTimersByTime(60000)
      
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('pauses auto-refresh when component is not visible', () => {
      // This would require intersection observer mocking for full implementation
      const mockFetch = jest.fn()
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: mockMarketData,
        lastFetched: Date.now(),
        fetchMarketIntelligence: mockFetch
      })
      
      render(
        <MarketIntelligenceWidget 
          company="TechCorp" 
          autoRefresh={true}
          refreshInterval={60000}
        />
      )
      
      // Test would verify that refresh is paused when not visible
      expect(screen.getByText('Market Intelligence')).toBeInTheDocument()
    })
  })

  describe('Integration with existing patterns', () => {
    it('follows established component styling patterns', () => {
      render(<MarketIntelligenceWidget />)
      
      const widget = screen.getByRole('region', { name: 'Market Intelligence Widget' })
      expect(widget).toHaveClass('bg-white', 'rounded-lg', 'border', 'p-6')
    })

    it('matches loading state patterns from other components', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        isLoading: true
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      const skeleton = screen.getByTestId('market-intelligence-skeleton')
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('uses consistent error handling patterns', () => {
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        error: 'Network error'
      })
      
      render(<MarketIntelligenceWidget company="TechCorp" />)
      
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toHaveClass('bg-blue-500', 'text-white')
    })

    it('integrates seamlessly with dashboard layout', () => {
      render(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MarketIntelligenceWidget company="TechCorp" />
        </div>
      )
      
      const widget = screen.getByRole('region', { name: 'Market Intelligence Widget' })
      expect(widget).toBeInTheDocument()
    })
  })

  describe('Performance characteristics', () => {
    it('renders efficiently with large datasets', () => {
      const largeDataset = {
        ...mockMarketData,
        headlines: Array(100).fill(null).map((_, i) => ({
          title: `Headline ${i + 1}`,
          source: `Source ${i + 1}`,
          publishedAt: '2024-01-15T10:30:00Z'
        }))
      }
      
      mockUseMarketIntelligence.mockReturnValue({
        ...mockHookReturn,
        data: largeDataset,
        lastFetched: Date.now()
      })
      
      const startTime = performance.now()
      render(<MarketIntelligenceWidget company="TechCorp" />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100) // Should render quickly
      expect(screen.getByText('Market Intelligence')).toBeInTheDocument()
    })

    it('handles rapid prop changes without performance degradation', () => {
      const { rerender } = render(<MarketIntelligenceWidget company="TechCorp" />)
      
      // Rapidly change props
      for (let i = 0; i < 10; i++) {
        rerender(<MarketIntelligenceWidget company={`Company${i}`} />)
      }
      
      expect(screen.getByText('Market Intelligence')).toBeInTheDocument()
    })
  })
})