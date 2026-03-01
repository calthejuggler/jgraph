import { Button } from "@/components/ui/button";
import { useStopImpersonating } from "@/queries/admin";

interface ImpersonationBannerProps {
  name: string;
  email: string;
}

export function ImpersonationBanner({ name, email }: ImpersonationBannerProps) {
  const stopImpersonating = useStopImpersonating();

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-1.5 text-sm font-medium text-black">
      <span>
        Viewing as {name} ({email})
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-6 border-black/30 bg-transparent text-black hover:bg-black/10"
        onClick={() => stopImpersonating.mutate()}
        disabled={stopImpersonating.isPending}
      >
        {stopImpersonating.isPending ? "Stopping..." : "Stop Impersonating"}
      </Button>
    </div>
  );
}
