# UI Component Library

This directory contains reusable UI components that support both server and client rendering contexts.

## Design Principles

1. **Rendering Context Agnostic**: Components work in both server and client contexts
2. **Composition Over Configuration**: Use props and children for flexibility
3. **Consistent API**: Similar components have similar prop interfaces
4. **Theme Support**: Components support consistent styling and theming
5. **Accessibility First**: All components meet WCAG 2.1 AA standards

## Directory Structure

```
src/components/ui/
├── index.ts           # Central export file for all components
├── README.md          # This file
├── Button.tsx         # Button component (to be created)
├── Input.tsx          # Input component (to be created)
├── Select.tsx         # Select component (to be created)
├── Textarea.tsx       # Textarea component (to be created)
├── Card.tsx           # Card component (to be created)
└── Modal.tsx          # Modal component (to be created)
```

## Utility Functions

The component library uses utility functions from `src/lib/utils.ts`:

- `cn()`: Merges Tailwind CSS classes with proper precedence using clsx and tailwind-merge

## Usage Examples

### Server Component Usage

```typescript
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export default function HomePage() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="primary" size="lg">
          Get Started
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Client Component Usage

```typescript
'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'

export function InteractiveForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        required
      />
      <Button
        type="submit"
        loading={isSubmitting}
      >
        Submit
      </Button>
    </form>
  )
}
```

## Component Guidelines

### Creating New Components

When creating new reusable components:

1. Use TypeScript for type safety
2. Use `forwardRef` for ref forwarding when needed
3. Support both controlled and uncontrolled modes for form components
4. Include proper ARIA attributes for accessibility
5. Use the `cn()` utility for className merging
6. Document props and usage with JSDoc comments
7. Export from `index.ts` for easy imports

### Component Template

```typescript
import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary'
  // Add other props
}

/**
 * Component description
 * 
 * @example
 * <Component variant="primary">Content</Component>
 */
export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        className={cn(
          // Base styles
          'base-class',
          // Variant styles
          {
            'variant-class': variant === 'primary',
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

Component.displayName = 'Component'
```

## Testing

All components should have comprehensive tests:

- Unit tests for rendering and behavior
- Accessibility tests (ARIA attributes, keyboard navigation)
- Visual regression tests
- Tests for both server and client contexts

## Dependencies

The component library uses:

- `clsx`: Conditional class names
- `tailwind-merge`: Intelligent Tailwind CSS class merging
- `@headlessui/react`: Accessible UI primitives (for complex components like Modal)
- `@heroicons/react`: Icon library

## Next Steps

Components will be created incrementally as part of the rendering optimization tasks:

1. Task 15.2: Create core UI components (Button, Input, Select, Textarea)
2. Task 15.3: Create layout components (Card, Modal, Panel)
3. Task 15.4: Replace existing component implementations
4. Task 15.5: Write unit tests for reusable components
5. Task 15.6: Create component documentation
6. Task 15.7: Implement theming support
7. Task 15.8: Validate component flexibility
