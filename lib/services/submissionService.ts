/**
 * Supabase service functions for Submission operations
 */

import { supabase } from "@/lib/supabase/client";
import { getProjectById } from "@/lib/services/projectService";
import { creditCollector } from "@/lib/services/walletService";
import type {
  Submission,
  SubmissionWithCollector,
  DataItem,
  DataVisibility,
  Validation,
  ProjectStats,
  SubmissionMetadata,
} from "@/types/submission";

type SubmissionStatsRow = {
  status: Submission["status"];
  validation_score: Submission["validation_score"];
};

/**
 * Get all submissions for a project
 */
export async function getSubmissionsByProject(
  projectId: string
): Promise<{ data: SubmissionWithCollector[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(
        `
        *,
        collector:profiles!collector_id(
          id,
          email,
          full_name,
          avatar_url,
          rating
        )
      `
      )
      .eq("request_id", projectId)
      .order("submitted_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as SubmissionWithCollector[], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to fetch submissions"),
    };
  }
}

/**
 * Get project submission statistics
 */
export async function getProjectStats(
  projectId: string
): Promise<{ data: ProjectStats | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("status, validation_score")
      .eq("request_id", projectId);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const submissions: SubmissionStatsRow[] = (data || []) as SubmissionStatsRow[];
    const stats: ProjectStats = {
      total_submissions: submissions.length,
      pending_submissions: submissions.filter((s: SubmissionStatsRow) => s.status === "pending")
        .length,
      validated_submissions: submissions.filter((s: SubmissionStatsRow) => s.status === "validated")
        .length,
      rejected_submissions: submissions.filter((s: SubmissionStatsRow) => s.status === "rejected")
        .length,
      disputed_submissions: submissions.filter((s: SubmissionStatsRow) => s.status === "disputed")
        .length,
      average_validation_score: null,
    };

    const validatedWithScore = submissions.filter(
      (s: SubmissionStatsRow) => s.status === "validated" && s.validation_score !== null
    );
    if (validatedWithScore.length > 0) {
      const totalScore = validatedWithScore.reduce(
        (sum: number, s: SubmissionStatsRow) => sum + (s.validation_score || 0),
        0
      );
      stats.average_validation_score = Math.round(
        totalScore / validatedWithScore.length
      );
    }

    return { data: stats, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to fetch project statistics"),
    };
  }
}

/**
 * Get data items for a submission
 */
export async function getDataItemsBySubmission(
  submissionId: string
): Promise<{ data: DataItem[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("data_items")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as DataItem[], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to fetch data items"),
    };
  }
}

/**
 * Get validations for a submission
 */
export async function getValidationsBySubmission(
  submissionId: string
): Promise<{ data: Validation[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("validations")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Validation[], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to fetch validations"),
    };
  }
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: string,
  validatorId?: string,
  validationScore?: number,
  rejectionReason?: string
): Promise<{ data: Submission | null; error: Error | null }> {
  try {
    const updates: any = {
      status,
      validated_at: status === "validated" || status === "rejected" ? new Date().toISOString() : null,
    };

    if (validatorId) {
      updates.validator_id = validatorId;
    }
    if (validationScore !== undefined) {
      updates.validation_score = validationScore;
    }
    if (status === "rejected") {
      updates.rejection_reason = rejectionReason?.trim() || null;
    } else if (status === "validated") {
      updates.rejection_reason = null;
    }

    const { data, error } = await supabase
      .from("submissions")
      .update(updates)
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Submission, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to update submission status"),
    };
  }
}

/**
 * Validate a submission and credit the collector's wallet.
 * Uses project budget allocation per expected submission unit.
 */
export async function validateSubmissionAndCreditCollector(
  submissionId: string,
  validatorId: string
): Promise<{ data: Submission | null; error: Error | null }> {
  try {
    const { data: submissionRow, error: submissionError } = await supabase
      .from("submissions")
      .select("id, request_id, collector_id, status")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submissionRow) {
      return { data: null, error: new Error(submissionError?.message || "Submission not found") };
    }

    const currentStatus = submissionRow.status as Submission["status"];
    if (currentStatus === "validated") {
      return { data: null, error: new Error("Submission is already validated.") };
    }
    if (currentStatus !== "pending") {
      return {
        data: null,
        error: new Error("Only pending submissions can be validated."),
      };
    }

    const { data: project, error: projectError } = await getProjectById(
      submissionRow.request_id
    );
    if (projectError || !project) {
      return { data: null, error: new Error(projectError?.message || "Project not found") };
    }

    const { count: existingPayouts, error: payoutCheckError } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", submissionId)
      .eq("status", "completed");

    if (payoutCheckError) {
      return { data: null, error: new Error(payoutCheckError.message) };
    }
    if ((existingPayouts ?? 0) > 0) {
      return {
        data: null,
        error: new Error("This submission has already been paid out."),
      };
    }

    const totalTarget = Math.max((project.max_collectors || 1) * 10, 1);
    const payoutAmount = Number(project.budget) / totalTarget;
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      return { data: null, error: new Error("Invalid payout amount for this project.") };
    }

    const { transactionId, error: creditError } = await creditCollector(
      project.requester_id,
      submissionRow.collector_id,
      submissionId,
      payoutAmount
    );
    if (creditError || !transactionId) {
      return {
        data: null,
        error: new Error(creditError?.message || "Failed to credit collector"),
      };
    }

    return updateSubmissionStatus(submissionId, "validated", validatorId);
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to validate and credit collector"),
    };
  }
}

