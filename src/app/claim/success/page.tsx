import { Suspense } from "react";
import ClaimSuccessClient from "./ClaimSuccessClient";

// Optional: if this page should always render at request time
export const dynamic = "force-dynamic";

export default function ClaimSuccessPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ClaimSuccessClient />
    </Suspense>
  );
}
