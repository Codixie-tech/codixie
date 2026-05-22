import CustomAvatar from '@/components/CustomAvatar';
import { ModeToggle } from '@/components/ModeToggle';
import { ModalContext } from '@/components/modals/ModalManager';
import { VaultContext } from '@/App';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useGetCodeSnippets } from '@/hooks/codeSnippet';
import { useMobile } from '@/hooks/common/useMobile';
import { useScrollListener } from '@/hooks/common/useScrollListener';
import { highlight, search } from '@/lib/fuseUtils';
import { getCtrlKey } from '@/lib/platformUtils';
import { cn } from '@/lib/utils';
import {
  useClientStore,
  useCommanderStore,
  useMainViewScroll,
  useSearchStore,
} from '@/store/store';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useTheme } from 'next-themes';
import { memo, useContext, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';

const Searchbar = memo(() => {
  const codeSnippets = useGetCodeSnippets();
  const setCurrentSearchResults = useSearchStore((state) => state.setCurrentSearchResults);
  const setCurrentSearchText = useSearchStore((state) => state.setCurrentSearchText);
  const [query, setQuery] = useState('');

  const handleChange = useDebouncedCallback(async (value: string) => {
    const result = search(value, codeSnippets, ['title', 'code'], { ignoreCases: true });
    const highlightedCode = highlight(result, 'cb-hightlight') as ClientCodeSnippet[];

    setCurrentSearchText(value);
    setCurrentSearchResults(highlightedCode);
  }, 1000);

  return (
    <div className="relative w-full max-w-56 flex-1">
      <i
        className={cn(
          'ri-search-line absolute left-3 top-1 h-4 w-4 font-medium',
          query ? 'text-gray-7 dark:text-dark-gray-1' : 'text-gray-5 dark:text-dark-gray-3',
        )}
      />
      <Input
        value={query}
        className="max-w-80 pl-8"
        placeholder="Search..."
        onChange={(e) => {
          setQuery(e.currentTarget.value);
          void handleChange(e.currentTarget.value);
        }}
      />
    </div>
  );
});
Searchbar.displayName = 'Searchbar';

type Positions = 'center' | 'left' | 'right';

const TripleToggleSwitch = () => {
  const { setTheme, theme } = useTheme();
  const [switchPosition, setSwitchPosition] = useState<Positions>(
    theme === 'system' ? 'center' : theme === 'dark' ? 'right' : 'left',
  );
  const [animation, setAnimation] = useState<string | null>(null);

  const handleSwitchChangeValue = (value: string) => {
    let animation: string | null = null;
    if (value === 'center' && switchPosition === 'left') animation = 'left-to-center';
    else if (value === 'right' && switchPosition === 'center') animation = 'center-to-right';
    else if (value === 'center' && switchPosition === 'right') animation = 'right-to-center';
    else if (value === 'left' && switchPosition === 'center') animation = 'center-to-left';
    else if (value === 'right' && switchPosition === 'left') animation = 'left-to-right';
    else if (value === 'left' && switchPosition === 'right') animation = 'right-to-left';

    switch (value as Positions) {
      case 'left':
        setTheme('light');
        break;
      case 'center':
        setTheme('system');
        break;
      case 'right':
        setTheme('dark');
        break;
    }

    setSwitchPosition(value as Positions);
    setAnimation(animation);
  };

  return (
    <div className="main-container">
      <div className={`switch ${animation} ${switchPosition}-position`} />
      <input defaultChecked={theme === 'light'} onChange={(e) => handleSwitchChangeValue(e.target.value)} name="map-switch" id="left" type="radio" value="left" className="hidden" />
      <label className={cn('absolute z-50 cursor-pointer')} htmlFor="left">
        <i className="ri-sun-line ri-xl" />
      </label>

      <input defaultChecked={theme === 'system'} onChange={(e) => handleSwitchChangeValue(e.target.value)} name="map-switch" id="center" type="radio" value="center" className="hidden" />
      <label className={cn('absolute left-[50%] z-10 cursor-pointer')} htmlFor="center">
        <h4 className="text-2xl">A</h4>
      </label>

      <input defaultChecked={theme === 'dark'} onChange={(e) => handleSwitchChangeValue(e.target.value)} name="map-switch" id="right" type="radio" value="right" className="hidden" />
      <label className={cn('absolute left-[calc(100%-33%)] z-10 cursor-pointer')} htmlFor="right">
        <i className="ri-moon-line ri ri-xl" />
      </label>
    </div>
  );
};

type McpConfigResult = {
  command: string;
  args: string[];
  config: string;
};

const McpSetupPanel = () => {
  const [config, setConfig] = useState<McpConfigResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.codixieAPI.mcp
      .getConfig()
      .then((result) => {
        setConfig(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Config copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-gray-5 dark:text-dark-gray-3">
        Loading MCP config...
      </div>
    );
  }

  if (!config) {
    return (
      <div className="py-4 text-center text-sm text-gray-5 dark:text-dark-gray-3">
        Failed to load MCP config
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Stdio</h3>
      <pre className="overflow-auto rounded bg-gray-2 p-2 text-xs dark:bg-dark-gray-5">
        {config.config}
      </pre>
      <Button className="h-7 w-auto px-2" size="sm" variant="styleLess" onClick={() => void copy(config.config)}>
        {copied ? 'Copied!' : 'Copy stdio config'}
      </Button>
    </div>
  );
};

const MobileProfileMenu = () => {
  const [showMcpSetup, setShowMcpSetup] = useState(false);

  return (
    <Sheet>
      <VisuallyHidden>
        <SheetTitle>Settings Menu</SheetTitle>
      </VisuallyHidden>
      <SheetTrigger className="flex items-center">
        <Button size="icon" className="flex items-center rounded-full p-0">
          <CustomAvatar />
        </Button>
      </SheetTrigger>
      <SheetContent shouldShowCloseButton side="right" className="space-y-4 p-3">
        <div className="flex items-center">
          <SheetClose asChild>
            <Button variant="styleLess" size="icon" className="mr-auto h-8 w-8 max-w-fit">
              <i className="ri-arrow-left-double-line ri-lg max-w-8" />
            </Button>
          </SheetClose>
          <div className="flex flex-[3] justify-start">
            <h1 className="mx-auto pt-2 font-semibold">
              {showMcpSetup ? 'MCP Setup' : 'Settings'}
            </h1>
          </div>
        </div>
        {showMcpSetup ? (
          <>
            <button
              className="flex items-center gap-1 text-sm text-gray-5 dark:text-dark-gray-3"
              onClick={() => setShowMcpSetup(false)}
            >
              <i className="ri-arrow-left-s-line" />
              Back to settings
            </button>
            <McpSetupPanel />
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <h1 className="font-semibold">Appearance</h1>
            </div>
            <div className="flex justify-center">
              <TripleToggleSwitch />
            </div>
            <div className="border-t border-gray-3 pt-4 dark:border-dark-gray-5">
              <Button
                variant="styleLess"
                className="flex w-full items-center justify-start gap-2 text-sm"
                onClick={() => setShowMcpSetup(true)}
              >
                <i className="ri-server-line" />
                MCP Setup
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const ProfileMenu = () => {
  const { switchToVaultSelector } = useContext(VaultContext);
  const [mcpSheetOpen, setMcpSheetOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="rounded-full p-0">
            <CustomAvatar />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={switchToVaultSelector}>
            <i className="ri-folder-shared-line mr-2" />
            Switch vault
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setMcpSheetOpen(true)}>
            <i className="ri-server-line mr-2" />
            MCP Setup
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet open={mcpSheetOpen} onOpenChange={setMcpSheetOpen}>
        <SheetContent shouldShowCloseButton side="right" className="space-y-4 p-3">
          <SheetTitle>MCP Setup</SheetTitle>
          <SheetDescription className="text-xs text-gray-5 dark:text-dark-gray-3">
            Connect MCP-compatible tools to Codixie
          </SheetDescription>
          <McpSetupPanel />
        </SheetContent>
      </Sheet>
    </>
  );
};

const SidebarToggleButton = ({ isMobile }: { isMobile: boolean }) => {
  const isSidebarCollapsed = useClientStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useClientStore((state) => state.toggleSidebar);

  return (
    <Button size="icon" onClick={() => toggleSidebar()}>
      <i
        className={cn(
          isMobile ? 'ri-list-check' : isSidebarCollapsed ? 'ri-arrow-right-double-line' : 'ri-arrow-left-double-line',
          'ri-lg text-foreground group-hover:text-dark',
        )}
      />
    </Button>
  );
};

const Navbar = memo(({ navClassList, scrolled }: { navClassList: string; scrolled: boolean }) => {
  const isMobile = useMobile();
  const { showModal } = useContext(ModalContext);

  return (
    <header
      className={cn(
        'fixed z-50 flex h-[60px] w-screen items-center gap-4 bg-gray-2 p-3 transition-transform md:relative md:w-full dark:bg-dark-gray-6',
        navClassList,
        scrolled ? 'shadow dark:shadow-dark-gray-9' : '',
      )}
    >
      <SidebarToggleButton isMobile={isMobile} />
      <Button
        className="hidden max-w-36 flex-1 flex-shrink-[3] bg-gray-8 md:inline-flex"
        variant="accent"
        onClick={() => showModal({ modalType: 'CREATE_CODE_SNIPPET_MODAL' })}
      >
        Add script {'{ }'}
      </Button>
      <Searchbar />

      <div className="ml-auto flex items-center justify-end gap-4">
        {!isMobile && <CommanderInput />}
        <ModeToggle />
        {isMobile ? <MobileProfileMenu /> : <ProfileMenu />}
      </div>
    </header>
  );
});
Navbar.displayName = 'Navbar';

const CommanderInput = () => {
  const setOpen = useCommanderStore((state) => state.setShowCommander);
  const ctrlKey = getCtrlKey();

  return (
    <Button
      onClick={() => setOpen(true)}
      className="group relative flex h-[32px] w-full min-w-48 max-w-56 flex-1 items-center justify-start rounded-md px-3 py-2 pl-8 pr-1 text-sm font-normal transition-none"
    >
      Command...
      <i className="ri-search-line absolute left-3 top-[3px] h-4 w-4 text-base font-medium" />
      <div className="ml-auto flex items-center">
        <kbd className="group-hover:bg-gray-2 dark:group-hover:bg-dark-gray-4">{ctrlKey}+K</kbd>
      </div>
    </Button>
  );
};

const ScrollController = () => {
  const scroll = useScrollListener();
  const scrollValue = useMainViewScroll((state) => state.scrollValue);
  const [navClassList, setNavClassList] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useMobile();

  useEffect(() => {
    if (isMobile) {
      if (scroll.y > 150 && scroll.y - scroll.lastY > 0) setNavClassList('-translate-y-[500px]');
      else setNavClassList('');
    }
  }, [isMobile, scroll]);

  useEffect(() => {
    const testValue = isMobile ? scroll.y : scrollValue;
    setScrolled(testValue > 35);
  }, [isMobile, scroll.y, scrollValue]);

  return <Navbar navClassList={navClassList} scrolled={scrolled} />;
};

export default ScrollController;
