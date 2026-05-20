import Commander from '@/components/Commander';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import CodeSnippetList from '@/components/MainViewComponents/CodeSnippetList';
import MobileCodeSnippetList from '@/components/MainViewComponents/MobileCodeSnippetList';
import { ModalContext } from '@/components/modals/ModalManager';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { languages } from '@shared/constants';
import {
  useGetCodeSnippets,
  useGetDeletedCodeSnippets,
} from '@/hooks/codeSnippet';
import usePrevious from '@/hooks/common/common';
import { useMobile } from '@/hooks/common/useMobile';
import { useDidMountEffect } from '@/hooks/hooks';
import {
  useClientStore,
  useMainViewScroll,
  useResizablePanelWidthStore,
  useSearchStore,
} from '@/store/store';
import hljs from 'highlight.js';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { memo, useContext, useEffect, useMemo, useRef } from 'react';
import { type ImperativePanelHandle } from 'react-resizable-panels';
import { useThrottledCallback } from 'use-debounce';

hljs.configure({
  languages: languages as unknown as string[],
  noHighlightRe: /highlight/,
});

export default function MainView() {
  const isMobile = useMobile();
  const setSidebarWidth = useResizablePanelWidthStore((s) => s.setSidebarWidth);
  const currentTagFilter = useSearchStore((s) => s.currentTagFilter);
  const currentDateFilter = useSearchStore((s) => s.currentDateFilter);
  const previousTagFilter = usePrevious(currentTagFilter);
  const previousDateFilter = usePrevious(currentDateFilter);
  const setIsSidebarCollapsed = useClientStore((s) => s.setIsSidebarCollapsed);
  const isSidebarCollapsed = useClientStore((s) => s.isSidebarCollapsed);
  const sidebarRef = useRef<ImperativePanelHandle>(null);

  const handleSidebarResize = useThrottledCallback((width: number) => {
    setSidebarWidth(width);
  }, 400);

  const handleSidebarCollapse = () => {
    setIsSidebarCollapsed(true);
    setSidebarWidth(0);
  };
  const handleSidebarExpand = () => {
    setIsSidebarCollapsed(false);
    setSidebarWidth(1);
  };

  useDidMountEffect(() => {
    isSidebarCollapsed ? sidebarRef.current?.collapse() : sidebarRef.current?.expand();
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (isMobile && (previousTagFilter !== currentTagFilter || previousDateFilter !== currentDateFilter)) {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  }, [isMobile, setIsSidebarCollapsed, previousTagFilter, currentTagFilter, isSidebarCollapsed, previousDateFilter, currentDateFilter]);

  if (isMobile) {
    return (
      <main className="flex min-h-screen bg-gray-1 dark:bg-dark-gray-8">
        <Sheet open={isSidebarCollapsed} onOpenChange={setIsSidebarCollapsed}>
          <VisuallyHidden><SheetTitle>Sidebar</SheetTitle></VisuallyHidden>
          <SheetContent side={'left'}>
            <Sidebar setIsSidebarCollapsed={setIsSidebarCollapsed} />
          </SheetContent>
        </Sheet>
        <MainViewComponent />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-gray-1 dark:bg-dark-gray-8">
      <ResizablePanelGroup direction="horizontal" autoSaveId="group" id="group">
        <ResizablePanel
          maxSize={50} minSize={10} defaultSize={25 / 2}
          collapsedSize={0} collapsible={true}
          ref={sidebarRef} onCollapse={handleSidebarCollapse}
          onExpand={handleSidebarExpand} className="h-screen"
          onResize={handleSidebarResize}
        >
          <Sidebar setIsSidebarCollapsed={setIsSidebarCollapsed} />
        </ResizablePanel>
        <ResizableHandle className="bg-gray-3 dark:bg-dark-gray-7" />
        <ResizablePanel className="h-screen">
          <MainViewComponent />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}

const PinSection = ({ pinnedCodeSnippets, shouldHightlightCode }: {
  pinnedCodeSnippets: ClientCodeSnippet[];
  shouldHightlightCode: boolean;
}) => {
  const isMobile = useMobile();
  return (
    <div className="relative min-h-full min-w-full">
      <h2 className="p-[6px] pb-5 font-semibold text-gray-5 md:p-0">Pin</h2>
      {isMobile
        ? <MobileCodeSnippetList isDeletedContainer={false} codeSnippets={pinnedCodeSnippets} shouldHightlightCode={shouldHightlightCode} />
        : <CodeSnippetList isDeletedContainer={false} codeSnippets={pinnedCodeSnippets} shouldHightlightCode={shouldHightlightCode} />
      }
      <Separator className="my-2" />
    </div>
  );
};

const CodeSnippetListView = () => {
  const isMobile = useMobile();
  const codeSnippets = useGetCodeSnippets();
  const deletedCodeSnippets = useGetDeletedCodeSnippets();
  const currentSearchResutls = useSearchStore((s) => s.currentSearchResults);
  const currentSearchText = useSearchStore((s) => s.currentSearchText);
  const currentSnippets = currentSearchText ? currentSearchResutls : codeSnippets;
  const currentDateFilter = useSearchStore((s) => s.currentDateFilter);
  const currentTagFilter = useSearchStore((s) => s.currentTagFilter);
  const isDeletedSectionOpen = useSearchStore((s) => s.isDeletedSectionOpen);

  const filteredCodeSnippets = useMemo(() => {
    if (currentTagFilter) {
      return currentSnippets.filter((c) => c.tags.includes(currentTagFilter.id))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    let f: ClientCodeSnippet[];
    const now = Date.now();
    switch (currentDateFilter) {
      case 'Today': f = currentSnippets.filter((c) => now - new Date(c.updatedAt).getTime() < 86400000); break;
      case 'Week': f = currentSnippets.filter((c) => now - new Date(c.updatedAt).getTime() < 604800000); break;
      case 'Month': f = currentSnippets.filter((c) => now - new Date(c.updatedAt).getTime() < 2592000000); break;
      case 'Year': f = currentSnippets.filter((c) => now - new Date(c.updatedAt).getTime() < 31536000000); break;
      default: f = currentSnippets; break;
    }
    return f.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [currentDateFilter, currentSnippets, currentTagFilter]);

  const sortedDeleted = useMemo(() =>
    deletedCodeSnippets.sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()),
    [deletedCodeSnippets]);

  const pinned = useMemo(() => filteredCodeSnippets.filter((c) => c.pinned), [filteredCodeSnippets]);
  const notPinned = useMemo(() => filteredCodeSnippets.filter((c) => !c.pinned), [filteredCodeSnippets]);
  const notFoundName = !isDeletedSectionOpen
    ? filteredCodeSnippets.length ? '' : 'Codixie is empty'
    : deletedCodeSnippets.length ? '' : 'Trash is empty';

  return (
    <>
      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform md:block">
        <span className="select-none text-nowrap font-sans text-5xl uppercase text-gray-3">{notFoundName}</span>
      </div>
      <div className="pt-16 md:p-6">
        {pinned.length > 0 && !isDeletedSectionOpen && (
          <PinSection pinnedCodeSnippets={pinned} shouldHightlightCode={!!currentSearchResutls.length} />
        )}
        {isMobile
          ? <MobileCodeSnippetList isDeletedContainer={isDeletedSectionOpen} codeSnippets={isDeletedSectionOpen ? sortedDeleted : notPinned} shouldHightlightCode={!!currentSearchResutls.length} />
          : <CodeSnippetList codeSnippets={isDeletedSectionOpen ? sortedDeleted : notPinned} isDeletedContainer={isDeletedSectionOpen} shouldHightlightCode={!!currentSearchResutls.length} />
        }
      </div>
    </>
  );
};

const ActionFloatButton = () => {
  const { showModal } = useContext(ModalContext);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex justify-center md:hidden">
      <Button className="h-16 w-16 rounded-full shadow-[0_0_30px_0px_rgba(34,_60,_80,_0.2)]"
        onClick={() => showModal({ modalType: 'CREATE_CODE_SNIPPET_MODAL' })}>
        <svg width="42" height="42" fill="currentColor" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 31.5V25.025C7 23.5753 5.82475 22.4 4.375 22.4H3.5V19.6H4.375C5.82475 19.6 7 18.4247 7 16.975V10.5C7 7.60051 9.35051 5.25 12.25 5.25H14V8.75H12.25C11.2835 8.75 10.5 9.53351 10.5 10.5V17.675C10.5 19.2252 9.49214 20.5401 8.0959 21C9.49214 21.4599 10.5 22.7748 10.5 24.325V31.5C10.5 32.4665 11.2835 33.25 12.25 33.25H14V36.75H12.25C9.35051 36.75 7 34.3996 7 31.5ZM35 25.025V31.5C35 34.3996 32.6496 36.75 29.75 36.75H28V33.25H29.75C30.7165 33.25 31.5 32.4665 31.5 31.5V24.325C31.5 22.7748 32.5078 21.4599 33.9042 21C32.5078 20.5401 31.5 19.2252 31.5 17.675V10.5C31.5 9.53351 30.7165 8.75 29.75 8.75H28V5.25H29.75C32.6496 5.25 35 7.60051 35 10.5V16.975C35 18.4247 36.1753 19.6 37.625 19.6H38.5V22.4H37.625C36.1753 22.4 35 23.5753 35 25.025Z" />
          <path d="M20 20V14H22V20H28V22H22V28H20V22H14V20H20Z" />
        </svg>
      </Button>
    </div>
  );
};

const MainViewComponent = memo(() => {
  const isMobile = useMobile();
  const setScrollValue = useMainViewScroll((s) => s.setScrollValue);
  return (
    <>
      <Navbar />
      <Commander />
      <ScrollArea className="h-[calc(100%-60px)]"
        onScrollCapture={(e) => { if (!isMobile) setScrollValue((e.target as HTMLDivElement).scrollTop); }}>
        <CodeSnippetListView />
      </ScrollArea>
      <ActionFloatButton />
    </>
  );
});
MainViewComponent.displayName = 'MainViewComponent';
