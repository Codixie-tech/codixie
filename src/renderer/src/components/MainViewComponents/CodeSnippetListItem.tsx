import ButtonLikeRadio from "@/components/ui/button-like-radio";
import CopyButton from "@/components/ui/copy-button";
import { ModalContext } from "@/components/modals/ModalManager";
import { Button } from "@/components/ui/button";
import {
  useBlockEdit,
  useDeletePermanentlyCodeSnippet,
  usePin,
  useRestoreCodeSnippet,
} from "@/hooks/codeSnippet";
import { generateDeleteAfterDate } from "@/lib/dateUtils";
import { prepareForRender } from "@/lib/fuseUtils";
import { useClientStore } from "@/store/store";
import hljs from "highlight.js";
import { forwardRef, memo, useContext, useMemo, type MouseEvent } from "react";

type CodeSnippetListViewItemProps = {
  codeSnippet: ClientCodeSnippet;
  shouldHightlightCode: boolean;
  style?: React.CSSProperties;
  isDeletedContainer: boolean;
};

const CodeSnippetListItemOuter = forwardRef<
  HTMLDivElement,
  CodeSnippetListViewItemProps
>(({ codeSnippet, shouldHightlightCode, style, isDeletedContainer }, ref) => {
  const { showModal } = useContext(ModalContext);

  const handleShowEditModal = () => {
    showModal({
      modalType: "UPDATE_CODE_SNIPPET_MODAL",
      modalProps: {
        id: codeSnippet.id,
      },
    });
  };

  const handleShowTrashModal = () => {
    showModal({
      modalType: "TRASH_CODE_SNIPPET_MODAL",
      modalProps: {
        id: codeSnippet.id,
      },
    });
  };

  return (
    <div
      className="group h-max w-screen cursor-pointer rounded-xl p-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-4 focus-visible:ring-offset-0 md:w-full md:max-w-96 dark:focus-visible:ring-dark-gray-1"
      tabIndex={0}
      role="button"
      onClick={isDeletedContainer ? handleShowTrashModal : handleShowEditModal}
      style={style}
      ref={ref}
    >
      <CodeSnippetListItem
        isDeletedContainer={isDeletedContainer}
        codeSnippet={codeSnippet}
        shouldHightlightCode={shouldHightlightCode}
      />
    </div>
  );
});

CodeSnippetListItemOuter.displayName = "CodeSnippeListItemOuter";

