import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGoogleLikeIconName } from "@/lib/textUtils";
import { useUserNameStore } from "@/store/store";

type LocalUser = {
  image?: string | null;
  name?: string | null;
  username?: string | null;
};

const CustomAvatar = ({ user }: { user?: LocalUser }) => {
  const defaultUsername = useUserNameStore((state) => state.username);

  return (
    <Avatar className="h-8 w-8">
      {user?.image ? (
        <AvatarImage src={user?.image} />
      ) : (
        <AvatarFallback>
          {getGoogleLikeIconName(
            user?.username ?? user?.name ?? defaultUsername,
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default CustomAvatar;
