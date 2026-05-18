import { ModalContext } from "@/components/modals/ModalManager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useContext, useState, type FormEvent } from "react";

const texts = {
  TAG: "Are you sure you want to delete this tag?",
  CODE: "Are you sure you want to delete this script?",
  SIGNOUT:
    "Are you sure? It's clear local data for security reasons. All data will saved in your account.",
};

const ConfirmDeleteModal = ({
  id,
  removeCallback,
  type,
  text,
  rejectCallback,
}: {
  id: string;
  removeCallback?: (id: string) => void;
  type: "TAG" | "CODE" | "SIGNOUT";
  text?: string;
  rejectCallback?: () => void;
}) => {
  const { closeConfirmModal } = useContext(ModalContext);

  const [open, setOpen] = useState(true);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    removeCallback?.(id);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    rejectCallback?.();
    setOpen(false);
    closeConfirmModal("CONFIRM_DELETE_MODAL");
  };

  const defaultText = texts[type];

  // FIXME: fix type of component + naming
  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="w-5/6 rounded-2xl p-3 shadow md:w-auto md:px-10 md:py-7">
        <VisuallyHidden asChild>
          <DialogTitle>Confirm Delete Modal</DialogTitle>
        </VisuallyHidden>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center">
            <h1 className="text-balance text-center font-medium">
              {text ? text : defaultText}
            </h1>
          </div>
          <DialogFooter className="flex flex-row gap-3 pt-12">
            <Button type="submit" variant="destructive">
              {text ? "Yes" : "Delete"}
            </Button>
            <Button type="button" onClick={handleCloseModal} variant="accent">
              {text ? "No" : "Cancel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteModal;
