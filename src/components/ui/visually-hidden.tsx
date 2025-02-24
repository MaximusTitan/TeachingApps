import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

export function VisuallyHidden({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden whitespace-nowrap border-0",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
