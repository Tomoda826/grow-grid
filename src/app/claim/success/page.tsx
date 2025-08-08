import { Suspense } from "react";
import ClaimSuccessClient from "./ClaimSuccessClient";

// Render dynamically so the client subtree can bail out cleanly.
export const dynamic = "force-dynamic";

export default function ClaimSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-lg animate-pulse">
            <div className="h-6 w-48 bg-muted rounded mb-4" />
            <div className="h-4 w-80 bg-muted rounded mb-8" />
            <div className="h-40 w-full bg-muted rounded" />
          </div>
        </div>
      }
    >
      <ClaimSuccessClient />
    </Suspense>
  );
}
