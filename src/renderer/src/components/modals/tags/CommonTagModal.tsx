import ColorPickerComponent from "@/components/ColorPickerComponent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { type ChangeEvent, type FormEvent } from "react";

type CommonTagModalProps = {
  handleCloseModal: () => void;
  tagName: string;
  tagColor?: string;
  isTagExists: boolean;
  hangleInputValueChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  setTagColor: (color: string) => void;
  open: boolean;
  isEditing: boolean;
};

const CommonTagModal = ({
  handleCloseModal,
  tagName,
  tagColor,
  isTagExists,
  hangleInputValueChange,
  handleSubmit,
  setTagColor,
  open,
  isEditing,
}: CommonTagModalProps) => {
  const submitButtonTitle = isEditing ? "Update" : "Create";

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="w-5/6 p-3 shadow md:w-auto md:px-10 md:py-7 dark:shadow-none">
        <VisuallyHidden asChild>
          <DialogTitle>Tag Modal</DialogTitle>
        </VisuallyHidden>
        <form onSubmit={handleSubmit}>
          <div className="relative pb-1">
            <Input
              value={tagName}
              onChange={hangleInputValueChange}
              placeholder="Tag name"
              className={cn(isTagExists && "border-red-2")}
            />
            {isTagExists && (
              <span className="absolute right-0 text-xs text-red-2 underline">
                Tag already exists
              </span>
            )}
          </div>
          <div>
            <ColorPickerComponent
              handleColorChange={setTagColor}
              pickedColor={tagColor}
            />
          </div>
          <DialogFooter className="flex flex-row gap-3 pt-12">
            <Button onClick={handleCloseModal} type="button">
              Cancel
            </Button>
            <Button
              disabled={isTagExists || !tagName}
              type="submit"
              variant="accent"
            >
              {submitButtonTitle}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommonTagModal;
