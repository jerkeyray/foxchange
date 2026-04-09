"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{error.message}</p>
      </div>
      <Button onClick={reset} variant="outline" className="gap-2 rounded-xl">
        <RotateCcw className="w-3.5 h-3.5" /> Try again
      </Button>
    </div>
  );
}
