'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl text-sm font-medium bg-secondary text-foreground placeholder:text-muted-foreground border border-border outline-none transition-all focus:ring-2 focus:ring-ring/30',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
