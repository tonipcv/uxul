"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface PopoverContextValue {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  anchor: React.RefObject<HTMLButtonElement | null>
  onOpenChange?: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined)

function usePopoverContext() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("usePopoverContext must be used within a PopoverProvider")
  }
  return context
}

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const Popover = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange
}: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = React.useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    if (onOpenChange) {
      const nextValue = typeof value === "function" ? value(open) : value
      onOpenChange(nextValue)
    }
  }, [isControlled, onOpenChange, open])

  const anchorRef = React.useRef<HTMLButtonElement | null>(null)

  return (
    <PopoverContext.Provider value={{ open, setOpen, anchor: anchorRef, onOpenChange }}>
      {children}
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    const { setOpen, open, anchor } = usePopoverContext()
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      setOpen(!open)
      props.onClick?.(e)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: (node: HTMLButtonElement) => {
          // Handle forwardRef correctly for child elements
          const childRef = (children as any).ref
          if (typeof childRef === "function") {
            childRef(node)
          } else if (childRef) {
            (childRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
          }
          
          anchor.current = node
          if (ref) {
            if (typeof ref === "function") {
              ref(node)
            } else {
              ref.current = node
            }
          }
        },
        onClick: handleClick,
        ...props
      })
    }

    return (
      <button
        ref={(node) => {
          anchor.current = node
          if (ref) {
            if (typeof ref === "function") {
              ref(node)
            } else {
              ref.current = node
            }
          }
        }}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(
  (
    { className, align = "center", sideOffset = 4, children, ...props },
    ref
  ) => {
    const { open, setOpen, anchor } = usePopoverContext()
    const contentRef = React.useRef<HTMLDivElement | null>(null)
    const [position, setPosition] = React.useState({ top: 0, left: 0 })
    const [isClient, setIsClient] = React.useState(false)

    React.useEffect(() => {
      setIsClient(true)
    }, [])

    React.useEffect(() => {
      if (open && anchor.current && contentRef.current && isClient) {
        const anchorRect = anchor.current.getBoundingClientRect()
        const contentRect = contentRef.current.getBoundingClientRect()
        
        // Position based on alignment
        let top = anchorRect.bottom + sideOffset
        let left = anchorRect.left
        
        if (align === "center") {
          left = anchorRect.left + (anchorRect.width - contentRect.width) / 2
        } else if (align === "end") {
          left = anchorRect.right - contentRect.width
        }

        // Ensure content stays within viewport
        if (isClient && typeof window !== 'undefined') {
          const viewportWidth = window.innerWidth
          if (left < 0) left = 0
          if (left + contentRect.width > viewportWidth) {
            left = viewportWidth - contentRect.width
          }
        }

        setPosition({ top, left })
      }
    }, [open, align, sideOffset, isClient])

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          contentRef.current && 
          anchor.current &&
          !contentRef.current.contains(event.target as Node) &&
          !anchor.current.contains(event.target as Node)
        ) {
          setOpen(false)
        }
      }
      
      if (open) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [open, setOpen])

    if (!open) return null

    const content = (
      <div
        ref={(node) => {
          contentRef.current = node
          if (ref) {
            if (typeof ref === "function") {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }
        }}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        {...props}
      >
        {children}
      </div>
    )

    return createPortal(content, document.body)
  }
)
PopoverContent.displayName = "PopoverContent"

// We don't need to implement PopoverAnchor for this simplified version
const PopoverAnchor = ({ children }: { children: React.ReactNode }) => children

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
