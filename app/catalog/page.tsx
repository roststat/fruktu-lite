import { Suspense } from "react";
import CatalogClient from "@/components/CatalogClient";

export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogClient />
    </Suspense>
  );
}
