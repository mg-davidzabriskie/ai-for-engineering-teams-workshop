import { ButtonHTMLAttributes, ReactNode } from 'react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: ReactNode
}

/**
 * A button component that displays a loading spinner during async operations
 * @param loading - Whether the button is in loading state
 * @param children - Button text or content
 * @param disabled - Whether the button is disabled
 * @param className - Additional CSS classes
 * @param onClick - Click handler function
 */
export const LoadingButton = ({
  loading = false,
  children,
  disabled = false,
  className = '',
  onClick,
  ...props
}: LoadingButtonProps) => {
  const isDisabled = disabled || loading

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && onClick) {
      onClick(event)
    }
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={loading}
      aria-live="polite"
      className={`
        relative inline-flex items-center justify-center px-4 py-2 
        font-medium text-white bg-blue-600 rounded-lg
        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 ease-in-out
        ${className}
      `.trim()}
    >
      {loading && (
        <svg
          className="w-4 h-4 mr-2 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span className={loading ? 'opacity-75' : ''}>
        {children}
      </span>
    </button>
  )
}