import {
  CreateCodeSnippetContext,
  type LanguageType,
  searchLanguages,
} from "@/components/contexts/CodeSnippetContext";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useContext, useMemo, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";

const LanguageSelect = () => {
  const {
    editingCodeSnippet: newCodeSnippet,
    setEditingCodeSnippet: setNewCodeSnippet,
  } = useContext(CreateCodeSnippetContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [languageSelectorOpen, setLanguageSelectorOpen] = useState(false);

  const handleSelectLanguage = (language: string) => {
    let isAutoLanguageDetection = false;
    if (language === "auto") {
      isAutoLanguageDetection = true;
    }

    setNewCodeSnippet((prev) => ({
      ...prev,
      currentLanguage: language as LanguageType,
      isAutoLanguageDetection,
    }));
    setLanguageSelectorOpen(false);
  };

  const buttonShowingLanguage = useMemo(() => {
    if (
      newCodeSnippet.isAutoLanguageDetection &&
      newCodeSnippet.currentLanguage === "auto"
    ) {
      return newCodeSnippet.currentLanguage;
    }
    return newCodeSnippet.isAutoLanguageDetection &&
      newCodeSnippet.currentLanguage !== "auto"
      ? `auto (${newCodeSnippet.currentLanguage})`
      : newCodeSnippet.currentLanguage;
  }, [newCodeSnippet.currentLanguage, newCodeSnippet.isAutoLanguageDetection]);

  return (
    <Popover
      modal
      open={languageSelectorOpen}
      onOpenChange={setLanguageSelectorOpen}
    >
      <PopoverTrigger asChild>
        <Button
          className="w-full max-w-40 flex-1 "
          role="combobox"
          aria-expanded={languageSelectorOpen}
        >
          {buttonShowingLanguage}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search language..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty className="py-2 text-center text-sm">
            <span>Language not found</span>
          </CommandEmpty>
          <ScrollArea
            className={"[&>[data-radix-scroll-area-viewport]]:max-h-[300px]"}
          >
            <CommandList>
              <CommandGroup>
                {searchLanguages.map((language) => (
                  <CommandItem
                    key={language}
                    value={language}
                    onSelect={handleSelectLanguage}
                  >
                    <span className="overflow-clip break-words">
                      {language}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSelect;
