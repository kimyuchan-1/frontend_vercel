import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

/**
 * Button Component
 * 
 * A flexible button component that works in both server and client contexts.
 * Supports multiple variants, sizes, and loading states.
 * 
 * @example
 * // Basic usage
 * <Button>Click me</Button>
 * 
 * @example
 * // With variants and loading state
 * <Button variant="primary" size="lg" loading={isLoading}>
 *   Submit Form
 * </Button>
 * 
 * @example
 * // Destructive action
 * <Button variant="destructive" onClick={handleDelete}>
 *   Delete Item
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // Variant styles
          {
            'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500': variant === 'secondary',
            'border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500': variant === 'outline',
            'hover:bg-gray-100 focus-visible:ring-gray-500': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500': variant === 'destructive',
          },
          
          // Size styles
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
