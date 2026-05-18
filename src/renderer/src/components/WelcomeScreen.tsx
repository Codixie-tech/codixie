import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import generateRandomAnimalName from '@/lib/animalNameGenerator';
import { useClientStore } from '@/store/store';

type Props = {
  onComplete: () => void;
};

export default function WelcomeScreen({ onComplete }: Props) {
  const [step, setStep] = useState<'folder' | 'username'>('folder');
  const [username, setUsername] = useState(generateRandomAnimalName());
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadFromFiles = useClientStore((s) => s.loadFromFiles);

  const handleSelectFolder = async () => {
    const path = await window.codixieAPI.app.selectDataFolder();
    if (path) setSelectedPath(path);
  };

  const handleContinue = () => {
    if (selectedPath) setStep('username');
  };

  const handleFinish = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const data = await window.codixieAPI.app.initializeVault(selectedPath, username.trim());
      loadFromFiles(data);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-1 dark:bg-dark-gray-8">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-8 shadow-lg dark:border-dark-gray-6 dark:bg-dark-gray-6">
        {step === 'folder' ? (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-8 dark:text-dark-gray-1">
                Welcome to Codixie
              </h1>
              <p className="mt-2 text-gray-5 dark:text-dark-gray-3">
                Choose where to store your data. Pick a folder inside your Dropbox or Google Drive
                for automatic sync across devices.
              </p>
            </div>

            <div className="space-y-4">
              <Button onClick={handleSelectFolder} className="w-full">
                <i className="ri-folder-open-line ri-lg mr-2" />
                {selectedPath ? 'Choose Different Folder' : 'Choose Data Folder'}
              </Button>

              {selectedPath && (
                <div className="rounded-md border bg-gray-1 p-3 text-sm text-gray-6 dark:border-dark-gray-5 dark:bg-dark-gray-7 dark:text-dark-gray-2">
                  <i className="ri-folder-line mr-1" />
                  {selectedPath}
                </div>
              )}

              <Button
                onClick={handleContinue}
                disabled={!selectedPath}
                variant="accent"
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-8 dark:text-dark-gray-1">
                Set Your Username
              </h1>
              <p className="mt-2 text-gray-5 dark:text-dark-gray-3">
                This name will be used for published snippets.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                maxLength={32}
              />
              <div className="flex gap-2">
                <Button onClick={() => setStep('folder')} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={!username.trim() || loading}
                  className="flex-1"
                >
                  {loading ? 'Setting up...' : 'Get Started'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
