import {
  CreateCodeSnippetContext,
} from "@/components/contexts/CodeSnippetContext";
import LanguageSelect from "@/components/editorComponents/LanguageSelect";
import CopyButton from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMobile } from "@/hooks/common/useMobile";
import { generateDeleteAfterDate } from "@/lib/dateUtils";
import { getCtrlKey } from "@/lib/platformUtils";
import { cn } from "@/lib/utils";
import { type MouseEvent, type ReactNode, useContext } from "react";

const NavbarButton = ({
  onClick,
  selected,
  innerClassName,
  className = "",
  tooltip,
  tooltipCnheckedName,
  tooltipUnheckedName,
}: {
  onClick: (e: MouseEvent<HTMLElement>) => void;
  selected: boolean;
  innerClassName: string | undefined;
  className?: string;
  tooltip?: ReactNode;
  tooltipCnheckedName: string;
  tooltipUnheckedName: string;
}) => {
  return (
    <Button
      size="icon"
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-8 shadow-none hover:bg-gray-1 md:hover:bg-gray-2 dark:hover:bg-dark-gray-7 md:dark:hover:bg-dark-gray-4",
        className,
      )}
      manualTooltip={selected ? tooltipCnheckedName : tooltipUnheckedName}
      tooltip={tooltip}
    >
      <i
        className={cn(
          "ri-xl",
          innerClassName,
          selected
            ? "text-gray-7 dark:text-dark-gray-1"
            : "text-gray-4 dark:text-dark-gray-5",
        )}
      />
    </Button>
  );
};

const MobileViewOrder = ({
  handleCopyClick,
}: {
  handleCopyClick: (e: MouseEvent<HTMLElement>) => void;
}) => {
  const { editingCodeSnippet, handleBlockEdit, handlePin, isDeletedContainer } =
    useContext(CreateCodeSnippetContext);

  return (
    <>
      <CopyButton
        onClick={handleCopyClick}
        size="icon"
        variant="default"
        className="min-w-8 shadow-none"
      />
      {!isDeletedContainer && (
        <>
          <NavbarButton
            innerClassName="ri-lock-2-line"
            onClick={handleBlockEdit ? handleBlockEdit : () => void 0}
            selected={!editingCodeSnippet.isEditable}
            tooltipCnheckedName="Locked!"
            tooltipUnheckedName="Unlocked!"
          />
          <NavbarButton
            innerClassName="ri-pushpin-line"
            onClick={handlePin ? handlePin : () => void 0}
            selected={editingCodeSnippet.pinned}
            tooltipCnheckedName="Pinned!"
            tooltipUnheckedName="Unpinned!"
          />
        </>
      )}
      <LanguageSelect />
    </>
  );
};

const DesktopViewOrder = ({
  handleCopyClick,
}: {
  handleCopyClick: (e: MouseEvent<HTMLElement>) => void;
}) => {
  const {
    editingCodeSnippet,
    handleBlockEdit,
    handlePin,
    handleRemove,
    isDeletedContainer,
  } = useContext(CreateCodeSnippetContext);

  const ctrlKey = getCtrlKey();

  return (
    <>
      <LanguageSelect />
      <CopyButton
        onClick={handleCopyClick}
        size="icon"
        variant="default"
        className="min-w-8 shadow-none"
      />
      <Button
        type="button"
        size="icon"
        onClick={handleRemove}
        className="hidden min-w-8 shadow-none md:flex md:justify-center"
        tooltip={
          <p className="flex items-center gap-1">
            Delete <kbd>{ctrlKey}+Shift+D</kbd>
          </p>
        }
      >
        <i className="ri-delete-bin-6-line ri-lg" />
      </Button>
      {!isDeletedContainer && (
        <>
          <NavbarButton
            innerClassName="ri-lock-2-line"
            onClick={handleBlockEdit ? handleBlockEdit : () => void 0}
            selected={!editingCodeSnippet.isEditable}
            tooltipCnheckedName="Locked!"
            tooltipUnheckedName="Unlocked!"
            tooltip={
              <p className="flex items-center gap-1">
                Block editor <kbd>{ctrlKey}+Shift+B</kbd>
              </p>
            }
          />

          <NavbarButton
            innerClassName="ri-pushpin-line"
            onClick={handlePin ? handlePin : () => void 0}
            selected={editingCodeSnippet.pinned}
            tooltipCnheckedName="Pinned!"
            tooltipUnheckedName="Unpinned!"
            tooltip={
              <p className="flex items-center gap-1">
                Pin <kbd>{ctrlKey}+Shift+P</kbd>
              </p>
            }
          />
        </>
      )}
    </>
  );
};

const Navbar = () => {
  const isMobile = useMobile();

  const {
    editingCodeSnippet,
    handleTitleChange,
    handleCloseModal,
    isDeletedContainer,
  } = useContext(CreateCodeSnippetContext);

  const handleCopyClick = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(editingCodeSnippet.code);
  };

  const deletedAtfer = editingCodeSnippet.deletedAt
    ? generateDeleteAfterDate(editingCodeSnippet.deletedAt)
    : null;

  // if it will be deleted in that day, say it
  const removeText =
    deletedAtfer && deletedAtfer < 0
      ? "Removal today"
      : `Removal after ${deletedAtfer} days`;

  return (
    <header className="flex h-[60px] w-full items-center gap-4 !rounded-b-none bg-gray-2 p-3 md:rounded-r-[14px] dark:bg-dark-gray-6">
      <div className="hidden flex-1 justify-start md:flex">
        {isDeletedContainer ? (
          <span>{editingCodeSnippet.title}</span>
        ) : (
          <Input
            onChange={(e) => handleTitleChange?.(e.target.value)}
            value={editingCodeSnippet.title ?? ""}
            placeholder="Title"
            className="ml-[18px] flex w-full max-w-80 flex-1"
          />
        )}
      </div>

      <Button
        type="button"
        size="icon"
        onClick={handleCloseModal}
        className="min-w-8 md:hidden"
      >
        <i className="ri-arrow-left-s-line ri-2x text-gray-7 dark:text-dark-gray-1" />
      </Button>

      <div className="ml-auto flex items-center gap-4">
        {isDeletedContainer ? (
          <>
            <div className="flex flex-col items-center justify-center">
              <span>{new Date(editingCodeSnippet.updatedAt).toLocaleDateString()}</span>
              <span className="text-xs">{removeText}</span>
            </div>
          </>
        ) : (
          <span className="text-sm font-semibold text-gray-6 dark:text-dark-gray-1">
            {new Date(editingCodeSnippet.updatedAt).toLocaleDateString()}
          </span>
        )}
        <div className="flex gap-3">
          {isMobile ? (
            <MobileViewOrder handleCopyClick={handleCopyClick} />
          ) : (
            <DesktopViewOrder handleCopyClick={handleCopyClick} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
