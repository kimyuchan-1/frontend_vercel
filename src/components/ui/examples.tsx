/**
 * UI Component Usage Examples
 * 
 * This file demonstrates how to use the reusable UI components
 * in both server and client contexts.
 */

// ============================================================================
// SERVER COMPONENT EXAMPLES
// ============================================================================

import { Button, Input, Select, Textarea } from '@/components/ui'

/**
 * Example 1: Server Component with Static Form
 * 
 * This example shows how to use UI components in a server component
 * for static content that doesn't require client-side interactivity.
 */
export function ServerFormExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Contact Form</h2>
      
      <Input
        label="Name"
        placeholder="Enter your name"
        helperText="We'll use this to personalize your experience"
      />
      
      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        required
      />
      
      <Select
        label="Category"
        placeholder="Select a category..."
        options={[
          { value: 'general', label: 'General Inquiry' },
          { value: 'support', label: 'Technical Support' },
          { value: 'feedback', label: 'Feedback' },
        ]}
      />
      
      <Textarea
        label="Message"
        placeholder="Tell us more..."
        rows={5}
        helperText="Please provide as much detail as possible"
      />
      
      <Button variant="primary" size="lg">
        Submit
      </Button>
    </div>
  )
}

/**
 * Example 2: Server Component with Button Variants
 * 
 * This example demonstrates all button variants in a server component.
 */
export function ButtonVariantsExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Button Variants</h2>
      
      <div className="flex gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>
  )
}

// ============================================================================
// CLIENT COMPONENT EXAMPLES
// ============================================================================

'use client'

import { useState } from 'react'

/**
 * Example 3: Client Component with Interactive Form
 * 
 * This example shows how to use UI components in a client component
 * with state management and validation.
 */
export function ClientFormExample() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    category: '',
    message: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.email) {
      newErrors.email = 'Email is required'
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category'
    }
    if (!formData.message || formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Form submitted:', formData)
    setIsSubmitting(false)
    setFormData({ email: '', password: '', category: '', message: '' })
    setErrors({})
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Interactive Form</h2>
      
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        placeholder="email@example.com"
      />
      
      <Input
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        helperText="Must be at least 8 characters"
      />
      
      <Select
        label="Category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        error={errors.category}
        placeholder="Select a category..."
        options={[
          { value: 'general', label: 'General Inquiry' },
          { value: 'support', label: 'Technical Support' },
          { value: 'feedback', label: 'Feedback' },
        ]}
      />
      
      <Textarea
        label="Message"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        error={errors.message}
        placeholder="Tell us more..."
        rows={5}
      />
      
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFormData({ email: '', password: '', category: '', message: '' })
            setErrors({})
          }}
          disabled={isSubmitting}
        >
          Reset
        </Button>
      </div>
    </form>
  )
}

/**
 * Example 4: Client Component with Loading States
 * 
 * This example demonstrates button loading states and disabled states.
 */
export function LoadingStatesExample() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleAction = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Loading States</h2>
      
      <div className="flex gap-2">
        <Button
          variant="primary"
          loading={isLoading}
          onClick={handleAction}
        >
          Save Changes
        </Button>
        
        <Button
          variant="destructive"
          loading={isLoading}
          onClick={handleAction}
        >
          Delete Item
        </Button>
        
        <Button
          variant="outline"
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
