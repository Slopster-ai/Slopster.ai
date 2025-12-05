import * as React from 'react'
import { clsx } from 'clsx'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx('block text-sm text-muted', className)} {...props} />
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-xl bg-[#0e0f11] text-foreground placeholder-muted hairline px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
      {...props}
    />
  )
})

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full rounded-xl bg-[#0e0f11] text-foreground placeholder-muted hairline px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
      {...props}
    />
  )
})

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={clsx(
        'w-full rounded-xl bg-[#0e0f11] text-foreground hairline pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})


