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
  useEffect,
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

  const comments = useClientStore((state) =>
    state.codeSnippets.flatMap((s) =>
      (s.comments ?? []).map((c) => ({ ...c, codeSnippetId: s.id })),
    ),
  );

  const [open, setOpen] = useState(true);

  const currentCodeSnippet = useMemo(
    () => allCodeSnippets.find((c) => c.id === id),
    [id, allCodeSnippets],
  )!;

  useEffect(() => {
    setEditingCodeSnippet({
      ...currentCodeSnippet,
      currentLanguage: currentCodeSnippet?.currentLanguage as LanguageType,
      isAutoLanguageDetection: false,
      comments: _.compact(
        comments.map((comment) => {
          if (comment.codeSnippetId === currentCodeSnippet?.id) {
            return comment.id;
          }
        }),
      ),
    });
  }, [comments, currentCodeSnippet]);

  const [editingCodeSnippet, setEditingCodeSnippet] =
    useState<EditCodeSnippetType>({
      ...currentCodeSnippet,
      currentLanguage: currentCodeSnippet?.currentLanguage as LanguageType,
      isAutoLanguageDetection: false,
      comments: _.compact(
        comments.map((comment) => {
          if (comment.codeSnippetId === currentCodeSnippet?.id) {
            return comment.id;
          }
        }),
      ),
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
    //if we don't change code or title, just close without sending to server
    if (
      title === currentCodeSnippet.title &&
      code === currentCodeSnippet.code &&
      currentCodeSnippet.currentLanguage === currentLanguage
    ) {
      setOpen(false);
      closeModal();
      return;
    }

    // snippet with same title already exists
    if (!isCanBeSaved) {
      toast.error("Snippet with same title already exists");
      return;
    }
    void updateCodeSnippet({
      ...editingCodeSnippet,
      title,
      code,
      updatedAt: new Date(),
      userId: null,
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
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: null,
      codeSnippetId: editingCodeSnippet.id,
      deletedAt: null,
      // shouldBeDeleted: false,
      versionHash: uid(),
    };

    void createComment(newComment);

    // TODO: It's a feature, not bug)) :D
    setEditingCodeSnippet({
      ...editingCodeSnippet,
      comments: [...editingCodeSnippet.comments, newComment.id],
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
        comments,
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
