import { supabase } from "@/lib/supabase/client";
import type { DataItem } from "@/components/datapool/DataItemCard";

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
  is_purchased?: boolean | null;
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

export type DataPoolDatasetDetail = {
  id: string;
  owner_id: string;
  owner_name: string | null;
  title: string;
  description: string;
  category: string;
  price: number;
  data_types: string[];
  formats: string[];
  created_at: string;
  updated_at: string;
};

export type DataPoolDatasetMessageRow = {
  id: string;
  dataset_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  /** Set on root posts when created via the discussion dialog */
  title: string | null;
  description: string | null;
  created_at: string;
  author_name: string | null;
};

async function getOwnDisplayName(userId: string): Promise<string | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) return null;
  const u = authData.user;
  if (!u || u.id !== userId) return null;

  const { data: own } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  const metaName = u.user_metadata?.full_name ?? u.user_metadata?.name;
  return (
    own?.full_name?.trim() ||
    (typeof metaName === "string" ? metaName.trim() : "") ||
    own?.email?.trim()?.split("@")[0] ||
    u.email?.split("@")[0] ||
    null
  );
}

function isMissingColumnError(error: unknown): boolean {
  const msg =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";
  return /column .* does not exist/i.test(msg);
}

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
      is_purchased: Boolean(row.is_purchased),
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
    const ownerDisplayName = (await getOwnDisplayName(ownerId)) ?? "Member";
    const { data, error } = await supabase
      .from("datapool_datasets")
      .insert({
        owner_id: ownerId,
        owner_display_name: ownerDisplayName,
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

export async function getDataPoolDatasetById(datasetId: string): Promise<{
  data: DataPoolDatasetDetail | null;
  error: Error | null;
}> {
  try {
    const primary = await supabase
      .from("datapool_datasets")
      .select(
        `
          id,
          owner_id,
          title,
          description,
          category,
          price,
          data_types,
          formats,
          owner_display_name,
          created_at,
          updated_at
        `,
      )
      .eq("id", datasetId)
      .single();
    let data = primary.data as any;
    let error = primary.error;

    // Backward-compatible path when owner_display_name column is not migrated yet.
    if (error && isMissingColumnError(error)) {
      const fallback = await supabase
        .from("datapool_datasets")
        .select(
          `
            id,
            owner_id,
            title,
            description,
            category,
            price,
            data_types,
            formats,
            created_at,
            updated_at
          `,
        )
        .eq("id", datasetId)
        .single();
      data = fallback.data as any;
      error = fallback.error;
    }

    if (error) return { data: null, error: new Error(error.message) };
    if (!data) return { data: null, error: null };

    let ownerName = data?.owner_display_name?.trim?.() || null;
    // If owner_display_name is unexpectedly empty, recover from signed-in owner profile.
    if (!ownerName) {
      ownerName = await getOwnDisplayName((data as any).owner_id);
    }

    return {
      data: {
        id: (data as any).id,
        owner_id: (data as any).owner_id,
        owner_name: ownerName,
        title: (data as any).title,
        description: (data as any).description ?? "",
        category: (data as any).category,
        price: Number((data as any).price ?? 0),
        data_types: ((data as any).data_types as string[]) ?? [],
        formats: ((data as any).formats as string[]) ?? [],
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to load dataset details"),
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

export async function listDataPoolDatasetMessages(datasetId: string): Promise<{
  data: DataPoolDatasetMessageRow[] | null;
  error: Error | null;
}> {
  try {
    const primary = await supabase
      .from("datapool_dataset_messages")
      .select(
        `
          id,
          dataset_id,
          author_id,
          parent_id,
          body,
          title,
          description,
          author_display_name,
          created_at
        `,
      )
      .eq("dataset_id", datasetId)
      .order("created_at", { ascending: false });
    let data = primary.data as any[] | null;
    let error = primary.error;

    // Backward-compatible path when title/description/author_display_name columns
    // are not migrated yet.
    if (error && isMissingColumnError(error)) {
      const fallback = await supabase
        .from("datapool_dataset_messages")
        .select(
          `
            id,
            dataset_id,
            author_id,
            parent_id,
            body,
            created_at
          `,
        )
        .eq("dataset_id", datasetId)
        .order("created_at", { ascending: false });
      data = fallback.data as any[] | null;
      error = fallback.error;
    }

    if (error) return { data: null, error: new Error(error.message) };

    const rows = ((data as any[]) ?? []).map((row) => {
      const authorName = row?.author_display_name?.trim?.() || null;
      return {
        id: row.id,
        dataset_id: row.dataset_id,
        author_id: row.author_id,
        parent_id: row.parent_id ?? null,
        body: row.body ?? "",
        title: row.title ?? null,
        description: row.description ?? null,
        created_at: row.created_at,
        author_name: authorName,
      } satisfies DataPoolDatasetMessageRow;
    });

    return { data: rows, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to load messages"),
    };
  }
}

export async function createDataPoolDatasetMessage(input: {
  datasetId: string;
  /** Reply text when `parentId` is set; ignored for new root discussions. */
  body?: string;
  parentId?: string | null;
  /** New root discussion only */
  title?: string | null;
  description?: string | null;
}): Promise<{ error: Error | null }> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) return { error: new Error(authError.message) };
    if (!user) return { error: new Error("You must be signed in to post") };
    const authorDisplayName = (await getOwnDisplayName(user.id)) ?? "Member";

    const parentId = input.parentId ?? null;

    if (!parentId) {
      const title = (input.title ?? "").trim();
      const description = (input.description ?? "").trim();
      if (!title) return { error: new Error("Title is required") };
      if (!description) return { error: new Error("Description is required") };

      let { error } = await supabase.from("datapool_dataset_messages").insert({
        dataset_id: input.datasetId,
        author_id: user.id,
        author_display_name: authorDisplayName,
        parent_id: null,
        title,
        description,
        body: description,
      });

      if (error && isMissingColumnError(error)) {
        // Fallback for DBs that don't have the new columns yet.
        const fallback = await supabase.from("datapool_dataset_messages").insert({
          dataset_id: input.datasetId,
          author_id: user.id,
          parent_id: null,
          body: description,
        });
        error = fallback.error;
      }

      if (error) return { error: new Error(error.message) };
      return { error: null };
    }

    const body = (input.body ?? "").trim();
    if (!body) return { error: new Error("Message cannot be empty") };

    let { error } = await supabase.from("datapool_dataset_messages").insert({
      dataset_id: input.datasetId,
      author_id: user.id,
      author_display_name: authorDisplayName,
      parent_id: parentId,
      body,
    });

    if (error && isMissingColumnError(error)) {
      const fallback = await supabase.from("datapool_dataset_messages").insert({
        dataset_id: input.datasetId,
        author_id: user.id,
        parent_id: parentId,
        body,
      });
      error = fallback.error;
    }

    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err : new Error("Failed to send message"),
    };
  }
}

export async function purchaseDataPoolDataset(
  datasetId: string,
): Promise<{ purchaseId: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("purchase_datapool_dataset", {
      p_dataset_id: datasetId,
    });
    if (error) {
      let msg = error.message;
      if (msg.includes("Insufficient balance")) {
        msg = "Insufficient balance. Add funds in your wallet to complete this purchase.";
      }
      return { purchaseId: null, error: new Error(msg) };
    }
    return { purchaseId: (data as string) ?? null, error: null };
  } catch (err) {
    return {
      purchaseId: null,
      error:
        err instanceof Error ? err : new Error("Failed to purchase dataset"),
    };
  }
}

export async function hasUserPurchasedDataPoolDataset(
  datasetId: string,
  buyerId: string | undefined,
): Promise<{ purchased: boolean; error: Error | null }> {
  if (!buyerId) return { purchased: false, error: null };
  try {
    const { data, error } = await supabase
      .from("datapool_dataset_purchases")
      .select("id")
      .eq("dataset_id", datasetId)
      .eq("buyer_id", buyerId)
      .maybeSingle();
    if (error) return { purchased: false, error: new Error(error.message) };
    return { purchased: !!data, error: null };
  } catch (err) {
    return {
      purchased: false,
      error:
        err instanceof Error ? err : new Error("Failed to check purchase status"),
    };
  }
}

export type DataPoolPurchaseListRow = {
  id: string;
  price_paid: number;
  created_at: string;
  dataset: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    price: number;
    owner_display_name: string | null;
    data_types: string[];
    formats: string[];
  } | null;
};

