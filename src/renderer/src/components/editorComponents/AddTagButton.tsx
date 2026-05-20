import type { JSX } from "react";
import { type EditCodeSnippetType } from "@/components/contexts/CodeSnippetContext";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/fixed-scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAddTag } from "@/hooks/tag";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/store/store";
import { useLayoutEffect, useState } from "react";

const AddTagButton = ({
  handleSelectTag,
  saveTags,
  editingCodeSnippet,
  triggerComponent,
  side = "right",
  align = "start",
}: {
  handleSelectTag: (tagId: string) => void;
  saveTags?: () => void;
  editingCodeSnippet: EditCodeSnippetType;
  triggerComponent?: JSX.Element;
  side?: "right" | "left" | "top" | "bottom" | undefined;
  align?: "start" | "center" | "end" | undefined;
}) => {
  const tags = useClientStore((state) => state.tags);

  const addTag = useAddTag();

  const [searchQuery, setSearchQuery] = useState("");

  const [newTag, setNewTag] = useState<string | null>(null);

  const handleCreateTag = async () => {
    const tagName = searchQuery;
    const tagColor =
      "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");

    await addTag(tagName, tagColor);

    setNewTag(tagName);
  };

  useLayoutEffect(() => {
    if (newTag) {
      const tag = tags.find((tag) => tag.name.includes(newTag));
      if (!tag) return;
      handleSelectTag(tag.id);
      setNewTag(null);
    }
  }, [handleSelectTag, newTag, tags]);

  const shouldShowSomething = tags.length > 0 || searchQuery;

  return (
    <Popover
      modal
      onOpenChange={(open) => {
        if (!open && saveTags) {
          saveTags();
        }
      }}
    >
      <PopoverTrigger asChild>
        {triggerComponent ?? <Button type="button">Add tag</Button>}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" side={side} align={align}>
        <Command
          filter={(value, search) => {
            const tag = tags.find(
              (tag) => tag.name.includes(search) && tag.id === value,
            );
            if (tag) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput
            placeholder="Search tag..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          {shouldShowSomething && (
            <CommandEmpty className="px-3 py-[14px] text-center text-sm">
              <Button
                className="mr-8 max-w-full flex-1 md:mr-auto"
                onClick={handleCreateTag}
              >
                Create tag
              </Button>
            </CommandEmpty>
          )}

          <ScrollArea
            className={
              "w-[200px] [&>[data-radix-scroll-area-viewport]]:max-h-[300px]"
            }
          >
            <CommandList>
              {shouldShowSomething ? (
                <CommandGroup>
                  {tags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.id}
                      onSelect={handleSelectTag}
                    >
                      <i
                        className={cn(
                          "ri-check-line font-semibold",
                          "mr-2 h-4 w-4",
                          editingCodeSnippet.tags.includes(tag.id)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <div className="flex w-full cursor-pointer items-center">
                        <i
                          className="ri-circle-fill pr-2"
                          style={{ color: tag.color }}
                        />
                        <span className="block flex-1 truncate">
                          {tag.name}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AddTagButton;
