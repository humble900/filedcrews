import { Loader2 } from "lucide-react";

export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200 select-none">
      <img src="/favicon.png" alt="FiledCrews" className="h-10 w-10 animate-pulse rounded-xl shadow-md" />
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold tracking-wide">
        <Loader2 className="h-4 w-4 animate-spin text-teal-600 dark:text-teal-400" />
        <span>Loading FiledCrews…</span>
      </div>
    </div>
  );
}
