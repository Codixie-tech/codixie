"use client";

import CommonTagModal from "@/components/modals/tags/CommonTagModal";
import { ModalContext } from "@/components/modals/ModalManager";
import { useUpdateTag } from "@/hooks/tag";
import { useClientStore } from "@/store/store";
import {
  useContext,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "sonner";

const UpdateTagModal = ({ id }: { id: string }) => {
  const { closeModal } = useContext(ModalContext);

  const tags = useClientStore((state) => state.tags);
  const updateTag = useUpdateTag();

  const editingTag = useMemo(
    () => tags.find((tag) => tag.id === id),
    [id, tags],
  );

  const [tagName, setTagName] = useState(editingTag?.name ?? "");
  const [tagColor, setTagColor] = useState<string | undefined>(
    editingTag?.color ?? undefined,
  );
  const [isTagExists, setIsTagExists] = useState(false);

  const [open, setOpen] = useState(true);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isTagExists) {
      toast("Tag already exists");
      return;
    }
    if (tagName.length === 0) {
      return;
    }

    if (tagName === editingTag?.name && tagColor === editingTag?.color) {
      return;
    }
    void updateTag({
      ...editingTag!,
      name: tagName,
      color: tagColor!,
      updatedAt: new Date(),
    });
    handleCloseModal();
  };

  const hangleInputValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    setTagName(inputValue);

    const foundTag = tags.find((tag) => tag.name === inputValue);

    if (foundTag && foundTag.id !== editingTag!.id) {
      return setIsTagExists(true);
    }
    setIsTagExists(false);
  };

  const handleCloseModal = () => {
    setOpen(false);
    closeModal();
  };

  return (
    <CommonTagModal
      {...{
        handleCloseModal,
        tagName,
        tagColor,
        isTagExists,
        hangleInputValueChange,
        handleSubmit,
        setTagColor,
        open,
        isEditing: true,
      }}
    />
  );
};

export default UpdateTagModal;
