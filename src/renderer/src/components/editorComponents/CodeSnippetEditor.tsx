"use client";

import { Button } from "@/components/ui/button";
import { useContext, useState } from "react";

import {
  CreateCodeSnippetContext,
  type EditCodeSnippetType,
} from "@/components/contexts/CodeSnippetContext";
import AddTagButton from "@/components/editorComponents/AddTagButton";
import Comment from "@/components/editorComponents/Comment";
import EditorView from "@/components/editorComponents/EditorView";
import Navbar from "@/components/editorComponents/Navbar";
import CustomTextarea from "@/components/ui/cutomTextarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/store/store";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const CommentSection = ({
  handleCreateComment,
  editingCodeSnippet,
  comments,
  isDeletedContainer,
}: {
  handleCreateComment: (comment: string) => void;
  editingCodeSnippet: EditCodeSnippetType;
  comments: ClientComment[];
  isDeletedContainer: boolean;
}) => {
  const [animationParent] = useAutoAnimate();

  const [comment, setComment] = useState("");

  const onCreateComment = () => {
    if (!comment) return;
    handleCreateComment(comment);
    setComment("");
  };

  if (isDeletedContainer) {
    return (
      <div className="overflow-y-visible p-3" ref={animationParent}>
        {(editingCodeSnippet.comments ?? []).map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 px-3">
        <CustomTextarea
          value={comment}
          onChange={(e) => setComment(e.currentTarget.value)}
          placeholder="Comment"
          className="min-h-9"
        />

        <Button type="button" onClick={onCreateComment} disabled={!comment}>
          Send
        </Button>
      </div>

      <div className="overflow-y-visible p-3" ref={animationParent}>
        {(editingCodeSnippet.comments ?? []).map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
          />
        ))}
      </div>
    </>
  );
};

const Sidebar = () => {
  const {
    editingCodeSnippet,
    handleRemoveTag,
    handleSelectTag,
    handleCreateComment,
    saveTags,
    comments,
    isDeletedContainer,
  } = useContext(CreateCodeSnippetContext);

  const tags = useClientStore((state) => state.tags);

  const [animationParent] = useAutoAnimate();

  const [animationParentAnother] = useAutoAnimate();

  const shouldShowTagPanel =
    editingCodeSnippet.tags.length > 0;

  return (
    <div className="fixed left-0 top-0 flex h-full w-60 flex-col rounded-l-xl bg-gray-3 md:w-52 dark:bg-dark-gray-7">
      <ScrollArea>
        <div className="w-60 md:w-52">
          <div className={cn("px-3", "py-[14px]")} ref={animationParentAnother}>
            {!isDeletedContainer && (
              <div className={cn(shouldShowTagPanel && "mb-4")}>
                <AddTagButton
                  handleSelectTag={
                    handleSelectTag ? handleSelectTag : () => void 0
                  }
                  saveTags={saveTags}
                  editingCodeSnippet={editingCodeSnippet}
                />
              </div>
            )}

            {shouldShowTagPanel && (
              <div className="rounded-lg bg-gray-4 px-3 py-[6px] dark:bg-dark-gray-8">
                <h2 className="pl-3 text-sm font-semibold text-gray-6 dark:text-dark-gray-3">
                  Tags
                </h2>
                <div
                  className="flex min-h-8 flex-col gap-2 pt-4"
                  ref={animationParent}
                >
                  {editingCodeSnippet.tags.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <div
                        key={tagId}
                        className="flex items-center justify-start"
                      >
                        <i
                          className="ri-circle-fill pr-2"
                          style={{ color: tag.color }}
                        />
                        <span className="block flex-1 truncate text-sm">
                          {tag.name}
                        </span>
                        {!isDeletedContainer && (
                          <div
                            role="button"
                            tabIndex={0}
                            className="ml-auto cursor-pointer"
                            onClick={() => handleRemoveTag?.(tagId)}
                          >
                            <i className="ri-close-line ri-lg text-gray-7 dark:text-dark-gray-1" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <CommentSection
            isDeletedContainer={isDeletedContainer}
            editingCodeSnippet={editingCodeSnippet}
            handleCreateComment={
              handleCreateComment ? handleCreateComment : () => void 0
            }
            comments={comments}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

const CodeSnippetEditor = () => {
  return (
    <div className="flex h-full w-full rounded-xl bg-white dark:bg-[#1e1e1e]">
      <div className="shrink-0 basis-60 md:basis-52">
        <Sidebar />
      </div>
      <div className="h-[93%] w-full">
        <Navbar />
        <EditorView />
      </div>
    </div>
  );
};

export default CodeSnippetEditor;
