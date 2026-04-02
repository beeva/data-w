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
  item_kind: string | null;
  owner_id: string | null;
};

export type DataPoolDatasetInput = {
  title: string;
  description: string;
  category: string;
  price: number;
  data_types: string[];
  formats: string[];
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
      item_kind:
        row.item_kind === "dataset"
          ? ("dataset" as const)
          : ("project" as const),
      owner_user_id: row.owner_id ?? undefined,
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

export async function createDataPoolDataset(
  ownerId: string,
  input: DataPoolDatasetInput,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from("datapool_datasets").insert({
      owner_id: ownerId,
      title: input.title.trim(),
      description: input.description.trim() || "",
      category: input.category,
      price: input.price,
      data_types: input.data_types,
      formats: input.formats,
    });

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err : new Error("Failed to create dataset listing"),
    };
  }
}

export async function updateDataPoolDataset(
  datasetId: string,
  input: DataPoolDatasetInput,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("datapool_datasets")
      .update({
        title: input.title.trim(),
        description: input.description.trim() || "",
        category: input.category,
        price: input.price,
        data_types: input.data_types,
        formats: input.formats,
      })
      .eq("id", datasetId);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err : new Error("Failed to update dataset listing"),
    };
  }
}
