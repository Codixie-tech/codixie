import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[32px] w-full rounded-md border border-gray-4 bg-gray-1 px-3 py-2 text-sm placeholder:text-gray-5 focus-visible:outline-none focus-visible:ring-gray-4 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-gray-1 dark:bg-dark-gray-7 dark:placeholder:text-dark-gray-2 md:focus-visible:ring-2",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
