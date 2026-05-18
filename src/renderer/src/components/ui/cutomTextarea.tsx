"use client";

import { cn } from "@/lib/utils";
import React from "react";
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from "react-textarea-autosize";

const CustomTextarea = React.forwardRef<
  React.ElementRef<typeof TextareaAutosize>,
  TextareaAutosizeProps
>(({ className, ...props }, ref) => (
  <TextareaAutosize
    {...props}
    ref={ref}
    className={cn(
      "flex w-full rounded-lg bg-gray-4 px-3 py-2 text-sm text-gray-7 placeholder:text-gray-6 focus-visible:outline-none focus-visible:ring-gray-4 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-gray-8 dark:text-dark-gray-1 dark:placeholder:text-dark-gray-3 md:focus-visible:ring-2",
      className,
    )}
  />
));

CustomTextarea.displayName = "CustomTextarea";

export default CustomTextarea;
