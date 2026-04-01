import { supabase } from "@/lib/supabase/client";
import type { DataItem } from "@/components/DataItemCard";

type DataPoolRow = {
  id: string;
  title: string;
  category: string;
  price: number | null;
  owner: string | null;
  description: string | null;
  data_types: string[] | null;
  formats: string[] | null;
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
      price: row.price ?? undefined,
      owner: row.owner || undefined,
      description: row.description || undefined,
      data_types: row.data_types ?? undefined,
      formats: row.formats ?? undefined,
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
