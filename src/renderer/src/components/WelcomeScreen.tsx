import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useClientStore } from '@/store/store';

type Props = {
  onComplete: () => void;
};

export default function WelcomeScreen({ onComplete }: Props) {
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const loadFromFiles = useClientStore((s) => s.loadFromFiles);

  useEffect(() => {
    void loadVaults();
  }, []);

  const loadVaults = async () => {
    const result = await window.codixieAPI.app.getVaults();
    setVaults(result.vaults ?? []);
  };

  const finishWithData = (data: { tags: ClientTag[]; snippets: ClientCodeSnippet[]; meta?: AppMeta | null }) => {
    loadFromFiles(data);
    onComplete();
  };

  const openVaultPath = async (vaultPath: string) => {
    setLoadingPath(vaultPath);
    try {
      const result = await window.codixieAPI.app.openVault(vaultPath);
      if (result.needsInit) {
        const data = await window.codixieAPI.app.initializeVault(vaultPath);
        finishWithData(data);
        return;
      }
      finishWithData(result.data);
    } finally {
      setLoadingPath(null);
    }
  };

  const handleOpenVault = async () => {
    const vaultPath = await window.codixieAPI.app.selectDataFolder();
    if (vaultPath) await openVaultPath(vaultPath);
  };

  const handleCreateVault = async () => {
    const vaultPath = await window.codixieAPI.app.selectDataFolder();
    if (!vaultPath) return;
    setLoadingPath(vaultPath);
    try {
      const data = await window.codixieAPI.app.initializeVault(vaultPath);
      finishWithData(data);
    } finally {
      setLoadingPath(null);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-1 dark:bg-dark-gray-8">
      <div className="w-full max-w-2xl space-y-8 rounded-lg border bg-white p-8 shadow-lg dark:border-dark-gray-6 dark:bg-dark-gray-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-8 dark:text-dark-gray-1">Open Codixie Vault</h1>
          <p className="mt-2 text-gray-5 dark:text-dark-gray-3">
            Keep snippets in a local folder. Use a Dropbox or Google Drive folder if you want file sync across devices.
          </p>
        </div>

        {vaults.length > 0 && (
          <div className="space-y-3">
            <h2 className="px-1 text-sm font-semibold text-gray-5">Recent vaults</h2>
            <div className="space-y-2">
              {vaults.map((vault) => (
                <button
                  key={vault.path}
                  type="button"
                  onClick={() => openVaultPath(vault.path)}
                  className="flex w-full items-center gap-3 rounded-md border border-gray-4 bg-gray-1 p-3 text-left transition-colors hover:bg-gray-2 dark:border-dark-gray-1 dark:bg-dark-gray-7 dark:hover:bg-dark-gray-4"
                >
                  <i className="ri-folder-3-line ri-xl text-gray-6 dark:text-dark-gray-2" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-gray-8 dark:text-dark-gray-1">{vault.name}</div>
                    <div className="truncate text-xs text-gray-5 dark:text-dark-gray-3">{vault.path}</div>
                  </div>
                  {vault.active && <span className="rounded bg-gray-3 px-2 py-1 text-xs dark:bg-dark-gray-5">Last opened</span>}
                  {loadingPath === vault.path && <i className="ri-loader-4-line ri-lg animate-spin" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <Button onClick={handleOpenVault} className="max-w-full">
            <i className="ri-folder-open-line ri-lg mr-2" />
            Open folder as vault
          </Button>
          <Button onClick={handleCreateVault} variant="accent" className="max-w-full">
            <i className="ri-add-line ri-lg mr-2" />
            Create vault in folder
          </Button>
        </div>
      </div>
    </div>
  );
}
