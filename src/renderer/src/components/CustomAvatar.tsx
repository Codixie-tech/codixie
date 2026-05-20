import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGoogleLikeIconName } from "@/lib/textUtils";

type LocalUser = {
  image?: string | null;
  name?: string | null;
};

const CustomAvatar = ({ user }: { user?: LocalUser }) => {
  return (
    <Avatar className="h-8 w-8">
      {user?.image ? (
        <AvatarImage src={user?.image} />
      ) : (
        <AvatarFallback>
          {getGoogleLikeIconName(user?.name ?? 'Codixie')}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default CustomAvatar;
