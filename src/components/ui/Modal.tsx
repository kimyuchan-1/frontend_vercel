'use client'

import { Fragment, ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

/**
 * Modal Component
 * 
 * A fully accessible modal dialog component built with Headless UI.
 * Includes focus trapping, keyboard navigation, and smooth transitions.
 * 
 * **Note**: This is a client component and requires 'use client' directive.
 * 
 * @example
 * // Basic usage
 * const [isOpen, setIsOpen] = useState(false)
 * 
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   description="Are you sure you want to proceed?"
 * >
 *   <div className="mt-4">
 *     <Button onClick={() => setIsOpen(false)}>Confirm</Button>
 *   </div>
 * </Modal>
 * 
 * @example
 * // Large modal without close button
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   size="lg"
 *   showCloseButton={false}
 * >
 *   <CustomContent />
 * </Modal>
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all',
                  {
                    'max-w-md': size === 'sm',
                    'max-w-lg': size === 'md',
                    'max-w-2xl': size === 'lg',
                    'max-w-4xl': size === 'xl',
                  }
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        {title}
                      </Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="mt-2 text-sm text-gray-500">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  
                  {/* Close button */}
                  {showCloseButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="ml-4 p-2 hover:cursor-pointer"
                      aria-label="Close modal "
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  )}
                </div>

                {/* Content */}
                <div className="mt-4">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

Modal.displayName = 'Modal'
