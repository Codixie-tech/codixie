import { useClientStore } from '@/store/store';
import { useMemo } from 'react';

export const useAddCodeSnippet = () => {
  const clientAddCodeSnippet = useClientStore((s) => s.addCodeSnippet);

  return async function addCodeSnippet(snippet: ClientCodeSnippet & { isAutoLanguageDetection?: boolean }) {
    const { isAutoLanguageDetection: _isAutoLanguageDetection, ...preparedSnippet } = snippet;
    clientAddCodeSnippet(preparedSnippet);
    window.codixieAPI.snippet.create(preparedSnippet);
    return true;
  };
};

export const useRemoveCodeSnippet = () => {
  const clientRemoveCodeSnippet = useClientStore((s) => s.removeCodeSnippet);
  const clientUpdateCodeSnippet = useClientStore((s) => s.updateCodeSnippet);

  return async function removeCodeSnippet(snippet: ClientCodeSnippet) {
    clientRemoveCodeSnippet(snippet.id);
    const result = await window.codixieAPI.snippet.softDelete(snippet.id);
    if (result) clientUpdateCodeSnippet(result);
  };
};

export const useRestoreCodeSnippet = () => {
  const clientRestoreCodeSnippet = useClientStore((s) => s.restoreCodeSnippet);
  const clientUpdateCodeSnippet = useClientStore((s) => s.updateCodeSnippet);

  return async function restoreCodeSnippet(snippet: ClientCodeSnippet) {
    clientRestoreCodeSnippet(snippet.id);
    const result = await window.codixieAPI.snippet.restore(snippet.id);
    if (result) clientUpdateCodeSnippet(result);
  };
};

export const useDeletePermanentlyCodeSnippet = () => {
  const clientDelete = useClientStore((s) => s.deletePermanentlyCodeSnippet);

  return async function deletePermanently(snippet: ClientCodeSnippet) {
    clientDelete(snippet.id);
    window.codixieAPI.snippet.permanentDelete(snippet.id);
  };
};

export const useUpdateCodeSnippet = () => {
  const clientUpdate = useClientStore((s) => s.updateCodeSnippet);

  return async function updateCodeSnippet(snippet: ClientCodeSnippet & { isAutoLanguageDetection?: boolean }) {
    const { isAutoLanguageDetection: _isAutoLanguageDetection, ...preparedSnippet } = snippet;
    clientUpdate(preparedSnippet);
    const result = await window.codixieAPI.snippet.update(preparedSnippet);
    if (result) clientUpdate(result);
  };
};

export const useBlockEdit = () => {
  const clientToggle = useClientStore((s) => s.toggleBlockCodeSnippet);
  const setStatus = useClientStore((s) => s.setBlockCodeSnippetStatus);

  return async function blockEdit(snippet: ClientCodeSnippet) {
    clientToggle(snippet.id);
    const result = await window.codixieAPI.snippet.blockEdit(snippet.id, !snippet.isEditable);
    if (result) setStatus(snippet.id, !result.isEditable);
  };
};

export const usePin = () => {
  const clientToggle = useClientStore((s) => s.togglePinCodeSnippet);
  const setStatus = useClientStore((s) => s.setPinCodeSnippetStatus);

  return async function pin(snippet: ClientCodeSnippet) {
    clientToggle(snippet.id);
    const result = await window.codixieAPI.snippet.pin(snippet.id, !snippet.pinned);
    if (result) setStatus(snippet.id, result.pinned);
  };
};

export const useChangeTags = () => {
  const changeTags = useClientStore((s) => s.changeTagsForCodeSnippet);

  return async function changeTagsFn(snippetId: string, tags: string[]) {
    changeTags(snippetId, tags);
    window.codixieAPI.snippet.changeTags(snippetId, tags);
  };
};

export const useGetCodeSnippets = () => {
  const codeSnippets = useClientStore((s) => s.codeSnippets);
  return useMemo(() => codeSnippets.filter((c) => !c.deletedAt), [codeSnippets]);
};

export const useGetDeletedCodeSnippets = () => {
  const codeSnippets = useClientStore((s) => s.codeSnippets);
  return useMemo(() => codeSnippets.filter((c) => c.deletedAt), [codeSnippets]);
};
