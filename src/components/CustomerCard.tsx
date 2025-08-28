import { useState } from 'react'
import { Customer } from '@/data/mock-customers'

interface CustomerCardProps {
  customer: Customer
  onClick?: (customer: Customer) => void
  className?: string
}

/**
 * CustomerCard component displays individual customer information in a card format
 * @param customer - Customer data to display
 * @param onClick - Optional click handler for customer selection
 * @param className - Additional CSS classes
 */
export const CustomerCard = ({
  customer,
  onClick,
  className = ''
}: CustomerCardProps) => {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!customer) {
    return null
  }

  const { name, company, healthScore, domains } = customer

  // Handle missing required fields
  if (!name || !company) {
    return null
  }

  // Sanitize health score - handle null, undefined, NaN, and out of range values
  const { sanitizedHealthScore, hasBadData } = (() => {
    let score = healthScore
    let badData = false

    if (typeof healthScore !== 'number' || isNaN(healthScore)) {
      score = 0 // Default to 0 for invalid scores
      badData = true
    } else if (healthScore < 0 || healthScore > 100) {
      score = Math.max(0, Math.min(100, healthScore)) // Clamp between 0-100
      badData = true
    }

    return { sanitizedHealthScore: score, hasBadData: badData }
  })()

  /**
   * Determines the health score color based on score ranges
   * @param score - Health score (0-100)
   * @returns Color classes for the health indicator
   */
  const getHealthScoreColor = (score: number): string => {
    if (score >= 71) return 'bg-green-500 text-green-50'  // Good health
    if (score >= 31) return 'bg-yellow-500 text-yellow-50' // Moderate health
    return 'bg-red-500 text-red-50' // Poor health
  }

  /**
   * Determines the health score background color for the card border
   * @param score - Health score (0-100)
   * @returns Border color classes
   */
  const getHealthScoreBorderColor = (score: number): string => {
    if (score >= 71) return 'border-l-green-500'
    if (score >= 31) return 'border-l-yellow-500'
    return 'border-l-red-500'
  }

  /**
   * Formats domain display based on count
   * @param domains - Array of domain strings
   * @returns Formatted domain text
   */
  const formatDomains = (domains?: string[]): string => {
    if (!domains || domains.length === 0) return 'No domains'
    if (domains.length === 1) return domains[0]
    return `${domains.length} domains`
  }

  const handleClick = () => {
    if (onClick) {
      onClick(customer)
    }
  }

  const isClickable = !!onClick

  return (
    <div
      className={`
        bg-white border border-gray-200 border-l-4 rounded-lg shadow-sm
        hover:shadow-md transition-shadow duration-200
        p-4 w-full
        ${hasBadData ? 'border-orange-500 shadow-lg shadow-orange-500/50 animate-pulse' : getHealthScoreBorderColor(sanitizedHealthScore)}
        ${isClickable ? 'cursor-pointer hover:bg-gray-50' : ''}
        ${className}
      `.trim()}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      } : undefined}
      aria-label={isClickable ? `Select customer ${name} from ${company}` : undefined}
    >
      {/* Header with customer name and health score */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {name}
          </h3>
          <p className="text-sm font-medium text-gray-600 truncate">
            {company}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
          <span
            className={`
              inline-flex items-center justify-center
              px-2 py-1 rounded-full text-xs font-semibold
              min-w-[3rem]
              ${getHealthScoreColor(sanitizedHealthScore)}
            `.trim()}
            aria-label={`Health score: ${sanitizedHealthScore} out of 100`}
          >
            {sanitizedHealthScore}
          </span>
        </div>
      </div>

      {/* Domain information */}
      <div className="mt-3 relative">
        {domains && domains.length > 1 ? (
          <div
            className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <p className="text-sm text-gray-500 cursor-help">
              <span className="font-medium">Domains:</span>{' '}
              <span className="text-gray-700 underline decoration-dotted">
                {formatDomains(domains)}
              </span>
            </p>
            
            {/* Tooltip */}
            {showTooltip && (
              <div className="
                absolute bottom-full left-0 mb-2 z-10
                bg-gray-900 text-white text-xs rounded-lg py-2 px-3
                whitespace-nowrap shadow-lg
                before:content-[''] before:absolute before:top-full before:left-4
                before:border-4 before:border-transparent before:border-t-gray-900
              ">
                <div className="space-y-1">
                  {domains.map((domain, index) => (
                    <div key={index}>• {domain}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            <span className="font-medium">Domains:</span>{' '}
            <span className="text-gray-700">{formatDomains(domains)}</span>
          </p>
        )}
      </div>
    </div>
  )
}