export async function listMyDataPoolPurchases(): Promise<{
  data: DataPoolPurchaseListRow[] | null;
  error: Error | null;
}> {
  try {
    const { data: purchases, error: pErr } = await supabase
      .from("datapool_dataset_purchases")
      .select("id, price_paid, created_at, dataset_id")
      .order("created_at", { ascending: false });

    if (pErr) return { data: null, error: new Error(pErr.message) };

    type PurchaseRow = {
      id: string;
      price_paid: number;
      created_at: string;
      dataset_id: string;
    };
    const plist = (purchases as PurchaseRow[] | null) ?? [];
    if (plist.length === 0) return { data: [], error: null };

    const ids = Array.from(new Set(plist.map((p) => p.dataset_id)));

    let primary = await supabase
      .from("datapool_datasets")
      .select(
        "id, title, description, category, price, owner_display_name, data_types, formats",
      )
      .in("id", ids);

    if (primary.error && isMissingColumnError(primary.error)) {
      primary = await supabase
        .from("datapool_datasets")
        .select("id, title, description, category, price, data_types, formats")
        .in("id", ids);
    }

    if (primary.error) {
      return { data: null, error: new Error(primary.error.message) };
    }

    const byId = new Map(
      ((primary.data as any[]) ?? []).map((d) => [d.id as string, d]),
    );

    const rows: DataPoolPurchaseListRow[] = plist.map((p) => {
      const ds = byId.get(p.dataset_id);
      return {
        id: p.id,
        price_paid: Number(p.price_paid ?? 0),
        created_at: p.created_at,
        dataset: ds
          ? {
              id: ds.id,
              title: ds.title,
              description: ds.description ?? null,
              category: ds.category,
              price: Number(ds.price ?? 0),
              owner_display_name: ds.owner_display_name?.trim?.() || null,
              data_types: ((ds as any).data_types as string[]) ?? [],
              formats: ((ds as any).formats as string[]) ?? [],
            }
          : null,
      };
    });

    return { data: rows, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to load purchases"),
    };
  }
}

export async function getDataPoolDatasetFileSignedUrl(input: {
  bucketId: string;
  storagePath: string;
  expiresIn?: number;
}): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(input.bucketId)
      .createSignedUrl(input.storagePath, input.expiresIn ?? 3600);
    if (error) return { url: null, error: new Error(error.message) };
    return { url: data?.signedUrl ?? null, error: null };
  } catch (err) {
    return {
      url: null,
      error:
        err instanceof Error ? err : new Error("Failed to create download link"),
    };
  }
}