const CodeSnippetListItem = memo(
  ({
    codeSnippet,
    shouldHightlightCode,
    isDeletedContainer,
  }: {
    codeSnippet: ClientCodeSnippet;
    shouldHightlightCode: boolean;
    isDeletedContainer: boolean;
  }) => {
    const { showConfirmModal } = useContext(ModalContext);

    const tags = useClientStore((state) => state.tags);

    const pin = usePin();
    const blockEdit = useBlockEdit();
    const restore = useRestoreCodeSnippet();
    const deletePermanently = useDeletePermanentlyCodeSnippet();

    const highlightedCode = useMemo(() => {
      if (shouldHightlightCode) {
        return prepareForRender(codeSnippet.code);
      }

      return hljs.highlight(codeSnippet.code, {
        language:
          // fix languages that are not supported by hljs
          hljs.listLanguages().includes(codeSnippet.currentLanguage)
            ? codeSnippet.currentLanguage
            : "html",
        ignoreIllegals: true,
      }).value;
    }, [codeSnippet.code, codeSnippet.currentLanguage, shouldHightlightCode]);

    const handleCopyButtonClick = () => {
      void navigator.clipboard.writeText(codeSnippet.code);
    };

    const deletedAtfer = codeSnippet.deletedAt
      ? generateDeleteAfterDate(codeSnippet.deletedAt)
      : null;

    // if it will be deleted in that day, say it
    const removeText =
      deletedAtfer && deletedAtfer < 0
        ? "Removal today"
        : `Removal after ${deletedAtfer} days`;

    const handleRecoverCodeSnippet = (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      void restore(codeSnippet);
    };

    const handleConfirmDelete = (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      void showConfirmModal({
        modalProps: {
          removeCallback() {
            void deletePermanently(codeSnippet);
          },
          type: "CODE",
          text: "Are you sure you want to delete this code snippet permanently?",
          id: codeSnippet.id,
        },
        modalType: "CONFIRM_DELETE_MODAL",
      });
    };

    return (
      <>
        <div className="rounded-xl border border-gray-4 bg-gray-1 group-hover:bg-gray-2 group-hover:shadow-md dark:border-dark-gray-4 dark:bg-dark-gray-8 dark:hover:shadow-dark-gray-5 dark:group-hover:bg-dark-gray-7">
          {/* Nav */}
          <header className="flex w-full items-center justify-start gap-4 px-4 py-1 ">
            <h2
              className="mb-2 line-clamp-3 self-start break-words pt-2 text-sm font-semibold text-gray-9 dark:text-dark-gray-1"
              dangerouslySetInnerHTML={{ __html: codeSnippet.title }}
            />
            <div className="ml-auto flex shrink-0 items-center self-start py-2">
              {isDeletedContainer ? (
                <>
                  <div className="grid grid-cols-2 grid-rows-2 items-center justify-items-center">
                    <Button
                      className="h-5 w-20 py-3"
                      onClick={handleRecoverCodeSnippet}
                    >
                      Restore
                    </Button>
                    <span className="justify-self-end text-[10px] font-semibold text-gray-5 dark:text-dark-gray-2">
                      {new Date(codeSnippet.updatedAt).toLocaleDateString()}
                    </span>

                    <Button
                      variant="link"
                      className="h-5 p-0 text-[8px] text-red-2 underline"
                      onClick={handleConfirmDelete}
                    >
                      Remove now
                    </Button>

                    <span className="text-[8px]">{removeText}</span>
                  </div>
                </>
              ) : (
                <>
                  <CopyButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyButtonClick();
                    }}
                  />
                  <ButtonLikeRadio
                    selected={!codeSnippet.isEditable}
                    tooltipCnheckedName="Locked!"
                    tooltipUnheckedName="Unlocked!"
                    onClick={(e) => {
                      e.stopPropagation();
                      void blockEdit(codeSnippet);
                    }}
                  >
                    <i className="ri-lock-2-line ri-xl" />
                  </ButtonLikeRadio>
                  <ButtonLikeRadio
                    tooltipCnheckedName="Pinned!"
                    tooltipUnheckedName="Unpinned!"
                    selected={codeSnippet.pinned}
                    onClick={(e) => {
                      e.stopPropagation();
                      void pin(codeSnippet);
                    }}
                  >
                    <i className="ri-pushpin-line ri-xl" />
                  </ButtonLikeRadio>
                  <span className="pl-1 text-[10px] font-semibold text-gray-5 dark:text-dark-gray-2">
                    {new Date(codeSnippet.updatedAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Body */}
          <div className="p-4 pb-2 pt-0">
            <pre className="hide-scroll max-h-56 w-full overflow-hidden text-xs">
              <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </pre>
          </div>
          {/* Footer */}
          <footer className="flex justify-start gap-2 overflow-hidden p-3 pt-1">
            {codeSnippet.tags.map((tagId) => (
              <div key={tagId} className="flex max-w-24 items-center gap-1">
                <div
                  style={{
                    backgroundColor: tags.find((tag) => tag.id === tagId)
                      ?.color,
                  }}
                  className="h-2 w-2 shrink-0 rounded-full"
                />
                <div className="block truncate text-[10px] text-gray-5 dark:text-dark-gray-2">
                  {tags.find((tag) => tag.id === tagId)?.name}
                </div>
              </div>
            ))}
          </footer>
        </div>
      </>
    );
  },
);

CodeSnippetListItem.displayName = "CodeSnippetListViewItem";

export default CodeSnippetListItemOuter;
