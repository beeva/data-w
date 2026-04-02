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

export type DataPoolDatasetFileRow = {
  id: string;
  dataset_id: string;
  owner_id: string;
  bucket_id: string;
  storage_path: string;
  public_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
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
): Promise<{ id: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("datapool_datasets")
      .insert({
        owner_id: ownerId,
        title: input.title.trim(),
        description: input.description.trim() || "",
        category: input.category,
        price: input.price,
        data_types: input.data_types,
        formats: input.formats,
      })
      .select("id")
      .single();

    if (error) {
      return { id: null, error: new Error(error.message) };
    }
    return { id: (data as { id: string } | null)?.id ?? null, error: null };
  } catch (err) {
    return {
      id: null,
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

const DATASET_FILES_BUCKET = "dataset-files";

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadDataPoolDatasetFile(input: {
  ownerId: string;
  datasetId: string;
  file: File;
}): Promise<{
  bucketId: string;
  storagePath: string;
  publicUrl: string | null;
  error: Error | null;
}> {
  try {
    const timestamp = Date.now();
    const storagePath = `${input.ownerId}/datapool_datasets/${input.datasetId}/${timestamp}_${safeFileName(input.file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(DATASET_FILES_BUCKET)
      .upload(storagePath, input.file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      return {
        bucketId: DATASET_FILES_BUCKET,
        storagePath,
        publicUrl: null,
        error: new Error(uploadError.message),
      };
    }

    const { data: urlData } = supabase.storage
      .from(DATASET_FILES_BUCKET)
      .getPublicUrl(storagePath);

    return {
      bucketId: DATASET_FILES_BUCKET,
      storagePath,
      publicUrl: urlData.publicUrl,
      error: null,
    };
  } catch (err) {
    return {
      bucketId: DATASET_FILES_BUCKET,
      storagePath: "",
      publicUrl: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to upload dataset file"),
    };
  }
}

export async function createDataPoolDatasetFileRecord(input: {
  datasetId: string;
  ownerId: string;
  bucketId: string;
  storagePath: string;
  publicUrl: string;
  file: File;
}): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from("datapool_dataset_files").insert({
      dataset_id: input.datasetId,
      owner_id: input.ownerId,
      bucket_id: input.bucketId,
      storage_path: input.storagePath,
      public_url: input.publicUrl,
      file_name: input.file.name,
      file_size: input.file.size,
      mime_type: input.file.type || null,
    });

    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err
          : new Error("Failed to save dataset file record"),
    };
  }
}

export async function listDataPoolDatasetFiles(datasetId: string): Promise<{
  data: DataPoolDatasetFileRow[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from("datapool_dataset_files")
      .select("*")
      .eq("dataset_id", datasetId)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: new Error(error.message) };
    return { data: (data as DataPoolDatasetFileRow[]) ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to load dataset files"),
    };
  }
}

export async function deleteDataPoolDatasetFile(input: {
  fileId: string;
  bucketId: string;
  storagePath: string;
}): Promise<{ error: Error | null }> {
  try {
    const { error: storageError } = await supabase.storage
      .from(input.bucketId)
      .remove([input.storagePath]);

    if (storageError) {
      return { error: new Error(storageError.message) };
    }

    const { error: deleteError } = await supabase
      .from("datapool_dataset_files")
      .delete()
      .eq("id", input.fileId);

    if (deleteError) return { error: new Error(deleteError.message) };
    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err
          : new Error("Failed to delete dataset file"),
    };
  }
}
