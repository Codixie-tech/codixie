import { useClientStore } from '@/store/store';
import { useContext, useMemo } from 'react';
import { uid } from 'uid';
import { v4 as uuidv4 } from 'uuid';
import { ModalContext } from '@/components/modals/ModalManager';

export const useAddTag = () => {
  const clientAddTag = useClientStore((s) => s.addTag);

  return async function addTag(name: string, color: string) {
    const newTag: ClientTag = {
      name,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id: uuidv4(),
      deletedAt: null,
      versionHash: uid(),
    };
    clientAddTag(newTag);
    window.codixieAPI.tag.create(newTag);
    return true;
  };
};

export const useRemoveTag = () => {
  const clientRemoveTag = useClientStore((s) => s.removeTag);

  return async function removeTag(tag: ClientTag) {
    clientRemoveTag(tag.id);
    window.codixieAPI.tag.delete(tag.id);
  };
};

export const useUpdateTag = () => {
  const clientUpdateTag = useClientStore((s) => s.updateTag);

  return async function updateTag(tag: ClientTag) {
    clientUpdateTag(tag);
    const result = await window.codixieAPI.tag.update(tag);
    if (result) clientUpdateTag(result);
  };
};

export const useGetTags = () => {
  const tags = useClientStore((s) => s.tags);
  return useMemo(() => tags.filter((t) => !t.deletedAt), [tags]);
};

export const useGetDeletedTags = () => {
  const tags = useClientStore((s) => s.tags);
  return useMemo(() => tags.filter((t) => t.deletedAt), [tags]);
};
