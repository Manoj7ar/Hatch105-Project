import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const FocusInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function FocusInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "hatch-focus-ring w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400",
        className
      )}
      {...props}
    />
  );
});
