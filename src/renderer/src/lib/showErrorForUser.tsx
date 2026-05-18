import { toast } from "sonner";

export const showErrorForUser = ({
  code,
  message,
  httpStatusCode,
  serverPath,
}: {
  code?: string;
  message?: string;
  httpStatusCode?: number;
  serverPath?: string;
}) => {
  const errorMessage = ` ${serverPath}: ${httpStatusCode} Code: ${code} Message: ${message}`;

  toast.dismiss();
  toast.error(
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold">Server error. Please try again</h1>
      <p>ErrorCode: {code}</p>
      <p>Message: {message}</p>
      <p>HttpStatusCode: {httpStatusCode}</p>
    </div>,
    { duration: Infinity },
  );
  console.error(errorMessage);
};
