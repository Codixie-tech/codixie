import { parse, stringify } from "superjson";
import { v4 as uuidv4 } from "uuid";
import { StorageShema } from "../../shared/contracts";
import type {
  ClientCodeSnippet,
  ClientComment,
  ClientTag,
} from "../../shared/types";
import { generateNewNameForCopy } from "../../shared/utils";
import { FileStore } from "./index";

export async function importFromWebExport(
  store: FileStore,
  jsonString: string,
  mode: "replace" | "merge",
): Promise<void> {
  const parsed = parse<Record<string, unknown>>(jsonString);

  const validated = StorageShema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("Invalid export format: " + validated.error.message);
  }

  const data = transformWebExport(validated.data);

  if (mode === "replace") {
    await store.replaceAllData(data);
  } else {
    const existingTags = await store.getAllTags();
    const existingSnippets = await store.getAllSnippets();
    const merged = mergeData(
      { tags: existingTags, snippets: existingSnippets },
      data,
    );
    await store.mergeData(merged);
  }
}

function transformWebExport(data: z.infer<typeof StorageShema>): {
  tags: ClientTag[];
  snippets: ClientCodeSnippet[];
} {
  const tagIdMap = new Map<string, string>();

  const tags: ClientTag[] = data.tags.map((tag) => {
    const newId = uuidv4();
    tagIdMap.set(tag.id, newId);
    return {
      ...tag,
      id: newId,
      createdAt:
        typeof tag.createdAt === "string"
          ? tag.createdAt
          : new Date(tag.createdAt).toISOString(),
      updatedAt:
        typeof tag.updatedAt === "string"
          ? tag.updatedAt
          : new Date(tag.updatedAt).toISOString(),
      deletedAt: tag.deletedAt
        ? typeof tag.deletedAt === "string"
          ? tag.deletedAt
          : new Date(tag.deletedAt).toISOString()
        : null,
    };
  });

  const snippetIdMap = new Map<string, string>();

  const commentsBySnippetId = new Map<string, ClientComment[]>();
  for (const comment of data.comments) {
    const snippetComments =
      commentsBySnippetId.get(comment.codeSnippetId) ?? [];
    const newCommentId = uuidv4();
    snippetComments.push({
      id: newCommentId,
      text: comment.text,
      createdAt:
        typeof comment.createdAt === "string"
          ? comment.createdAt
          : new Date(comment.createdAt).toISOString(),
      updatedAt:
        typeof comment.updatedAt === "string"
          ? comment.updatedAt
          : new Date(comment.updatedAt).toISOString(),
      deletedAt: comment.deletedAt
        ? typeof comment.deletedAt === "string"
          ? comment.deletedAt
          : new Date(comment.deletedAt).toISOString()
        : null,
      versionHash: comment.versionHash,
    });
    commentsBySnippetId.set(comment.codeSnippetId, snippetComments);
  }

  const snippets: ClientCodeSnippet[] = data.codeSnippets.map((snippet) => {
    const newId = uuidv4();
    snippetIdMap.set(snippet.id, newId);
    const mappedTags = snippet.tags.map((tId) => tagIdMap.get(tId) ?? tId);
    const comments = commentsBySnippetId.get(snippet.id) ?? [];

    return {
      id: newId,
      title: snippet.title,
      code: snippet.code,
      pinned: snippet.pinned,
      isEditable: snippet.isEditable,
      currentLanguage: snippet.currentLanguage,
      createdAt:
        typeof snippet.createdAt === "string"
          ? snippet.createdAt
          : new Date(snippet.createdAt).toISOString(),
      updatedAt:
        typeof snippet.updatedAt === "string"
          ? snippet.updatedAt
          : new Date(snippet.updatedAt).toISOString(),
      tags: mappedTags,
      comments,
      versionHash: snippet.versionHash,
      deletedAt: snippet.deletedAt
        ? typeof snippet.deletedAt === "string"
          ? snippet.deletedAt
          : new Date(snippet.deletedAt).toISOString()
        : null,
    };
  });

  return { tags, snippets };
}

