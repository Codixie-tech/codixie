import { create } from 'zustand';
import generateRandomAnimalName from '@/lib/animalNameGenerator';

export interface IClientStore {
  tags: ClientTag[];
  codeSnippets: ClientCodeSnippet[];
  isSidebarCollapsed: boolean;

  loadFromFiles: (data: { tags: ClientTag[]; snippets: ClientCodeSnippet[]; meta?: AppMeta | null }) => void;

  setIsSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;

  addTag: (tag: ClientTag) => void;
  removeTag: (tagId: string) => void;
  updateTag: (tag: ClientTag) => void;

  addCodeSnippet: (snippet: ClientCodeSnippet) => void;
  removeCodeSnippet: (id: string) => void;
  restoreCodeSnippet: (id: string) => void;
  deletePermanentlyCodeSnippet: (id: string) => void;
  updateCodeSnippet: (snippet: ClientCodeSnippet) => void;
  togglePinCodeSnippet: (id: string) => void;
  toggleBlockCodeSnippet: (id: string) => void;
  setBlockCodeSnippetStatus: (id: string, isBlocked: boolean) => void;
  setPinCodeSnippetStatus: (id: string, isPinned: boolean) => void;
  changeTagsForCodeSnippet: (id: string, tags: string[]) => void;

  clearStore: () => void;
}

export const useClientStore = create<IClientStore>()((set, get) => ({
  tags: [],
  codeSnippets: [],
  isSidebarCollapsed: false,

  loadFromFiles(data) {
    set({
      tags: data.tags,
      codeSnippets: data.snippets,
    });
    if (data.meta?.username) {
      useUserNameStore.getState().setUsername(data.meta.username);
    }
  },

  setIsSidebarCollapsed(v) {
    set({ isSidebarCollapsed: v });
  },
  toggleSidebar() {
    set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed }));
  },

  addTag(tag) {
    if (get().tags.find((t) => t.id === tag.id)) return;
    set((s) => ({ tags: [...s.tags, tag] }));
  },
  removeTag(tagId) {
    set((s) => ({
      codeSnippets: s.codeSnippets.map((c) => ({
        ...c,
        tags: c.tags.filter((tId) => tId !== tagId),
      })),
      tags: s.tags.filter((t) => t.id !== tagId),
    }));
  },
  updateTag(tag) {
    set((s) => ({ tags: s.tags.map((t) => (t.id === tag.id ? tag : t)) }));
  },

  addCodeSnippet(snippet) {
    if (get().codeSnippets.find((c) => c.id === snippet.id)) return;
    set((s) => ({ codeSnippets: [...s.codeSnippets, snippet] }));
  },
  removeCodeSnippet(id) {
    set((s) => ({
      codeSnippets: s.codeSnippets.map((c) =>
        c.id === id ? { ...c, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : c,
      ),
    }));
  },
  restoreCodeSnippet(id) {
    set((s) => ({
      codeSnippets: s.codeSnippets.map((c) =>
        c.id === id ? { ...c, deletedAt: null, updatedAt: new Date().toISOString() } : c,
      ),
    }));
  },
  deletePermanentlyCodeSnippet(id) {
    set((s) => ({
      codeSnippets: s.codeSnippets.filter((c) => c.id !== id),
    }));
  },
  updateCodeSnippet(snippet) {
    set((s) => ({
      codeSnippets: s.codeSnippets.map((c) => (c.id === snippet.id ? snippet : c)),
    }));
  },
  togglePinCodeSnippet(id) {
    set((s) => ({
      codeSnippets: s.codeSnippets.map((c) =>
        c.id === id ? { ...c, pinned: !c.pinned, updatedAt: new Date().toISOString() } : c,
      ),
    }));
  },
  toggleBlockCodeSnippet(id) {
    set((s) => ({
      codeSnippets: s.codeSnippets.map((c) =>
        c.id === id ? { ...c, isEditable: !c.isEditable, updatedAt: new Date().toISOString() } : c,
      ),
    }));
  },
  setBlockCodeSnippetStatus(id, isBlocked) {
    set((s) => ({
      codeSnippets: s.codeSnippets.map((c) =>
        c.id === id ? { ...c, isEditable: !isBlocked, updatedAt: new Date().toISOString() } : c,
      ),
    }));
  },
  setPinCodeSnippetStatus(id, isPinned) {
    set((s) => ({
      codeSnippets: s.codeSnippets.map((c) =>
        c.id === id ? { ...c, pinned: isPinned, updatedAt: new Date().toISOString() } : c,
      ),
    }));
  },
  changeTagsForCodeSnippet(id, tags) {
    set((s) => ({
      codeSnippets: s.codeSnippets.map((c) =>
        c.id === id ? { ...c, tags, updatedAt: new Date().toISOString() } : c,
      ),
    }));
  },

  clearStore() {
    set({ codeSnippets: [], tags: [] });
  },
}));

