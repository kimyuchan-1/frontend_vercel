import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

/**
 * Card Component
 * 
 * A flexible container component for grouping related content with consistent styling.
 * Works in both server and client contexts.
 * 
 * @example
 * // Basic usage
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Content goes here</CardContent>
 * </Card>
 * 
 * @example
 * // With variants
 * <Card variant="elevated" padding="lg">
 *   Content with shadow and large padding
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'rounded-lg',
          
          // Variant styles
          {
            'bg-white': variant === 'default',
            'bg-white border border-gray-200': variant === 'outlined',
            'bg-white shadow-md': variant === 'elevated',
          },
          
          // Padding styles
          {
            'p-0': padding === 'none',
            'p-3': padding === 'sm',
            'p-6': padding === 'md',
            'p-8': padding === 'lg',
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

Card.displayName = 'Card'

/**
 * CardHeader Component
 * 
 * Container for card header content (title and description).
 * Provides consistent spacing and layout.
 */
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

/**
 * CardTitle Component
 * 
 * Heading element for card titles with consistent typography.
 */
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

/**
 * CardDescription Component
 * 
 * Paragraph element for card descriptions with muted styling.
 */
export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

/**
 * CardContent Component
 * 
 * Container for main card content with consistent spacing.
 */
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

/**
 * CardFooter Component
 * 
 * Container for card footer content (actions, buttons, etc.).
 * Provides consistent spacing and flex layout.
 */
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-6', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'
