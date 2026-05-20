import { ThemeProvider } from './components/ThemeProvider';
import { TooltipProvider } from './components/ui/tooltip';
import MainView from './components/MainView';
import VaultSelectorScreen from './components/VaultSelectorScreen';
import { ModalManager } from './components/modals/ModalManager';
import { Toaster } from './components/ui/sonner';
import { createContext, useEffect, useState } from 'react';
import { useClientStore } from './store/store';

export const VaultContext = createContext<{
  switchToVaultSelector: () => void;
}>({ switchToVaultSelector: () => {} });

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showVaultSelector, setShowVaultSelector] = useState(false);

  const loadFromFiles = useClientStore((s) => s.loadFromFiles);
  const clearStore = useClientStore((s) => s.clearStore);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const first = await window.codixieAPI.app.isFirstLaunch();
        if (cancelled) return;
        if (first) {
          setShowVaultSelector(true);
          setIsLoading(false);
          return;
        }

        const data = await window.codixieAPI.app.initialLoad();
        if (cancelled) return;
        loadFromFiles(data);

        window.codixieAPI.app.onFileChanged((event: FileChangeEvent) => {
          handleFileChange(event);
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize:', err);
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleVaultOpened = (data: { tags: ClientTag[]; snippets: ClientCodeSnippet[]; meta?: AppMeta | null }) => {
    loadFromFiles(data);
    setShowVaultSelector(false);
    setIsLoading(false);

    window.codixieAPI.app.onFileChanged((event: FileChangeEvent) => {
      handleFileChange(event);
    });
  };

  const switchToVaultSelector = () => {
    clearStore();
    setShowVaultSelector(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-2xl text-gray-5">Loading Codixie...</span>
      </div>
    );
  }

  if (showVaultSelector) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <VaultSelectorScreen onVaultOpened={handleVaultOpened} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <VaultContext.Provider value={{ switchToVaultSelector }}>
        <TooltipProvider>
          <ModalManager>
            <Toaster
              closeButton
              position="top-right"
              toastOptions={{
                classNames: {
                  success:
                    'bg-green-1 border-green-3 text-green-3 border dark:bg-dark-green-3 dark:text-dark-green-1 dark:border-dark-green-1',
                  closeButton: '-right-1 left-auto top-3 border-none ',
                  error:
                    'bg-red-1 border-red-2 text-red-2 border dark:bg-dark-red-2 dark:text-dark-red-1 dark:border-dark-red-1',
                  loading:
                    'bg-gray-2 text-gray-7 border-gray-7 border dark:bg-dark-gray-7 dark:text-dark-gray-1 dark:border-dark-gray-1',
                },
              }}
            />
            <MainView />
          </ModalManager>
        </TooltipProvider>
      </VaultContext.Provider>
    </ThemeProvider>
  );
}

async function handleFileChange(event: FileChangeEvent) {
  const store = useClientStore.getState();

  if (event.entityType === 'tag') {
    if (event.type === 'delete') {
      store.removeTag(event.entityId);
      return;
    }
    try {
      const tags = await window.codixieAPI.tag.getAll();
      const tag = tags.find((t: ClientTag) => t.id === event.entityId);
      if (tag) store.updateTag(tag);
    } catch {}
  } else if (event.entityType === 'snippet') {
    if (event.type === 'delete') {
      store.deletePermanentlyCodeSnippet(event.entityId);
      return;
    }
    try {
      const snippets = await window.codixieAPI.snippet.getAll();
      const snippet = snippets.find((s: ClientCodeSnippet) => s.id === event.entityId);
      if (snippet) store.updateCodeSnippet(snippet);
    } catch {}
  }
}
