import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type MouseEvent } from "react";

type ButtonLikeRadioProps = {
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  selected?: boolean;
  children?: React.ReactNode;
  tooltipCnheckedName: string;
  tooltipUnheckedName: string;
};

const ButtonLikeRadio = ({
  onClick,
  selected = false,
  children,
  tooltipCnheckedName,
  tooltipUnheckedName,
}: ButtonLikeRadioProps) => {
  return (
    <Button
      className={cn(
        "hover:bg-inherit hover:text-gray-5",
        selected
          ? "text-gray-7 dark:text-dark-gray-1"
          : "text-gray-4 dark:text-dark-gray-5",
      )}
      size="smallIcon"
      variant="styleLess"
      manualTooltip={selected ? tooltipCnheckedName : tooltipUnheckedName}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default ButtonLikeRadio;
