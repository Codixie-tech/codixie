import { ModalContext } from "@/components/modals/ModalManager";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/fixed-scroll-area";
import {
  useSearchStore,
  useClientStore,
  type DateFiltersType,
} from "@/store/store";
import { VaultContext } from "@/App";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { memo, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRemoveTag } from "@/hooks/tag";

const DefaultTagElement = ({ text }: { text: DateFiltersType }) => {
  const setCurrentDateFilter = useSearchStore((s) => s.setCurrentDateFilter);
  const currentDateFilter = useSearchStore((s) => s.currentDateFilter);
  return (
    <Button
      variant={currentDateFilter === text ? "tagSelected" : "tag"}
      className="flex max-w-full items-center justify-start gap-3"
      onClick={() => setCurrentDateFilter(text)}
      size="tag"
    >
      <div className="h-3 w-3 flex-shrink-0 rounded-full border border-gray-9 bg-gray-1 dark:border-none dark:bg-dark-gray-2" />
      <span className="block truncate font-medium">{text}</span>
    </Button>
  );
};

const DefaultTagList = () => (
  <>
    <div className="flex items-center justify-between py-1 pl-4">
      <h1 className="pl-1 text-sm font-semibold text-gray-5">Dates</h1>
    </div>
    <div>
      <DefaultTagElement text="All" />
      <DefaultTagElement text="Today" />
      <DefaultTagElement text="Week" />
      <DefaultTagElement text="Month" />
      <DefaultTagElement text="Year" />
    </div>
  </>
);

const CustomTagElement = ({ tag }: { tag: ClientTag }) => {
  const setCurrentTagFilter = useSearchStore((s) => s.setCurrentTagFilter);
  const currentTagFilter = useSearchStore((s) => s.currentTagFilter);
  const { showModal, showConfirmModal } = useContext(ModalContext);
  const removeTag = useRemoveTag();
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);

  return (
    <Button
      asChild
      variant={currentTagFilter?.id === tag.id ? "tagSelected" : "tag"}
      className="flex max-w-full items-center justify-between pr-0"
      size="tag"
      onClick={() => setCurrentTagFilter(tag)}
    >
      <div role="button" tabIndex={0}>
        <div className="flex items-center justify-start">
          <i className="ri-circle-fill pr-3" style={{ color: tag.color }} />
          <span className="block flex-1 truncate font-medium">{tag.name}</span>
        </div>
        <DropdownMenu
          open={dropdownMenuOpen}
          onOpenChange={setDropdownMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              className="group ml-auto h-8 w-8 shrink-0"
              variant="styleLess"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownMenuOpen(true);
              }}
            >
              <i className="ri-more-2-fill ri-lg min-w-7 text-gray-7 group-hover:text-gray-8 dark:text-dark-gray-1 dark:group-hover:text-dark-gray-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem
              onClick={(e) => e.stopPropagation()}
              onSelect={() =>
                showModal({
                  modalType: "UPDATE_TAG_MODAL",
                  modalProps: { id: tag.id },
                })
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => e.stopPropagation()}
              onSelect={() =>
                showConfirmModal({
                  modalType: "CONFIRM_DELETE_MODAL",
                  modalProps: {
                    id: tag.id,
                    removeCallback: () => removeTag(tag),
                    type: "TAG",
                  },
                })
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Button>
  );
};

const CustomTagList = () => {
  const tags = useClientStore((s) => s.tags);
  const [animationParent] = useAutoAnimate();
  const { showModal } = useContext(ModalContext);
  const sortedTags = useMemo(
    () =>
      tags.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [tags],
  );

  return (
    <div ref={animationParent}>
      <div className="flex items-center justify-between py-1 pl-4">
        <h1 className="pl-1 text-sm font-semibold text-gray-5">Tags</h1>
        <Button
          onClick={() => showModal({ modalType: "CREATE_TAG_MODAL" })}
          className="h-8 w-8 md:hidden"
          variant="styleLess"
          size="icon"
        >
          <i className="ri-add-line ri-lg min-w-7" />
        </Button>
      </div>
      {sortedTags.map((tag) => (
        <CustomTagElement key={tag.id} tag={tag} />
      ))}
    </div>
  );
};

const DownloadUploadButtons = () => {
  const loadFromFiles = useClientStore((s) => s.loadFromFiles);

  const handleImport = async (mode: "replace" | "merge") => {
    const result = await window.codixieAPI.importExport.importWebExport(mode);
    if (result.success) {
      loadFromFiles(result);
      toast.success(mode === "replace" ? "Project replaced" : "Project merged");
    } else if ("error" in result && result.error !== "cancelled") {
      toast.error("Import failed: " + result.error);
    }
  };

  const handleExport = async () => {
    const result = await window.codixieAPI.importExport.exportToFile();
    if (result.success) {
      toast.success("Project exported");
    } else if ("error" in result && result.error) {
      toast.error("Export failed: " + result.error);
    }
  };

  return (
    <>
      <Button
        asChild
        size="icon"
        className="shrink-0"
        tooltip={<p className="flex items-center gap-1">Import project</p>}
      >
        <label className="cursor-pointer" onClick={() => handleImport("merge")}>
          <i className="ri-upload-line ri-lg" />
        </label>
      </Button>
      <Button
        onClick={handleExport}
        size="icon"
        className="shrink-0"
        tooltip={<p className="flex items-center gap-1">Export project</p>}
      >
        <i className="ri-download-line ri-lg" />
      </Button>
    </>
  );
};

const Sidebar = memo(
  ({
    setIsSidebarCollapsed,
  }: {
    setIsSidebarCollapsed: (v: boolean) => void;
  }) => {
    const { showModal } = useContext(ModalContext);
    const setIsDeletedSectionOpen = useSearchStore(
      (s) => s.setIsDeletedSectionOpen,
    );
    const { switchToVaultSelector } = useContext(VaultContext);

    return (
      <div className="flex h-screen flex-col">
        <ScrollArea className="flex-1 bg-gray-3 dark:bg-dark-gray-7">
          <section className="block h-full w-full overflow-hidden overflow-x-hidden px-3 pt-2 md:pt-0">
            <div className="flex items-center pt-[9px] md:h-[60px] md:pt-0">
              <Button
                className="mr-8 max-w-full flex-1 md:mr-auto"
                onClick={() => showModal({ modalType: "CREATE_TAG_MODAL" })}
              >
                Create tag
              </Button>
              <Button
                variant="styleLess"
                size="icon"
                className="ml-auto h-8 w-8 md:hidden"
                onClick={() => setIsSidebarCollapsed(false)}
              >
                <i className="ri-arrow-right-double-line ri-lg max-w-8" />
              </Button>
            </div>
            <div className="pt-6">
              <DefaultTagList />
            </div>
            <CustomTagList />
          </section>
        </ScrollArea>
        <div className="flex h-auto min-h-[60px] flex-wrap items-center justify-start gap-2 bg-gray-3 px-4 py-2 dark:bg-dark-gray-7">
          <Button
            size="icon"
            className="shrink-0"
            onClick={() => setIsDeletedSectionOpen(true)}
            tooltip={<p className="flex items-center gap-1">Deleted</p>}
          >
            <i className="ri-delete-bin-6-line ri-lg" />
          </Button>
          <DownloadUploadButtons />
          <div className="flex-1" />
          <Button
            size="icon"
            className="shrink-0"
            onClick={switchToVaultSelector}
            tooltip={<p className="flex items-center gap-1">Switch vault</p>}
          >
            <i className="ri-folder-shared-line ri-lg" />
          </Button>
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";
export default Sidebar;
