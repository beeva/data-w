import { supabase } from "@/lib/supabase/client";
import type { DataItem } from "@/components/DataItemCard";

type DataPoolRow = {
  id: string;
  title: string;
  category: string;
  is_public: boolean;
  price: number | null;
  owner: string | null;
  description: string | null;
};

export async function getDataPoolItems(): Promise<{
  data: DataItem[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.rpc("get_datapool_items");

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const items = ((data as DataPoolRow[]) ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category || "Other",
      thumbnail: "/api/placeholder/300/200",
      isPublic: row.is_public,
      price: row.price ?? undefined,
      owner: row.owner || undefined,
      description: row.description || undefined,
    }));

    return { data: items, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to fetch DataPool items"),
    };
  }
}
