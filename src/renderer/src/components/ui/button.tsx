"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 text-sm",
  {
    variants: {
      variant: {
        default:
          "dark:text-dark-gray-1 focus-visible:ring-gray-4 dark:focus-visible:ring-dark-gray-1 text-gray-7 bg-gray-1 hover:bg-gray-2 border border-gray-4 hover:text-gray-9 dark:bg-dark-gray-7 dark:hover:bg-dark-gray-4 dark:border-dark-gray-1 dark:hover:border-dark-gray-4",
        tag: "text-gray-7 hover:bg-gray-2 bg-transparent dark:text-dark-gray-1 dark:hover:bg-dark-gray-6 focus-visible:ring-gray-4 dark:focus-visible:ring-dark-gray-1",
        tagSelected:
          "text-gray-7 hover:bg-gray-2 bg-gray-5 dark:text-dark-gray-1 dark:hover:bg-dark-gray-6 dark:bg-dark-gray-5 focus-visible:ring-gray-4 dark:focus-visible:ring-dark-gray-1",
        accent:
          "bg-gray-8 text-gray-1 hover:bg-gray-6 dark:text-dark-gray-8 dark:bg-dark-gray-1 dark:hover:bg-dark-gray-3 focus-visible:ring-gray-4 dark:focus-visible:ring-dark-gray-1",
        destructive:
          "underline bg-gray-1 dark:bg-dark-gray-7 dark:border-dark-gray-1 focus-visible:ring-gray-4 dark:focus-visible:ring-dark-gray-1 dark:hover:bg-red-1 dark:hover:border-red-1 text-red-2 hover:bg-red-1 border border-gray-4 hover:border-red-1",
        styleLess:
          "focus-visible:ring-gray-4 dark:focus-visible:ring-dark-gray-1",
        link: "text-gray-9 underline-offset-4 hover:underline dark:text-gray-1 focus-visible:ring-gray-4 dark:focus-visible:ring-dark-gray-1",
        landingMain:
          "!max-w-48 !px-3 text-dark-gray-8 rounded-xl bg-lime hover:opacity-80 text-gray-7 font-bold text-dark-gray-8",
      },
      size: {
        default: "h-[32px] px-4 py-2 w-full max-w-56",
        tag: "h-[30px] px-4 py-2 w-full max-w-56",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-[32px] w-[32px]",
        smallIcon: "h-[26px] w-[26px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  tooltip?: React.ReactNode;
  manualTooltip?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
  onManualTooltipChange?: (open: boolean) => void;
  onManualTooltipOpen?: () => void;
  visualDisable?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      tooltip,
      manualTooltip,
      onClick,
      onBlur,
      onManualTooltipChange,
      visualDisable,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    const [openTooltip, setOpenTooltip] = React.useState(false);
    const timerRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

    const [debounceOpenTooltip, { flush }] = useDebounce(openTooltip, 1000);

    React.useEffect(() => {
      if (openTooltip) {
        flush();
      }
    }, [flush, openTooltip]);

    React.useEffect(() => {
      onManualTooltipChange?.(openTooltip);
    }, [onManualTooltipChange, openTooltip]);

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      clearTimeout(timerRef.current);

      setOpenTooltip(true);
      onClick?.(e);
      timerRef.current = setTimeout(() => {
        setOpenTooltip(false);
      }, 5000);
    };

    if (tooltip && !manualTooltip) {
      return (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Comp
                className={cn(
                  buttonVariants({ variant, size, className }),
                  visualDisable ? "visuallyDisabled" : "",
                )}
                ref={ref}
                onClick={onClick}
                onBlur={onBlur}
                {...props}
              />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </>
      );
    }

    if (!tooltip && manualTooltip) {
      return (
        <>
          <Tooltip open={openTooltip}>
            <TooltipTrigger asChild>
              <Comp
                className={cn(
                  buttonVariants({ variant, size, className }),
                  visualDisable ? "visuallyDisabled" : "",
                )}
                ref={ref}
                onClick={handleClick}
                onBlur={(e) => {
                  setOpenTooltip(false);
                  onBlur?.(e);
                }}
                {...props}
              />
            </TooltipTrigger>
            <TooltipContent>{manualTooltip}</TooltipContent>
          </Tooltip>
        </>
      );
    }

    if (manualTooltip) {
      return (
        <>
          <Tooltip {...(openTooltip && { open: openTooltip })}>
            <TooltipTrigger asChild>
              <Comp
                className={cn(
                  buttonVariants({ variant, size, className }),
                  visualDisable ? "visuallyDisabled" : "",
                )}
                ref={ref}
                onClick={handleClick}
                onBlur={(e) => {
                  clearTimeout(timerRef.current);
                  setOpenTooltip(false);
                  onBlur?.(e);
                }}
                {...props}
              />
            </TooltipTrigger>
            <TooltipContent>
              {openTooltip
                ? manualTooltip
                : debounceOpenTooltip
                  ? manualTooltip
                  : tooltip}
            </TooltipContent>
          </Tooltip>
        </>
      );
    }

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          visualDisable ? "visuallyDisabled" : "",
        )}
        ref={ref}
        onClick={onClick}
        onBlur={onBlur}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
