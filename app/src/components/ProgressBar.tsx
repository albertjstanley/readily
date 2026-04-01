import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  message: string;
}

export function ProgressBar({ message }: ProgressBarProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm text-zinc-500">{message}</p>
      <div className="h-1.5 w-64 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full animate-pulse rounded-full bg-blue-500" style={{ width: "60%" }} />
      </div>
    </div>
  );
}
