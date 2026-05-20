export const IPC_CHANNELS = {
  APP_GET_DATA_PATH: 'app:getDataPath',
  APP_GET_META: 'app:getMeta',
  APP_SELECT_DATA_FOLDER: 'app:selectDataFolder',
  APP_CHANGE_DATA_FOLDER: 'app:changeDataFolder',
  APP_IS_FIRST_LAUNCH: 'app:isFirstLaunch',
  APP_INITIAL_LOAD: 'app:initialLoad',
  APP_INITIALIZE_VAULT: 'app:initializeVault',
  APP_GET_VAULTS: 'app:getVaults',
  APP_OPEN_VAULT: 'app:openVault',
  APP_REMOVE_VAULT: 'app:removeVault',

  TAG_GET_ALL: 'tag:getAll',
  TAG_CREATE: 'tag:create',
  TAG_UPDATE: 'tag:update',
  TAG_DELETE: 'tag:delete',

  SNIPPET_GET_ALL: 'snippet:getAll',
  SNIPPET_CREATE: 'snippet:create',
  SNIPPET_UPDATE: 'snippet:update',
  SNIPPET_SOFT_DELETE: 'snippet:softDelete',
  SNIPPET_RESTORE: 'snippet:restore',
  SNIPPET_PERMANENT_DELETE: 'snippet:permanentDelete',
  SNIPPET_PIN: 'snippet:pin',
  SNIPPET_BLOCK_EDIT: 'snippet:blockEdit',
  SNIPPET_CHANGE_TAGS: 'snippet:changeTags',

  COMMENT_ADD: 'comment:add',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_DELETE: 'comment:delete',

  IMPORT_WEB_EXPORT: 'import:webExport',
  EXPORT_TO_FILE: 'export:toFile',
  IMPORT_FILE: 'import:fromFile',

  FILE_CHANGED: 'file:changed',

  CONFLICTS_GET: 'conflicts:get',
  CONFLICT_RESOLVE: 'conflict:resolve',

  MCP_GET_CONFIG: 'mcp:getConfig',
} as const;
