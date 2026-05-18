import {
  CreateCodeSnippetContext,
  type EditCodeSnippetType,
} from "@/components/contexts/CodeSnippetContext";
import CodeSnippetEditor from "@/components/editorComponents/CodeSnippetEditor";
import MobileCodeSnippetEditor from "@/components/editorComponents/mobile/MobileCodeSnippetEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/common/useMobile";
import { getCtrlKey } from "@/lib/platformUtils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  useEffect,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

type CommonCodeSnippetModalProps = {
  open: boolean;
  handleCloseModal: () => void;
  handleRemove: () => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  handleRemoveTag?: (tag: string) => void;
  handleSelectTag?: (tag: string) => void;
  handleBlockEdit?: () => void;
  handlePin?: () => void;
  handleTitleChange?: (title: string) => void;
  handleCreateComment?: (text: string) => void;
  comments: ClientComment[];
  isCanBeSaved: boolean | "";
  editingCodeSnippet: EditCodeSnippetType;
  setEditingCodeSnippet: Dispatch<SetStateAction<EditCodeSnippetType>>;
  saveTags?: () => void;
  isDeletedContainer: boolean;
  canShare: boolean;
};

const CommonCodeSnippetModal = ({
  handleCloseModal,
  open,
  handleRemove,
  comments,
  handleBlockEdit,
  handleCreateComment,
  handlePin,
  handleRemoveTag,
  handleSelectTag,
  handleSubmit,
  handleTitleChange,
  isCanBeSaved,
  editingCodeSnippet,
  setEditingCodeSnippet,
  saveTags,
  isDeletedContainer,
  canShare,
}: CommonCodeSnippetModalProps) => {
  const isMobile = useMobile();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.code;
      const command = e.metaKey || e.ctrlKey;
      const shift = e.shiftKey;

      if (!open) return;
      if (command && shift) {
        if (key === "KeyD") {
          e.preventDefault();
          handleRemove();
        }
      }

      if (command && shift) {
        if (key === "KeyP") {
          e.preventDefault();
          handlePin?.();
        }
      }

      if (command && shift) {
        if (key === "KeyB") {
          e.preventDefault();
          handleBlockEdit?.();
        }
      }

      if (command && shift) {
        if (key === "KeyS") {
          e.preventDefault();
          void handleSubmit(e as unknown as FormEvent<HTMLFormElement>); // event doen't matter
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [handleBlockEdit, handlePin, handleRemove, handleSubmit, open]);

  const saveTitle = isDeletedContainer ? "Restore" : "Save";

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleCloseModal}>
        <SheetContent
          side="bottom"
          className="flex h-dvh w-screen items-center justify-center"
        >
          <VisuallyHidden>
            <SheetTitle>CodeSnippet Modal</SheetTitle>
          </VisuallyHidden>

          <form onSubmit={handleSubmit} className="h-full w-full">
            <CreateCodeSnippetContext.Provider
              value={{
                editingCodeSnippet,
                setEditingCodeSnippet,
                handleBlockEdit,
                handleCreateComment,
                handlePin,
                handleTitleChange,
                handleRemoveTag,
                handleSelectTag,
                handleCloseModal,
                comments,
                handleRemove,
                saveTags,
                isDeletedContainer,
                canShare,
              }}
            >
              <MobileCodeSnippetEditor
                handleRemove={handleRemove}
                isCanBeSaved={!!isCanBeSaved}
                isDeletedContainer={isDeletedContainer}
              />
            </CreateCodeSnippetContext.Provider>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  const ctrlKey = getCtrlKey();

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="h-[85%] w-full max-w-6xl p-0 shadow dark:shadow-none">
        <VisuallyHidden asChild>
          <DialogTitle>CodeSnippet Modal</DialogTitle>
        </VisuallyHidden>
        <form onSubmit={handleSubmit} className="w-full">
          <CreateCodeSnippetContext.Provider
            value={{
              editingCodeSnippet,
              setEditingCodeSnippet,
              handleBlockEdit,
              handleCreateComment,
              handlePin,
              handleTitleChange,
              handleRemoveTag,
              handleSelectTag,
              handleCloseModal,
              comments,
              handleRemove,
              saveTags,
              isDeletedContainer,
              canShare,
            }}
          >
            <CodeSnippetEditor />
          </CreateCodeSnippetContext.Provider>

          <DialogFooter className="absolute bottom-3 right-3 flex w-full gap-3">
            <Button
              type="button"
              className="w-full max-w-36"
              onClick={handleCloseModal}
              tooltip={
                <p className="flex items-center gap-1">
                  Close <kbd>Esc</kbd>
                </p>
              }
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="accent"
              visualDisable={!isCanBeSaved}
              className="w-full max-w-36"
              tooltip={
                <p className="flex items-center gap-1">
                  {saveTitle} <kbd>{ctrlKey}+Shift+S</kbd>
                </p>
              }
            >
              {saveTitle}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommonCodeSnippetModal;
