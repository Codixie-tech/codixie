import {
  type EditCodeSnippetType,
  type LanguageType,
} from "@/components/contexts/CodeSnippetContext";
import CommonCodeSnippetModal from "@/components/modals/codes/CommonCodeSnippetModal";
import { ModalContext } from "@/components/modals/ModalManager";
import {
  useDeletePermanentlyCodeSnippet,
  useGetDeletedCodeSnippets,
  useRestoreCodeSnippet,
} from "@/hooks/codeSnippet";
import { useClientStore } from "@/store/store";
import _ from "lodash/fp";
import {
  type FormEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const TrashCodeSnippetModal = ({ id }: { id: string }) => {
  const { closeModal, showConfirmModal } = useContext(ModalContext);

  const deletedCodeSnippets = useGetDeletedCodeSnippets();
  const deletePermanently = useDeletePermanentlyCodeSnippet();
  const restore = useRestoreCodeSnippet();
  const tags = useClientStore((state) => state.tags);

  const [open, setOpen] = useState(true);
  const comments = useClientStore((state) =>
    state.codeSnippets.flatMap((s) =>
      (s.comments ?? []).map((c) => ({ ...c, codeSnippetId: s.id })),
    ),
  );

  const currentCodeSnippet = useMemo(
    () => deletedCodeSnippets.find((c) => c.id === id),
    [id, deletedCodeSnippets],
  )!;

  const [editingCodeSnippet, setEditingCodeSnippet] =
    useState<EditCodeSnippetType>({
      ...currentCodeSnippet,
      currentLanguage: currentCodeSnippet?.currentLanguage as LanguageType,
      isAutoLanguageDetection: false,
      isEditable: false,
      comments: _.compact(
        comments.map((comment) => {
          if (comment.codeSnippetId === currentCodeSnippet?.id) {
            return comment.id;
          }
        }),
      ),
    });

  // Permanently delete it
  const handleCloseModal = useCallback(() => {
    setOpen(false);
    closeModal();
  }, [closeModal]);

  // Restore code snippet
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      void restore(editingCodeSnippet);
      closeModal();
    },
    [restore, editingCodeSnippet, closeModal],
  );

  const handleRemove = () => {
    showConfirmModal({
      modalType: "CONFIRM_DELETE_MODAL",
      modalProps: {
        removeCallback() {
          void deletePermanently(editingCodeSnippet);
          closeModal();
        },
        id,
        type: "CODE",
        text: "Are you sure you want to permanently delete this code snippet?",
      },
    });
  };

  return (
    <CommonCodeSnippetModal
      {...{
        comments,
        editingCodeSnippet,
        handleRemove,
        handleSubmit,
        open,
        setEditingCodeSnippet,
        showConfirmModal,
        isCanBeSaved: true,
        tags,
        handleCloseModal,
        isDeletedContainer: true,
        canShare: false,
      }}
    />
  );
};

export default TrashCodeSnippetModal;
