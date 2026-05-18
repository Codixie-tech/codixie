"use client";

import { ModalContext } from "@/components/modals/ModalManager";
import CommonTagModal from "@/components/modals/tags/CommonTagModal";
import { useAddTag } from "@/hooks/tag";
import { useClientStore } from "@/store/store";
import { useContext, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

const CreateTagModal = () => {
  const { closeModal } = useContext(ModalContext);

  const tags = useClientStore((state) => state.tags);
  const addTag = useAddTag();

  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState<string>();
  const [isTagExists, setIsTagExists] = useState(false);

  const [open, setOpen] = useState(true);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isTagExists) {
      toast.error("Tag already exists");
      return;
    }
    if (tagName.length === 0) {
      return;
    }
    if (tags.find((tag) => tag.name === tagName)) {
      return;
    }

    const result = await addTag(tagName, tagColor!);
    if (result) {
      handleCloseModal();
    }
  };
  const hangleInputValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    setTagName(inputValue);

    const foundTag = tags.find((tag) => tag.name === inputValue);

    if (foundTag) {
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
        isEditing: false,
      }}
    />
  );
};

export default CreateTagModal;
