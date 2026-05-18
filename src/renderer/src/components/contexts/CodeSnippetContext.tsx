import { languages } from "@/consts";
import { createContext, type Dispatch, type SetStateAction } from "react";

export const searchLanguages = ["auto", "other", ...languages];

export type LanguageType = (typeof languages)[number] | "other" | "auto";

export type EditCodeSnippetType = ClientCodeSnippet & {
  isAutoLanguageDetection: boolean;
};

export type EditCodeSnippetContextType = {
  editingCodeSnippet: EditCodeSnippetType;
  setEditingCodeSnippet: Dispatch<SetStateAction<EditCodeSnippetType>>;

  handleRemoveTag?: (tagId: string) => void;
  handleSelectTag?: (tagId: string) => void;
  handleCreateComment?: (text: string) => void;

  handleBlockEdit?: () => void;
  handlePin?: () => void;
  handleTitleChange?: (title: string) => void;

  handleCloseModal: () => void;

  saveTags?: () => void;

  comments: ClientComment[];
  handleRemove: () => void;

  isDeletedContainer: boolean;

  canShare: boolean;
};

export const CreateCodeSnippetContext =
  createContext<EditCodeSnippetContextType>({} as EditCodeSnippetContextType);
