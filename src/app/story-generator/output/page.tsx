import { Suspense } from "react";
import OutputContent from "./output-content";

export default function OutputPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OutputContent />
    </Suspense>
  );
}
