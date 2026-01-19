/**
 * Layout Component Usage Examples
 * 
 * This file demonstrates how to use the layout components (Card, Modal, Panel)
 * in both server and client contexts.
 */

'use client'

import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Modal,
  Panel,
  PanelHeader,
  PanelTitle,
  PanelContent,
  PanelFooter,
  Button,
  Input,
} from '@/components/ui'

// ============================================================================
// CARD COMPONENT EXAMPLES
// ============================================================================

/**
 * Example 1: Basic Card with All Sub-components
 */
export function BasicCardExample() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Feature Highlight</CardTitle>
        <CardDescription>
          Discover the latest features and improvements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">
          This card demonstrates the complete composition pattern with header,
          content, and footer sections. Perfect for feature announcements,
          product cards, or content previews.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="primary">Learn More</Button>
        <Button variant="outline" className="ml-2">
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Example 2: Card Variants
 */
export function CardVariantsExample() {
  return (
    <div className="space-y-4">
      <Card variant="default">
        <CardContent>
          <p>Default variant - clean white background</p>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <p>Outlined variant - with border</p>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardContent>
          <p>Elevated variant - with shadow</p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Example 3: Product Card
 */
export function ProductCardExample() {
  return (
    <Card variant="outlined" padding="none">
      <div className="aspect-video bg-gray-200 rounded-t-lg" />
      <div className="p-6">
        <CardHeader>
          <CardTitle>Premium Dashboard</CardTitle>
          <CardDescription>$49/month</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ Unlimited projects</li>
            <li>✓ Advanced analytics</li>
            <li>✓ Priority support</li>
            <li>✓ Custom integrations</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="primary" className="w-full">
            Get Started
          </Button>
        </CardFooter>
      </div>
    </Card>
  )
}

// ============================================================================
// MODAL COMPONENT EXAMPLES
// ============================================================================

/**
 * Example 4: Confirmation Modal
 */
export function ConfirmationModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  const handleConfirm = () => {
    console.log('Action confirmed')
    setIsOpen(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Delete Item</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Deletion"
        description="Are you sure you want to delete this item? This action cannot be undone."
        size="sm"
      >
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}

/**
 * Example 5: Form Modal
 */
export function FormModalExample() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', { name, email })
    setIsOpen(false)
    setName('')
    setEmail('')
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Add User</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New User"
        description="Enter the user's information below"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add User
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

/**
 * Example 6: Large Content Modal
 */
export function LargeContentModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>View Details</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Terms and Conditions"
        size="xl"
      >
        <div className="prose max-w-none">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing and using this service, you accept and agree to be
            bound by the terms and provision of this agreement.
          </p>
          <h3>2. Use License</h3>
          <p>
            Permission is granted to temporarily download one copy of the
            materials for personal, non-commercial transitory viewing only.
          </p>
          {/* More content... */}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </Modal>
    </>
  )
}

// ============================================================================
// PANEL COMPONENT EXAMPLES
// ============================================================================

/**
 * Example 7: Settings Panel
 */
export function SettingsPanelExample() {
  return (
    <Panel variant="bordered" padding="lg">
      <PanelHeader>
        <PanelTitle>Account Settings</PanelTitle>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </PanelHeader>
      <PanelContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <p className="text-gray-900">John Doe</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">john@example.com</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <p className="text-gray-900">Administrator</p>
          </div>
        </div>
      </PanelContent>
      <PanelFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="primary" className="ml-2">
          Save Changes
        </Button>
      </PanelFooter>
    </Panel>
  )
}

/**
 * Example 8: Panel Variants
 */
export function PanelVariantsExample() {
  return (
    <div className="space-y-4">
      <Panel variant="default">
        <PanelContent>
          <p>Default variant - clean white background</p>
        </PanelContent>
      </Panel>

      <Panel variant="bordered">
        <PanelContent>
          <p>Bordered variant - with border</p>
        </PanelContent>
      </Panel>

      <Panel variant="filled">
        <PanelContent>
          <p>Filled variant - with gray background</p>
        </PanelContent>
      </Panel>
    </div>
  )
}

/**
 * Example 9: Dashboard Panel
 */
export function DashboardPanelExample() {
  return (
    <Panel variant="bordered" rounded="lg">
      <PanelHeader>
        <PanelTitle>Recent Activity</PanelTitle>
        <Button size="sm" variant="ghost">
          View All
        </Button>
      </PanelHeader>
      <PanelContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">{item}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Activity {item}
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </PanelContent>
    </Panel>
  )
}

// ============================================================================
// COMBINED EXAMPLES
// ============================================================================

/**
 * Example 10: Card with Modal
 */
export function CardWithModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Premium Feature</CardTitle>
          <CardDescription>Unlock advanced capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Upgrade to access premium features including advanced analytics,
            custom integrations, and priority support.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            Learn More
          </Button>
        </CardFooter>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Premium Features"
        description="Everything you need to know about our premium plan"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Advanced Analytics</h4>
            <p className="text-sm text-gray-600">
              Get detailed insights into your data with custom reports and
              visualizations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Custom Integrations</h4>
            <p className="text-sm text-gray-600">
              Connect with your favorite tools and automate your workflow.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Priority Support</h4>
            <p className="text-sm text-gray-600">
              Get help when you need it with 24/7 priority support.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Maybe Later
          </Button>
          <Button variant="primary" onClick={() => setIsOpen(false)}>
            Upgrade Now
          </Button>
        </div>
      </Modal>
    </>
  )
}
