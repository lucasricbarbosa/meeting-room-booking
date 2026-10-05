import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/get-initials";

export function UserAvatar({ name }: { name: string }) {
  return (
    <Avatar aria-hidden="true">
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
