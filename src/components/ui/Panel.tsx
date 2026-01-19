import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg'
}

/**
 * Panel Component
 * 
 * A flexible container component for consistent content grouping and layout.
 * Similar to Card but with more layout-focused variants.
 * Works in both server and client contexts.
 * 
 * @example
 * // Basic usage
 * <Panel>
 *   <h2>Section Title</h2>
 *   <p>Content goes here</p>
 * </Panel>
 * 
 * @example
 * // Bordered panel with custom padding
 * <Panel variant="bordered" padding="lg">
 *   <div>Well-spaced content</div>
 * </Panel>
 * 
 * @example
 * // Filled panel for emphasis
 * <Panel variant="filled" rounded="lg">
 *   <div>Highlighted content</div>
 * </Panel>
 */
export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md', 
    rounded = 'md',
    children, 
    ...props 
  }, ref) => {
    return (
      <div
        className={cn(
          // Base styles
          'w-full',
          
          // Variant styles
          {
            'bg-white': variant === 'default',
            'bg-white border border-gray-200': variant === 'bordered',
            'bg-gray-50 border border-gray-100': variant === 'filled',
          },
          
          // Padding styles
          {
            'p-0': padding === 'none',
            'p-3': padding === 'sm',
            'p-6': padding === 'md',
            'p-8': padding === 'lg',
          },
          
          // Rounded styles
          {
            'rounded-none': rounded === 'none',
            'rounded-sm': rounded === 'sm',
            'rounded-md': rounded === 'md',
            'rounded-lg': rounded === 'lg',
          },
          
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Panel.displayName = 'Panel'

/**
 * PanelHeader Component
 * 
 * Container for panel header content with consistent spacing.
 * Typically used for titles and actions.
 */
export const PanelHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between pb-4 border-b border-gray-200', className)}
      {...props}
    />
  )
)
PanelHeader.displayName = 'PanelHeader'

/**
 * PanelTitle Component
 * 
 * Heading element for panel titles with consistent typography.
 */
export const PanelTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-xl font-semibold text-gray-900', className)}
      {...props}
    />
  )
)
PanelTitle.displayName = 'PanelTitle'

/**
 * PanelContent Component
 * 
 * Container for main panel content with consistent spacing.
 */
export const PanelContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-4', className)} {...props} />
  )
)
PanelContent.displayName = 'PanelContent'

/**
 * PanelFooter Component
 * 
 * Container for panel footer content with consistent spacing.
 * Typically used for actions or additional information.
 */
export const PanelFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end pt-4 border-t border-gray-200 mt-4', className)}
      {...props}
    />
  )
)
PanelFooter.displayName = 'PanelFooter'