type MergeInput = {
  tags: ClientTag[];
  snippets: ClientCodeSnippet[];
};

function mergeData(oldData: MergeInput, newData: MergeInput): MergeInput {
  const updatedIdsTags = new Map<string, string>();

  const preparedNewTags = newData.tags.map((newTag) => {
    const oldTag = oldData.tags.find(
      (ot) => ot.id === newTag.id || ot.name === newTag.name,
    );
    if (!oldTag) return newTag;

    if (oldTag.id === newTag.id && oldTag.name !== newTag.name) {
      const created: ClientTag = { ...newTag, id: uuidv4() };
      updatedIdsTags.set(newTag.id, created.id);
      return created;
    } else if (oldTag.id !== newTag.id && oldTag.name === newTag.name) {
      return { ...newTag, name: generateNewNameForCopy(newTag.name) };
    } else {
      const created: ClientTag = {
        ...newTag,
        id: uuidv4(),
        name: generateNewNameForCopy(newTag.name),
      };
      updatedIdsTags.set(newTag.id, created.id);
      return created;
    }
  });

  const updatedIdsSnippets = new Map<string, string>();

  const preparedNewSnippets = newData.snippets.map((newSnippet) => {
    const tags = newSnippet.tags.map((t) => updatedIdsTags.get(t) ?? t);
    const oldSnippet = oldData.snippets.find(
      (os) => os.id === newSnippet.id || os.title === newSnippet.title,
    );
    if (!oldSnippet) return { ...newSnippet, tags };

    if (
      oldSnippet.id === newSnippet.id &&
      oldSnippet.title !== newSnippet.title
    ) {
      const created: ClientCodeSnippet = { ...newSnippet, id: uuidv4(), tags };
      updatedIdsSnippets.set(newSnippet.id, created.id);
      return created;
    } else if (
      oldSnippet.title === newSnippet.title &&
      oldSnippet.id !== newSnippet.id
    ) {
      return {
        ...newSnippet,
        title: generateNewNameForCopy(newSnippet.title),
        tags,
      };
    } else {
      const created: ClientCodeSnippet = {
        ...newSnippet,
        id: uuidv4(),
        title: generateNewNameForCopy(newSnippet.title),
        tags,
      };
      updatedIdsSnippets.set(newSnippet.id, created.id);
      return created;
    }
  });

  return {
    tags: [...oldData.tags, ...preparedNewTags],
    snippets: [...oldData.snippets, ...preparedNewSnippets],
  };
}

export async function exportToWebFormat(store: FileStore): Promise<string> {
  const tags = await store.getAllTags();
  const snippets = await store.getAllSnippets();

  const allComments: ClientComment[] = [];
  const tagRefs: Record<string, string[]> = {};
  const commentRefs: Record<string, string[]> = {};

  for (const snippet of snippets) {
    tagRefs[snippet.id] = snippet.tags;
    commentRefs[snippet.id] = [];

    for (const comment of snippet.comments) {
      commentRefs[snippet.id].push(comment.id);
      allComments.push({
        ...comment,
      } as ClientComment & { codeSnippetId: string });
    }
  }

  const exportData = {
    tags,
    codeSnippets: snippets.map((s) => ({
      id: s.id,
      title: s.title,
      code: s.code,
      pinned: s.pinned,
      isEditable: s.isEditable,
      currentLanguage: s.currentLanguage,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      versionHash: s.versionHash,
      deletedAt: s.deletedAt,
      tags: s.tags,
      comments: s.comments.map((c) => c.id),
    })),
    comments: allComments.map((c) => ({
      ...c,
      codeSnippetId:
        snippets.find((s) => s.comments.some((sc) => sc.id === c.id))?.id ?? "",
    })),
    isSidebarCollapsed: false,
    lastSyncDate: new Date().toISOString(),
    replaceStoreVersion: 0,
    codeSnippetsOffline: [],
    tagsOffline: [],
    commentsOffline: [],
  };

  return stringify(exportData);
}
