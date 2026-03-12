import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StaffAvatarProps {
  photoUrl?: string | null;
  fullName: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function StaffAvatar({ photoUrl, fullName, size = "md", className }: StaffAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], "shrink-0", className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={fullName} className="object-cover" />}
      <AvatarFallback className={cn(sizeClasses[size], "bg-muted text-muted-foreground font-semibold")}>
        {getInitials(fullName)}
      </AvatarFallback>
    </Avatar>
  );
}
