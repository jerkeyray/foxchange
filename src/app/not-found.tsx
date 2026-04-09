import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
      <div className="relative">
        <p className="text-8xl font-black font-mono text-muted/50 select-none">404</p>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>
      <div className="space-y-2 -mt-4">
        <h2 className="text-xl font-bold">Page not found</h2>
        <p className="text-sm text-muted-foreground">
          No free lunch here either.
        </p>
      </div>
      <Link href="/">
        <Button variant="outline" className="gap-2 rounded-xl">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
