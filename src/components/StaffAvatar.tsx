import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StaffAvatarProps {
  photoUrl?: string | null;
  fullName: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
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
