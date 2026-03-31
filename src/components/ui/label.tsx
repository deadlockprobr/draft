'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          'block text-xs font-semibold uppercase tracking-wider',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Label.displayName = 'Label'

export { Label }
