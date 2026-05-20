import { type EditCodeSnippetType } from "@/components/contexts/CodeSnippetContext";
import CommonCodeSnippetModal from "@/components/modals/codes/CommonCodeSnippetModal";
import { ModalContext } from "@/components/modals/ModalManager";
import { useAddCodeSnippet } from "@/hooks/codeSnippet";
import { useClientStore } from "@/store/store";
import _ from "lodash/fp";
import {
  useCallback,
  useContext,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { uid } from "uid";
import { v4 as uuidv4 } from "uuid";

const CreateCodeSnippetModal = () => {
  const { closeModal, showConfirmModal } = useContext(ModalContext);

  const tags = useClientStore((state) => state.tags);
  const addCodeSnippet = useAddCodeSnippet();

  const [open, setOpen] = useState(true);

  const [newCodeSnippet, setNewCodeSnippet] = useState<EditCodeSnippetType>({
    tags: [],
    pinned: false,
    isEditable: true,
    currentLanguage: "auto",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    id: uuidv4(),
    isAutoLanguageDetection: true,
    comments: [],
    code: "",
    title: "",
    deletedAt: null,
    publishId: null,
    shareId: null,
    versionHash: uid(),
  });

  const isCanBeSaved = useMemo(
    () => !!newCodeSnippet.title && !!newCodeSnippet.code,
    [newCodeSnippet.title, newCodeSnippet.code],
  );

  const handleCloseModal = useCallback(() => {
    // check if there are any changes
    if (!(newCodeSnippet.title.length || newCodeSnippet.code.length)) {
      setOpen(false);
      closeModal();
      return;
    }
    // show modal that confirm that all changes will be lost
    showConfirmModal({
      modalType: "CONFIRM_DELETE_MODAL",
      modalProps: {
        removeCallback: closeModal,
        type: "CODE",
        text: "Are you sure you want to discard all changes?",
      },
    });
  }, [
    closeModal,
    newCodeSnippet.code.length,
    newCodeSnippet.title.length,
    showConfirmModal,
  ]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const { title, code } = newCodeSnippet;
      if (!title) {
        toast.error("Title must be filled");
        return;
      }
      if (!code) {
        toast.error("Code must be filled");
        return;
      }
      // snippet with same title already exists
      if (!isCanBeSaved) {
        toast.error("Snippet with same title already exists");
        return;
      }
      const result = await addCodeSnippet(
        {
          ..._.omit("isAutoLanguageDetection", newCodeSnippet),
        },
      );
      if (result) {
        closeModal();
      }
    },
    [addCodeSnippet, closeModal, isCanBeSaved, newCodeSnippet],
  );

  const handleBlockEdit = () => {
    setNewCodeSnippet({
      ...newCodeSnippet,
      isEditable: !newCodeSnippet.isEditable,
    });
  };

  const handleCreateComment = (text: string) => {
    const newComment: ClientComment = {
      id: uuidv4(),
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      versionHash: uid(),
    };

    setNewCodeSnippet({
      ...newCodeSnippet,
      comments: [...newCodeSnippet.comments, newComment],
    });
  };

  const handlePin = () => {
    setNewCodeSnippet({
      ...newCodeSnippet,
      pinned: !newCodeSnippet.pinned,
    });
  };

  const handleTitleChange = (value: string) => {
    setNewCodeSnippet({
      ...newCodeSnippet,
      title: value,
    });
  };

  const handleRemoveTag = (tagId: string) => {
    setNewCodeSnippet({
      ...newCodeSnippet,
      tags: newCodeSnippet.tags.filter((tId) => tId !== tagId),
    });
  };

  const handleSelectTag = (tagId: string) => {
    const alreadySelected = newCodeSnippet.tags.find((tId) => tId === tagId);

    if (alreadySelected) {
      setNewCodeSnippet({
        ...newCodeSnippet,
        tags: _.compact(
          newCodeSnippet.tags.map((tag) => {
            if (tag === alreadySelected) {
              return null;
            }
            return tag;
          }),
        ),
      });
    } else {
      const selectedTag = tags.find((tag) => tag.id === tagId);
      if (selectedTag) {
        setNewCodeSnippet({
          ...newCodeSnippet,
          tags: [...newCodeSnippet.tags, selectedTag.id],
        });
      }
    }
  };

  const handleRemove = () => {
    if (!isCanBeSaved) {
      handleCloseModal();
      return;
    }

    showConfirmModal({
      modalType: "CONFIRM_DELETE_MODAL",
      modalProps: {
        removeCallback: closeModal,
        type: "CODE",
      },
    });
  };

  return (
    <CommonCodeSnippetModal
      {...{
        comments: newCodeSnippet.comments,
        editingCodeSnippet: newCodeSnippet,
        handleBlockEdit,
        handleCreateComment,
        handlePin,
        handleRemove,
        handleRemoveTag,
        handleSelectTag,
        handleSubmit,
        handleTitleChange,
        isCanBeSaved,
        open,
        setEditingCodeSnippet: setNewCodeSnippet,
        showConfirmModal,
        tags,
        handleCloseModal,
        isDeletedContainer: false,
        canShare: false,
      }}
    />
  );
};

export default CreateCodeSnippetModal;
