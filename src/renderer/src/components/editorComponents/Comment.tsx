import { useUserNameStore } from "@/store/store";

const Comment = ({ comment }: { comment?: ClientComment }) => {
  const defaultUsername = useUserNameStore((state) => state.username);

  if (!comment) return;
  return (
    <div>
      <header className="flex gap-3">
        <div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-4 dark:bg-dark-gray-5">
            <i className="ri-user-line ri-sm text-gray-6 dark:text-dark-gray-3" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-7 dark:text-dark-gray-1">
            {defaultUsername}
          </span>
          <span className="text-xs font-medium text-gray-6 dark:text-dark-gray-4">
            {new Date(comment.createdAt).toLocaleString(undefined, {
              timeStyle: "short",
              dateStyle: "short",
            })}
          </span>
        </div>
      </header>
      <p className="break-all py-3 text-xs text-gray-7 dark:text-dark-gray-1">
        {comment.text}
      </p>
    </div>
  );
};

export default Comment;
