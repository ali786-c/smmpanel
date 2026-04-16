import { Activity } from "lucide-react";

export default function SystemStatus() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs">
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <Activity className="w-3 h-3 text-primary" />
      <span className="text-muted-foreground">All Systems Operational</span>
      <span className="text-primary font-semibold">99.9%</span>
    </div>
  );
}
