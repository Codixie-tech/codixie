"use client";

import { CreateCodeSnippetContext } from "@/components/contexts/CodeSnippetContext";
import AddTagButton from "@/components/editorComponents/AddTagButton";
import Comment from "@/components/editorComponents/Comment";
import EditorView from "@/components/editorComponents/EditorView";
import Navbar from "@/components/editorComponents/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomTextarea from "@/components/ui/cutomTextarea";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/store/store";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useContext, useState } from "react";

const MobileCommentViewModal = ({
  open,
  onOpenChange,
  isDeletedContainer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeletedContainer: boolean;
}) => {
  const { editingCodeSnippet, handleCreateComment, comments } = useContext(
    CreateCodeSnippetContext,
  );

  const [animationParent] = useAutoAnimate();

  const [comment, setComment] = useState("");

  const onCreateComment = () => {
    if (!comment) return;
    handleCreateComment?.(comment);
    setComment("");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="flex flex-col overflow-auto p-3 py-4"
          shouldShowCloseButton
        >
          <VisuallyHidden>
            <SheetTitle>Mobile CodeSnippet Editor</SheetTitle>
          </VisuallyHidden>
          <div className="flex flex-row items-center">
            <SheetClose asChild>
              <Button
                variant="styleLess"
                size="icon"
                className="mr-auto h-8 w-8 max-w-fit"
              >
                <i className="ri-arrow-left-double-line ri-lg max-w-8" />
              </Button>
            </SheetClose>
            <div className="flex flex-[3] justify-start">
              <h1 className="mx-auto pt-2 font-semibold">Comments</h1>
            </div>
          </div>
          <div className="py-2" ref={animationParent}>
            {!isDeletedContainer && (
              <>
                <div className="flex flex-col items-center space-y-2">
                  <CustomTextarea
                    placeholder="Comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={onCreateComment}
                    disabled={!comment}
                  >
                    Send
                  </Button>
                </div>
              </>
            )}
            <div className="py-5">
              {editingCodeSnippet.comments.map((commentId) => (
                <Comment
                  comment={comments.find((c) => c.id === commentId)}
                  key={commentId}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const MobileFooter = ({
  isCanBeSaved,
  handleRemove,
  isDeletedContainer,
}: {
  isCanBeSaved: boolean;
  handleRemove: () => void;
  isDeletedContainer: boolean;
}) => {
  const { editingCodeSnippet } = useContext(CreateCodeSnippetContext);
  const [commentModalOpen, setCommentModalOpen] = useState(false);

  const commentsCount = editingCodeSnippet.comments.length;

  const saveTitle = isDeletedContainer ? "Restore" : "Save";

  return (
    <>
      <MobileCommentViewModal
        open={commentModalOpen}
        onOpenChange={setCommentModalOpen}
        isDeletedContainer={isDeletedContainer}
      />
      <footer className="flex h-12 items-center bg-white px-3 dark:bg-[#1e1e1e]">
        <Button
          type="button"
          size="icon"
          className="relative"
          onClick={() => setCommentModalOpen(true)}
        >
          {commentsCount ? (
            <Badge className="absolute -right-2 -top-2 bg-red-2 p-1 py-0 text-gray-1 dark:text-dark-gray-1">
              {commentsCount}
            </Badge>
          ) : null}
          <i className="ri-chat-1-line ri-xl" />
        </Button>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            onClick={handleRemove}
            variant="destructive"
            className="text-delete underline"
          >
            Delete
          </Button>
          <Button variant="accent" visualDisable={!isCanBeSaved} type="submit">
            {saveTitle}
          </Button>
        </div>
      </footer>
    </>
  );
};

const MobileTitleInput = () => {
  const { editingCodeSnippet, handleTitleChange } = useContext(
    CreateCodeSnippetContext,
  );

  return (
    <div className="px-[50px]">
      <Input
        onChange={(e) => handleTitleChange?.(e.target.value)}
        value={editingCodeSnippet.title ?? ""}
        placeholder="Title"
        className=" text-dark w-full border-none bg-inherit font-medium placeholder:text-xl placeholder:font-medium dark:border-none dark:bg-inherit"
      />
    </div>
  );
};

const MobileTagView = () => {
  const { editingCodeSnippet, saveTags, handleSelectTag, isDeletedContainer } =
    useContext(CreateCodeSnippetContext);

  const tags = useClientStore((state) => state.tags);

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 overflow-hidden p-3",
        !isDeletedContainer ? "justify-between" : "",
      )}
    >
      {/* <div className="flex justify-start flex-wrap gap-2 overflow-hidden flex-1"> */}

      {/* Publish */}
      {editingCodeSnippet.publishId && (
        <div key="shared" className="flex max-w-24 items-center gap-1">
          <div className="h-2 w-2 shrink-0 rounded-full bg-lime" />
          <div className="text-foreground-base-light block truncate text-xs">
            Publish
          </div>
        </div>
      )}
      {/* Shared */}
      {editingCodeSnippet.shareId && (
        <div key="shared" className="flex max-w-24 items-center gap-1">
          <div className="h-2 w-2 shrink-0 rounded-full bg-lime" />
          <div className="text-foreground-base-light block truncate text-xs">
            Shared
          </div>
        </div>
      )}

      {editingCodeSnippet.tags.map((tagId) => (
        <div key={tagId} className="flex max-w-24 items-center gap-1">
          <div
            style={{ backgroundColor: tags.find((t) => t.id === tagId)?.color }}
            className="h-2 w-2 shrink-0 rounded-full"
          />
          <div className="text-foreground-base-light block truncate text-xs">
            {tags.find((t) => t.id === tagId)?.name}
          </div>
        </div>
      ))}
      {!isDeletedContainer && (
        <AddTagButton
          editingCodeSnippet={editingCodeSnippet}
          saveTags={saveTags}
          handleSelectTag={handleSelectTag ? handleSelectTag : () => void 0}
          side="bottom"
          triggerComponent={
            <Button
              variant="styleLess"
              className="mr-auto max-w-fit text-xs font-normal underline"
            >
              Add tag
            </Button>
          }
        />
      )}
    </div>
  );
};

const MobileCodeSnippetEditor = ({
  isCanBeSaved,
  handleRemove,
  isDeletedContainer,
}: {
  isCanBeSaved: boolean;
  handleRemove: () => void;
  isDeletedContainer: boolean;
}) => {
  return (
    <div className="h-dvh w-full">
      <div className="flex h-[calc(100%-48px)] flex-col bg-white dark:bg-[#1e1e1e]">
        <Navbar />
        <MobileTagView />
        <MobileTitleInput />
        <div className="mt-5 flex-1 overflow-auto">
          <EditorView />
        </div>
      </div>
      <MobileFooter
        isCanBeSaved={isCanBeSaved}
        handleRemove={handleRemove}
        isDeletedContainer={isDeletedContainer}
      />
    </div>
  );
};

export default MobileCodeSnippetEditor;
