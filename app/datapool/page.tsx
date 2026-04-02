import { Suspense } from "react";
import DataPool from "@/components/datapool/DataPool";

export default function DataPoolPage() {
  return (
    <Suspense fallback={null}>
      <DataPool />
    </Suspense>
  );
}

