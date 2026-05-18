import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type MouseEvent, type ReactNode } from "react";

const ButtonLikeRadio = ({
  selected,
  onClick,
  tooltipCnheckedName,
  tooltipUnheckedName,
  children,
}: {
  selected: boolean;
  onClick: (e: MouseEvent<HTMLElement>) => void;
  tooltipCnheckedName: string;
  tooltipUnheckedName: string;
  children: ReactNode;
}) => {
  return (
    <Button
      size="icon"
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-8 shadow-none hover:bg-gray-1 md:hover:bg-gray-2 dark:hover:bg-dark-gray-7 md:dark:hover:bg-dark-gray-4",
        selected && "text-gray-7 dark:text-dark-gray-1",
        !selected && "text-gray-4 dark:text-dark-gray-5",
      )}
      manualTooltip={selected ? tooltipCnheckedName : tooltipUnheckedName}
    >
      {children}
    </Button>
  );
};

export default ButtonLikeRadio;
