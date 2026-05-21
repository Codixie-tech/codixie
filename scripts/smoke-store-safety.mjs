import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const storeSourcePath = path.join(repoRoot, 'src/main/store/index.ts');
const tempRoot = await fs.mkdtemp(path.join(repoRoot, '.omo', 'codixie-store-smoke-'));

try {
  const storeSource = await fs.readFile(storeSourcePath, 'utf8');
  const transpiled = ts.transpileModule(storeSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const compiledStorePath = path.join(tempRoot, 'store.mjs');
  await fs.writeFile(compiledStorePath, transpiled, 'utf8');

  const { FileStore } = await import(compiledStorePath);

  const missingVault = path.join(tempRoot, 'missing-vault');
  const missingStore = new FileStore(missingVault);
  await missingStore.init({ createMissing: false });
  await assertMissing(path.join(missingVault, 'codixie'), 'read-only init created codixie directory');

  const partialVault = path.join(tempRoot, 'partial-vault');
  const partialCodixie = path.join(partialVault, 'codixie');
  await fs.mkdir(partialCodixie, { recursive: true });
  await fs.writeFile(path.join(partialCodixie, 'meta.json'), JSON.stringify({ version: 1, dataFolder: partialVault, createdAt: new Date().toISOString() }), 'utf8');

  const partialStore = new FileStore(partialVault);
  await partialStore.init({ createMissing: false });
  await assertMissing(path.join(partialCodixie, 'tags'), 'read-only init created tags directory');
  await assertMissing(path.join(partialCodixie, 'snippets'), 'read-only init created snippets directory');

  for (const id of ['../meta', '..%2Fmeta', 'a/b', 'a\\b', '.', '..', '']) {
    await assertRejects(() => partialStore.getTag(id), `getTag accepted invalid id ${JSON.stringify(id)}`);
    await assertRejects(() => partialStore.getSnippet(id), `getSnippet accepted invalid id ${JSON.stringify(id)}`);
  }
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

async function assertMissing(filePath, message) {
  try {
    await fs.stat(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  throw new Error(message);
}

async function assertRejects(callback, message) {
  try {
    await callback();
  } catch {
    return;
  }
  throw new Error(message);
}
