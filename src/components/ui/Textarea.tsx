import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

/**
 * Textarea Component
 * 
 * A flexible textarea component that works in both server and client contexts.
 * Supports labels, error messages, and helper text with consistent styling.
 * 
 * @example
 * // Basic usage
 * <Textarea placeholder="Enter your message" />
 * 
 * @example
 * // With label and helper text
 * <Textarea
 *   label="Description"
 *   helperText="Provide a detailed description"
 *   rows={5}
 * />
 * 
 * @example
 * // With error state
 * <Textarea
 *   label="Comments"
 *   error="Comment must be at least 10 characters"
 * />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          className={cn(
            'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'resize-vertical',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
