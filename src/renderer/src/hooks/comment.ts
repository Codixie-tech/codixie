import { useClientStore } from '@/store/store';

export const useAddComment = () => {
  return async function addComment(snippetId: string, comment: ClientComment) {
    window.codixieAPI.comment.add(snippetId, comment);
  };
};

export const useUpdateComment = () => {
  return async function updateComment(snippetId: string, comment: ClientComment) {
    window.codixieAPI.comment.update(snippetId, comment);
  };
};

export const useDeleteComment = () => {
  return async function deleteComment(snippetId: string, commentId: string) {
    window.codixieAPI.comment.delete(snippetId, commentId);
  };
};

export const useCreateComment = () => {
  return async function createComment(snippetId: string, comment: ClientComment) {
    window.codixieAPI.comment.add(snippetId, comment);
  };
};
