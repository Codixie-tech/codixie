import {
  type EditCodeSnippetType,
  type LanguageType,
} from "@/components/contexts/CodeSnippetContext";
import CommonCodeSnippetModal from "@/components/modals/codes/CommonCodeSnippetModal";
import { ModalContext } from "@/components/modals/ModalManager";
import {
  useBlockEdit,
  useChangeTags,
  usePin,
  useRemoveCodeSnippet,
  useUpdateCodeSnippet,
} from "@/hooks/codeSnippet";
import { useCreateComment } from "@/hooks/comment";
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

const UpdateCodeSnippetModal = ({ id }: { id: string }) => {
  const { closeModal, showConfirmModal } = useContext(ModalContext);

  const pin = usePin();
  const blockEdit = useBlockEdit();

  const allCodeSnippets = useClientStore((state) => state.codeSnippets);
  const tags = useClientStore((state) => state.tags);

  const createComment = useCreateComment();
  const updateCodeSnippet = useUpdateCodeSnippet();
  const removeCodeSnippet = useRemoveCodeSnippet();
  const changeTags = useChangeTags();

  const [open, setOpen] = useState(true);

  const currentCodeSnippet = useMemo(
    () => allCodeSnippets.find((c) => c.id === id),
    [id, allCodeSnippets],
  )!;

  const [editingCodeSnippet, setEditingCodeSnippet] =
    useState<EditCodeSnippetType>({
      ...currentCodeSnippet,
      currentLanguage: currentCodeSnippet?.currentLanguage as LanguageType,
      isAutoLanguageDetection: false,
      comments: currentCodeSnippet?.comments ?? [],
    });

  const isCanBeSaved = useMemo(
    () => !!editingCodeSnippet.title && !!editingCodeSnippet.code,
    [editingCodeSnippet?.code, editingCodeSnippet?.title],
  );

  const handleCloseModal = useCallback(() => {
    // check if there are any changes
    if (
      currentCodeSnippet.title === editingCodeSnippet.title &&
      editingCodeSnippet.code === currentCodeSnippet.code
    ) {
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
    currentCodeSnippet?.code,
    currentCodeSnippet?.title,
    editingCodeSnippet?.code,
    editingCodeSnippet?.title,
    showConfirmModal,
  ]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { title, code, currentLanguage } = editingCodeSnippet;

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
    await updateCodeSnippet({
      ...editingCodeSnippet,
      title,
      code,
      currentLanguage,
      updatedAt: new Date().toISOString(),
    });
    setOpen(false);
    closeModal();
    return;
  };

  const closeAll = useCallback(() => {
    void removeCodeSnippet(editingCodeSnippet);
    handleCloseModal();
  }, [editingCodeSnippet, handleCloseModal, removeCodeSnippet]);

  const handleRemove = () => {
    if (!isCanBeSaved) {
      handleCloseModal();
      return;
    }

    showConfirmModal({
      modalType: "CONFIRM_DELETE_MODAL",
      modalProps: {
        id,
        removeCallback: closeAll,
        type: "CODE",
      },
    });
  };

  const handleBlockEdit = () => {
    void blockEdit(editingCodeSnippet);

    // TODO: It's a feature, not bug)) :D
    setEditingCodeSnippet({
      ...editingCodeSnippet,
      isEditable: !editingCodeSnippet.isEditable,
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

    void createComment(editingCodeSnippet.id, newComment);

    setEditingCodeSnippet({
      ...editingCodeSnippet,
      comments: [...(editingCodeSnippet.comments ?? []), newComment],
    });
  };

  const handlePin = () => {
    void pin(editingCodeSnippet);

    // TODO: It's a feature, not bug)) :D
    setEditingCodeSnippet({
      ...editingCodeSnippet,
      pinned: !editingCodeSnippet.pinned,
    });
  };

  const handleTitleChange = (value: string) => {
    setEditingCodeSnippet({
      ...editingCodeSnippet,
      title: value,
    });
  };

  const handleRemoveTag = (tagId: string) => {
    setEditingCodeSnippet({
      ...editingCodeSnippet,
      tags: editingCodeSnippet.tags.filter((tId) => tId !== tagId),
    });

    void changeTags(
      editingCodeSnippet.id,
      editingCodeSnippet.tags.filter((tId) => tId !== tagId),
    );
  };

  const saveTags = () => {
    void changeTags(editingCodeSnippet.id, editingCodeSnippet.tags);
  };

  const handleSelectTag = (tagId: string) => {
    const alreadySelected = editingCodeSnippet.tags.find(
      (tId) => tId === tagId,
    );

    if (alreadySelected) {
      const newTags = _.compact(
        editingCodeSnippet.tags.map((tag) => {
          if (tag === alreadySelected) {
            return null;
          }
          return tag;
        }),
      );

      setEditingCodeSnippet({
        ...editingCodeSnippet,
        tags: newTags,
      });
    } else {
      const selectedTag = tags.find((tag) => tag.id === tagId);
      if (selectedTag) {
        const newTags = [...editingCodeSnippet.tags, selectedTag.id];

        setEditingCodeSnippet({
          ...editingCodeSnippet,
          tags: newTags,
        });
      }
    }
  };

  // that fix bug when codeSnippet deleted
  if (!currentCodeSnippet) {
    return null;
  }

  return (
      <CommonCodeSnippetModal
      {...{
        comments: editingCodeSnippet.comments ?? [],
        editingCodeSnippet,
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
        setEditingCodeSnippet,
        showConfirmModal,
        tags,
        handleCloseModal,
        saveTags,
        isDeletedContainer: false,
        canShare: true,
      }}
    />
  );
};

export default UpdateCodeSnippetModal;
