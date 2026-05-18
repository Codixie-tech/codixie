import { ModalContext } from '@/components/modals/ModalManager';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { getCtrlKey } from '@/lib/platformUtils';
import { useCommanderStore } from '@/store/store';
import { useTheme } from 'next-themes';
import { useCallback, useContext, useEffect } from 'react';

type Commands = 'create-tag' | 'create-code-snippet' | 'theme-light' | 'theme-dark' | 'theme-system' | 'export-project';

const Commander = () => {
  const { setTheme } = useTheme();
  const { showModal } = useContext(ModalContext);
  const open = useCommanderStore((s) => s.showCommander);
  const setOpen = useCommanderStore((s) => s.setShowCommander);

  const handleSelect = useCallback(
    (command: Commands) => {
      switch (command) {
        case 'create-tag': showModal({ modalType: 'CREATE_TAG_MODAL' }); break;
        case 'create-code-snippet': showModal({ modalType: 'CREATE_CODE_SNIPPET_MODAL' }); break;
        case 'theme-light': setTheme('light'); break;
        case 'theme-dark': setTheme('dark'); break;
        case 'theme-system': setTheme('system'); break;
        case 'export-project': window.codixieAPI.importExport.exportToFile(); break;
      }
      setOpen(false);
    },
    [setOpen, setTheme, showModal],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.code;
      const command = e.metaKey || e.ctrlKey;
      if (!command) return;
      if (key === 'KeyK') { e.preventDefault(); setOpen(!open); }
      if (key === 'KeyL' && open) { e.preventDefault(); handleSelect('theme-light'); }
      if (key === 'KeyD' && open) { e.preventDefault(); handleSelect('theme-dark'); }
      if (key === 'KeyS' && open) { e.preventDefault(); handleSelect('theme-system'); }
      if (key === 'KeyC' && open) { e.preventDefault(); handleSelect('create-code-snippet'); }
      if (key === 'KeyA' && open) { e.preventDefault(); handleSelect('create-tag'); }
      if (key === 'KeyE' && open) { e.preventDefault(); handleSelect('export-project'); }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [handleSelect, open, setOpen]);

  const ctrlKey = getCtrlKey();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command..." />
      <CommandList className="py-1">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Tags">
          <CommandItem onSelect={() => handleSelect('create-tag')}>
            Create tag <CommandShortcut>{ctrlKey}+A</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="CodeSnippets">
          <CommandItem onSelect={() => handleSelect('create-code-snippet')}>
            Create code snippet <CommandShortcut>{ctrlKey}+C</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="System">
          <CommandItem onSelect={() => handleSelect('export-project')}>
            Export project <CommandShortcut>{ctrlKey}+E</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => handleSelect('theme-light')}>
            Light <CommandShortcut>{ctrlKey}+L</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('theme-dark')}>
            Dark <CommandShortcut>{ctrlKey}+D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('theme-system')}>
            System <CommandShortcut>{ctrlKey}+S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default Commander;
