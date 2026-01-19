import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * 
 * This function combines clsx for conditional class names and tailwind-merge
 * to handle Tailwind CSS class conflicts intelligently.
 * 
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4' (px-4 overrides px-2)
 * cn('text-red-500', condition && 'text-blue-500') // => conditional classes
 * 
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string with proper Tailwind precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
