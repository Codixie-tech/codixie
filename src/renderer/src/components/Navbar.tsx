import { ModalContext } from '@/components/modals/ModalManager';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useGetCodeSnippets } from '@/hooks/codeSnippet';
import { useMobile } from '@/hooks/common/useMobile';
import { useScrollListener } from '@/hooks/common/useScrollListener';
import { highlight, search } from '@/lib/fuseUtils';
import { getCtrlKey } from '@/lib/platformUtils';
import { cn } from '@shared/utils';
import {
  useClientStore,
  useCommanderStore,
  useFishStore,
  useMainViewScroll,
  useSearchStore,
} from '@/store/store';
import { useTheme } from 'next-themes';
import { memo, useContext, useEffect, useState, type MouseEvent } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const Searchbar = memo(() => {
  const codeSnippets = useGetCodeSnippets();
  const setCurrentSearchResults = useSearchStore((s) => s.setCurrentSearchResults);
  const setCurrentSearchText = useSearchStore((s) => s.setCurrentSearchText);
  const [query, setQuery] = useState('');

  const handleChange = useDebouncedCallback(async (value: string) => {
    const result = search(value, codeSnippets, ['title', 'code'], { ignoreCases: true });
    const highlightedCode = highlight(result, 'cb-hightlight');
    setCurrentSearchText(value);
    setCurrentSearchResults(highlightedCode);
  }, 1000);

  return (
    <div className="relative w-full max-w-56 flex-1">
      <i className={cn('ri-search-line absolute left-3 top-1 h-4 w-4 font-medium',
        query ? 'text-gray-7 dark:text-dark-gray-1' : 'text-gray-5 dark:text-dark-gray-3')} />
      <Input value={query} className="max-w-80 pl-8" placeholder="Search..."
        onChange={(e) => { setQuery(e.currentTarget.value); void handleChange(e.currentTarget.value); }} />
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
    let anim: string | null = null;
    if (value === 'center' && switchPosition === 'left') anim = 'left-to-center';
    else if (value === 'right' && switchPosition === 'center') anim = 'center-to-right';
    else if (value === 'center' && switchPosition === 'right') anim = 'right-to-center';
    else if (value === 'left' && switchPosition === 'center') anim = 'center-to-left';
    else if (value === 'right' && switchPosition === 'left') anim = 'left-to-right';
    else if (value === 'left' && switchPosition === 'right') anim = 'right-to-left';

    switch (value as Positions) {
      case 'left': setTheme('light'); break;
      case 'center': setTheme('system'); break;
      case 'right': setTheme('dark'); break;
    }
    setSwitchPosition(value as Positions);
    setAnimation(anim);
  };

  return (
    <div className="main-container">
      <div className={`switch ${animation} ${switchPosition}-position`} />
      <input defaultChecked={theme === 'light'} onChange={(e) => handleSwitchChangeValue(e.target.value)} name="map-switch" id="left" type="radio" value="left" className="hidden" />
      <label className={cn('absolute z-50 cursor-pointer')} htmlFor="left"><i className="ri-sun-line ri-xl" /></label>
      <input defaultChecked={theme === 'system'} onChange={(e) => handleSwitchChangeValue(e.target.value)} name="map-switch" id="center" type="radio" value="center" className="hidden" />
      <label className={cn('absolute left-[50%] z-10 cursor-pointer')} htmlFor="center"><h4 className="text-2xl">A</h4></label>
      <input defaultChecked={theme === 'dark'} onChange={(e) => handleSwitchChangeValue(e.target.value)} name="map-switch" id="right" type="radio" value="right" className="hidden" />
      <label className={cn('absolute left-[calc(100%-33%)] z-10 cursor-pointer')} htmlFor="right"><i className="ri-moon-line ri ri-xl" /></label>
    </div>
  );
};

const SidebarToggleButton = ({ isMobile }: { isMobile: boolean }) => {
  const isSidebarCollapsed = useClientStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useClientStore((s) => s.toggleSidebar);
  return (
    <Button size="icon" onClick={() => toggleSidebar()}>
      <i className={cn(isMobile ? 'ri-list-check' : isSidebarCollapsed ? 'ri-arrow-right-double-line' : 'ri-arrow-left-double-line', 'ri-lg text-foreground group-hover:text-dark')} />
    </Button>
  );
};

const Navbar = memo(({ navClassList, scrolled }: { navClassList?: string; scrolled?: boolean }) => {
  const isMobile = useMobile();
  const { showModal } = useContext(ModalContext);

  return (
    <header className={cn(
      'fixed z-50 flex h-[60px] w-screen items-center gap-4 bg-gray-2 p-3 transition-transform md:relative md:w-full dark:bg-dark-gray-6',
      navClassList ?? '',
      scrolled ? 'shadow dark:shadow-dark-gray-9' : '',
    )}>
      <SidebarToggleButton isMobile={isMobile} />
      <Button className="hidden max-w-36 flex-1 flex-shrink-[3] bg-gray-8 md:inline-flex" variant="accent"
        onClick={() => showModal({ modalType: 'CREATE_CODE_SNIPPET_MODAL' })}>
        Add script {'{ }'}
      </Button>
      <Searchbar />
      <div className="ml-auto flex items-center justify-end gap-4">
        {!isMobile && <CommanderInput />}
        <ModeToggle />
      </div>
    </header>
  );
});
Navbar.displayName = 'Navbar';

const ModeToggle = () => {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <i className="ri-sun-line h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <i className="ri-moon-line absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CommanderInput = () => {
  const setOpen = useCommanderStore((s) => s.setShowCommander);
  const ctrlKey = getCtrlKey();
  return (
    <Button onClick={() => setOpen(true)}
      className="group relative flex h-[32px] w-full min-w-48 max-w-56 flex-1 items-center justify-start rounded-md px-3 py-2 pl-8 pr-1 text-sm font-normal transition-none">
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
  const scrollValue = useMainViewScroll((s) => s.scrollValue);
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