type DateFiltersType = 'All' | 'Today' | 'Week' | 'Month' | 'Year';
type PublishFiltersType = 'Shared' | 'Publish';

type SearchStoreType = {
  currentTagFilter: ClientTag | null;
  setCurrentTagFilter: (tag: ClientTag | null) => void;
  currentDateFilter: DateFiltersType | null;
  setCurrentDateFilter: (date: DateFiltersType | null) => void;
  isDeletedSectionOpen: boolean;
  setIsDeletedSectionOpen: (open: boolean) => void;
  currentPublishFilter: PublishFiltersType | null;
  setCurrentPublishFilter: (tag: PublishFiltersType | null) => void;
  currentSearchResults: ClientCodeSnippet[];
  setCurrentSearchResults: (codeSnippets: ClientCodeSnippet[]) => void;
  currentSearchText: string;
  setCurrentSearchText: (text: string) => void;
  clearSearchStore: () => void;
};

export const useSearchStore = create<SearchStoreType>()((set) => ({
  currentDateFilter: 'All',
  currentTagFilter: null,
  currentPublishFilter: null,
  isDeletedSectionOpen: false,
  setCurrentDateFilter(date) {
    set({ currentDateFilter: date, currentTagFilter: null, currentPublishFilter: null, isDeletedSectionOpen: false });
  },
  setCurrentTagFilter(tag) {
    set({ currentTagFilter: tag, currentDateFilter: null, currentPublishFilter: null, isDeletedSectionOpen: false });
  },
  setCurrentPublishFilter(tag) {
    set({ currentPublishFilter: tag, currentDateFilter: null, currentTagFilter: null, isDeletedSectionOpen: false });
  },
  currentSearchResults: [],
  setCurrentSearchResults(codeSnippets) {
    set({ currentSearchResults: codeSnippets });
  },
  currentSearchText: '',
  setCurrentSearchText(text) {
    set({ currentSearchText: text });
  },
  setIsDeletedSectionOpen(open) {
    set({ isDeletedSectionOpen: open, currentTagFilter: null, currentDateFilter: null });
  },
  clearSearchStore() {
    set({ currentTagFilter: null, currentDateFilter: 'All', currentSearchResults: [], currentSearchText: '' });
  },
}));

type CommanderStoreType = { showCommander: boolean; setShowCommander: (show: boolean) => void };
export const useCommanderStore = create<CommanderStoreType>()((set) => ({
  showCommander: false,
  setShowCommander(show) { set({ showCommander: show }); },
}));

type UserNameStoreType = { username: string; setUsername: (username: string) => void };
export const useUserNameStore = create<UserNameStoreType>()((set) => ({
  username: generateRandomAnimalName(),
  setUsername(username) { set({ username }); },
}));

type MainViewScrollType = { scrollValue: number; setScrollValue: (v: number) => void };
export const useMainViewScroll = create<MainViewScrollType>()((set) => ({
  scrollValue: 0,
  setScrollValue(v) { set({ scrollValue: v }); },
}));

type ResizablePanelWidthType = { sidebarWidth: number; setSidebarWidth: (w: number) => void };
export const useResizablePanelWidthStore = create<ResizablePanelWidthType>()((set) => ({
  sidebarWidth: 0,
  setSidebarWidth(w) { set({ sidebarWidth: w }); },
}));

type FishStoreType = { showFish: boolean; setShowFish: (show: boolean) => void };
export const useFishStore = create<FishStoreType>()((set) => ({
  showFish: false,
  setShowFish(show) { set({ showFish: show }); },
}));
