import { Suspense } from "react";
import DatasetDetailFromQuery from "@/components/datapool/DatasetDetailFromQuery";

export default function DatasetDetailQueryPage() {
  return (
    <Suspense fallback={null}>
      <DatasetDetailFromQuery />
    </Suspense>
  );
}

