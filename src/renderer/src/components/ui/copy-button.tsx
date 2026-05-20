"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, type MouseEvent } from "react";
const CopyButton = ({
  onClick,
  className,
  size,
  variant,
}: {
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) => {
  const [openTooltip, setOpenTooltip] = useState(false);

  return (
    <Button
      variant={variant ?? "styleLess"}
      size={size ?? "smallIcon"}
      className={cn("hover:bg-inherit hover:text-gray-5", className)}
      type="button"
      onClick={onClick}
      manualTooltip="Copied!"
      onBlur={() => setOpenTooltip(false)}
      onManualTooltipChange={setOpenTooltip}
    >
      {!openTooltip ? (
        <i className="ri-file-copy-2-line ri-xl" />
      ) : (
        <i className="ri-check-fill ri-xl text-green-3 dark:text-dark-green-2" />
      )}
    </Button>
  );
};

export default CopyButton;