/**
 * Create a new submission record
 */
export async function createSubmission(
  requestId: string,
  collectorId: string,
  metadata?: SubmissionMetadata | null
): Promise<{ data: Submission | null; error: Error | null }> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", collectorId)
      .single();

    if (profileError || !profile) {
      return { data: null, error: new Error("Profile not found") };
    }

    if (profile.role !== "collector") {
      return {
        data: null,
        error: new Error("Only collectors can submit project data."),
      };
    }

    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("status")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return { data: null, error: new Error("Project not found") };
    }

    if (request.status === "cancelled") {
      return {
        data: null,
        error: new Error("This project was cancelled. Submissions are no longer allowed."),
      };
    }

    if (request.status === "completed") {
      return {
        data: null,
        error: new Error("This project is completed. Submissions are no longer allowed."),
      };
    }

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        request_id: requestId,
        collector_id: collectorId,
        status: "pending",
        metadata: metadata || null,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Submission, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to create submission"),
    };
  }
}

type SubmissionFileForValidation = {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
};

export interface AiValidationFileResult {
  id: string;
  file_name: string;
  is_ai_generated: boolean;
  confidence: number;
  reasons: string[];
}

export interface AiValidationResult {
  has_ai_content: boolean;
  overall_pass: boolean;
  files: AiValidationFileResult[];
}

export async function validateLocalFilesWithAi(
  files: File[]
): Promise<{ data: AiValidationResult | null; error: Error | null }> {
  try {
    if (files.length === 0) {
      return { data: null, error: new Error("No files selected for validation") };
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file, file.name);
    });

    const res = await fetch("/api/validate-ai", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      return { data: null, error: new Error("AI validation request failed") };
    }

    const aiResult = (await res.json()) as AiValidationResult;
    return { data: aiResult, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to run local AI validation"),
    };
  }
}

export async function persistAutoValidationResult(
  submissionId: string,
  passed: boolean
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.rpc("auto_validate_submission", {
      p_submission_id: submissionId,
      p_passed: passed,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err
          : new Error("Failed to persist auto-validation result"),
    };
  }
}

/**
 * Run AI verification for a submission and persist automatic validation result.
 * - pass => marks submission as agent_validated
 * - fail => auto-rejects submission
 */
export async function autoValidateSubmissionWithAi(
  submissionId: string
): Promise<{ data: AiValidationResult | null; error: Error | null }> {
  try {
    const { data: files, error: filesError } = await supabase
      .from("data_items")
      .select("id,file_url,file_type,file_name,file_size,mime_type")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true });

    if (filesError) {
      return { data: null, error: new Error(filesError.message) };
    }

    const payloadFiles = (files || []) as SubmissionFileForValidation[];
    if (payloadFiles.length === 0) {
      return { data: null, error: new Error("No files found for validation") };
    }

    const res = await fetch("/api/validate-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: payloadFiles }),
    });

    if (!res.ok) {
      return { data: null, error: new Error("AI validation request failed") };
    }

    const aiResult = (await res.json()) as AiValidationResult;

    const { error: persistError } = await persistAutoValidationResult(
      submissionId,
      aiResult.overall_pass
    );

    if (persistError) {
      return { data: null, error: new Error(persistError.message) };
    }

    return { data: aiResult, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to auto-validate submission"),
    };
  }
}

/**
 * Upload a file to Supabase Storage (submissions bucket)
 */
export async function uploadSubmissionFile(
  collectorId: string,
  submissionId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const timestamp = Date.now();
    const filePath = `${collectorId}/${submissionId}/${timestamp}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("submissions")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { url: null, error: new Error(uploadError.message) };
    }

    const { data: urlData } = supabase.storage
      .from("submissions")
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err : new Error("Failed to upload file"),
    };
  }
}

/**
 * Create a data item record for an uploaded file
 */
export async function createDataItem(
  submissionId: string,
  fileUrl: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  mimeType: string
): Promise<{ data: DataItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("data_items")
      .insert({
        submission_id: submissionId,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as DataItem, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err : new Error("Failed to create data item"),
    };
  }
}

/**
 * Update a data item's visibility and price.
 * Intended for collectors after project completion.
 */
export async function updateDataItemAccess(
  dataItemId: string,
  visibility: DataVisibility,
  price: number
): Promise<{ data: DataItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("data_items")
      .update({
        visibility,
        price,
      })
      .eq("id", dataItemId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as DataItem, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Failed to update data item access settings"),
    };
  }
}

/**
 * Determine file type category from a MIME type
 */
export function getFileTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("text/")) return "document";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  ) {
    return "document";
  }
  return "other";
}
