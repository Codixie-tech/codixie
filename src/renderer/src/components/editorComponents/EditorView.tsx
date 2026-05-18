import {
  CreateCodeSnippetContext,
  type LanguageType,
} from "@/components/contexts/CodeSnippetContext";
import { languages } from "@/consts";
import { Editor, type Monaco } from "@monaco-editor/react";
import hljs from "highlight.js";
import { useTheme } from "next-themes";
import { useContext, useMemo, useRef } from "react";
import { useDebounce } from "use-debounce";

const languageException = ["other", "auto"];

const EditorView = () => {
  const { resolvedTheme } = useTheme();

  const {
    setEditingCodeSnippet: setNewCodeSnippet,
    editingCodeSnippet: newCodeSnippet,
  } = useContext(CreateCodeSnippetContext);

  const [debouncedCode] = useDebounce(newCodeSnippet.code, 1000);

  const editorRef = useRef<Monaco>(null);

  const language = useMemo(() => {
    // if we already pick some language - stay with it
    if (!newCodeSnippet.isAutoLanguageDetection) {
      return newCodeSnippet.currentLanguage;
    }
    let language: string;

    const temp = hljs.highlightAuto(
      debouncedCode ?? "",
      languages as unknown as string[],
    );
    if (
      (temp.language === "css" ||
        temp.language === "scss" ||
        temp.language === "less") &&
      temp.secondBest?.language
    ) {
      language = temp.secondBest?.language;
    }
    language = temp.language ?? "other";

    setNewCodeSnippet((prev) => ({
      ...prev,
      currentLanguage: language as LanguageType,
    }));

    return language;
  }, [
    debouncedCode,
    newCodeSnippet.currentLanguage,
    newCodeSnippet.isAutoLanguageDetection,
    setNewCodeSnippet,
  ]);

  const handleEditorDidMount = (_editor: unknown, monaco: Monaco) => {
    // @ts-ignore
    editorRef.current = monaco;
  };

  return (
    <div className="h-full w-full md:h-[calc(100%-70px)] md:pt-4">
      <Editor
        width="100%"
        language={languageException.includes(language) ? undefined : language}
        onMount={handleEditorDidMount}
        value={newCodeSnippet.code}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
        options={{
          autoDetectHighContrast: false,
          readOnly: !newCodeSnippet.isEditable,
          minimap: {
            enabled: false,
          },
          scrollbar: {
            vertical: "visible",
            verticalScrollbarSize: 5,
            horizontalScrollbarSize: 5,
          },
          useShadowDOM: false,
          mouseWheelZoom: true,
        }}
        onChange={(value) => {
          setNewCodeSnippet((prev) => ({ ...prev, code: value ?? "" }));
        }}
      />
    </div>
  );
};

export default EditorView;
