import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import ImportVariantModal from "@/components/modals/ImportVariantModal";
import CreateCodeSnippetModal from "@/components/modals/codes/CreateCodeSnippetModal";
import TrashCodeSnippetModal from "@/components/modals/codes/TrashCodeSnippetModal";
import UpdateCodeSnippetModal from "@/components/modals/codes/UpdateCodeSnippetModal";
import CreateTagModal from "@/components/modals/tags/CreateTagModal";
import UpdateTagModal from "@/components/modals/tags/UpdateTagModal";
import { useMobile } from "@/hooks/common/useMobile";
import { createContext, useCallback, useMemo, useState } from "react";

const MODAL_TYPES = {
  CREATE_TAG_MODAL: "CREATE_TAG_MODAL",
  UPDATE_TAG_MODAL: "UPDATE_TAG_MODAL",
  CREATE_CODE_SNIPPET_MODAL: "CREATE_CODE_SNIPPET_MODAL",
  UPDATE_CODE_SNIPPET_MODAL: "UPDATE_CODE_SNIPPET_MODAL",
  TRASH_CODE_SNIPPET_MODAL: "TRASH_CODE_SNIPPET_MODAL",
} as const;

const MODAL_COMPONENTS = {
  [MODAL_TYPES.CREATE_TAG_MODAL]: CreateTagModal,
  [MODAL_TYPES.UPDATE_TAG_MODAL]: UpdateTagModal,
  [MODAL_TYPES.CREATE_CODE_SNIPPET_MODAL]: CreateCodeSnippetModal,
  [MODAL_TYPES.UPDATE_CODE_SNIPPET_MODAL]: UpdateCodeSnippetModal,
  [MODAL_TYPES.TRASH_CODE_SNIPPET_MODAL]: TrashCodeSnippetModal,
} as const;

const CONFIRM_MODAL_TYPES = {
  CONFIRM_DELETE_MODAL: "CONFIRM_DELETE_MODAL",
  IMPORT_VARIANT_MODAL: "IMPORT_VARIANT_MODAL",
} as const;

const CONFIRM_MODAL_COMPONENTS = {
  [CONFIRM_MODAL_TYPES.CONFIRM_DELETE_MODAL]: ConfirmDeleteModal,
  [CONFIRM_MODAL_TYPES.IMPORT_VARIANT_MODAL]: ImportVariantModal,
} as const;

type InputModalType = {
  modalType: keyof typeof MODAL_TYPES;
  modalProps?: { id?: string; type?: "TAG" | "CODE" };
};

export type ConfirmModalType = {
  modalType: keyof typeof CONFIRM_MODAL_TYPES;
  modalProps?: {
    id?: string;
    removeCallback?: (id: string) => void | Promise<void>;
    acceptCallback?: () => void | Promise<void>;
    rejectCallback?: () => void | Promise<void>;
    type: "TAG" | "CODE";
    text?: string;
  };
};

type GlobalModalContextType = {
  showModal: ({ modalType, modalProps }: InputModalType) => void;
  closeModal: () => void;
  showConfirmModal: ({ modalType, modalProps }: ConfirmModalType) => void;
  closeConfirmModal: (modalType: keyof typeof CONFIRM_MODAL_TYPES) => void;
};

export const ModalContext = createContext({} as GlobalModalContextType);

export function ModalManager({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  const [modal, setModal] = useState<InputModalType | null>(null);
  const [confirmModals, setConfirmModals] = useState<ConfirmModalType[]>([]);

  const showModal = useCallback(({ modalType, modalProps }: InputModalType) => {
    setModal({ modalProps, modalType });
  }, []);

  const showConfirmModal = useCallback(({ modalType, modalProps }: ConfirmModalType) => {
    setConfirmModals((prev) => [...prev, { modalProps, modalType }]);
  }, []);

  const closeModal = useCallback(() => {
    setTimeout(() => setModal(null), isMobile ? 300 : 200);
  }, [isMobile]);

  const closeConfirmModal = useCallback(
    (modalType: keyof typeof CONFIRM_MODAL_TYPES) => {
      setTimeout(() => {
        setConfirmModals((prev) => prev.filter((item) => item.modalType !== modalType));
      }, isMobile ? 300 : 200);
    },
    [isMobile],
  );

  const renderModal = () => {
    if (!modal) return null;
    const { modalProps, modalType } = modal;
    const Component = MODAL_COMPONENTS[modalType];
    if (!Component) return null;
    // @ts-expect-error fine
    return <Component {...modalProps} />;
  };

  const renderConfirmModal = () => {
    if (!confirmModals) return null;
    return confirmModals.map(({ modalProps, modalType }) => {
      const Component = CONFIRM_MODAL_COMPONENTS[modalType];
      if (!Component) return null;
      // @ts-expect-error fine
      return <Component key={modalType} {...modalProps} />;
    });
  };

  return (
    <ModalContext.Provider
      value={useMemo(
        () => ({ showModal, closeModal, closeConfirmModal, showConfirmModal }),
        [closeConfirmModal, closeModal, showConfirmModal, showModal],
      )}
    >
      {renderModal()}
      {renderConfirmModal()}
      {children}
    </ModalContext.Provider>
  );
}
