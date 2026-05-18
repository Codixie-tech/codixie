import { ModalContext } from "@/components/modals/ModalManager";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useContext, useState } from "react";

/**
 * acceptCallback - Merge
 * rejectCallback - Start new Project
 */
const ImportVariantModal = ({
  acceptCallback,
  rejectCallback,
}: {
  acceptCallback: () => void;
  rejectCallback: () => void;
}) => {
  const { closeConfirmModal, showConfirmModal } = useContext(ModalContext);

  const [open, setOpen] = useState(true);

  const handleStartNewProject = () => {
    showConfirmModal({
      modalType: "CONFIRM_DELETE_MODAL",
      modalProps: {
        type: "CODE",
        text: "Are you sure you want to start new project? All previous data will be lost.",
        removeCallback: () => {
          handleCloseModal();
          rejectCallback();
        },
      },
    });
  };

  const handleMergeProject = () => {
    acceptCallback();
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setOpen(false);
    closeConfirmModal("IMPORT_VARIANT_MODAL");
  };
  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="w-5/6 rounded-2xl p-3 shadow md:w-auto md:max-w-[800px] md:px-10 md:py-7">
        <VisuallyHidden asChild>
          <DialogTitle>Import Variants Modal</DialogTitle>
        </VisuallyHidden>
        <div className="grid grid-cols-2 grid-rows-[2fr_1fr] gap-5">
          <div>
            <h2 className="pb-3 text-center text-xl font-semibold">
              Import as new
            </h2>
            <p className="text-center">
              Start new project from imported project. All previous data will be{" "}
              <span className="text-red-2 dark:text-dark-red-2">lost!</span>
            </p>
          </div>
          <div>
            <h2 className="pb-3 text-center text-xl font-semibold">
              Merge with current
            </h2>
            <p className="text-center">
              Apply imported project to current. All previous data will be{" "}
              <span className="text-green-3 dark:text-dark-green-3">kept.</span>
            </p>
          </div>
          <Button
            onClick={handleStartNewProject}
            type="submit"
            variant="destructive"
            className="self-end"
          >
            Start new
          </Button>
          <Button
            className="self-end"
            type="button"
            onClick={handleMergeProject}
            variant="accent"
          >
            Merge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportVariantModal;
