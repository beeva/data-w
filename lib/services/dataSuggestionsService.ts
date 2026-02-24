/**
 * Service for fetching data suggestions from existing projects and Hugging Face
 */

import { createClient, supabase } from "@/lib/supabase/client";
import type { Project } from "@/types/project";

export interface SimilarProject {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  created_at: string;
}

export interface HuggingFaceDataset {
  id: string;
  name: string;
  description: string;
  downloads: number;
  likes: number;
  tags: string[];
  author: string;
  url: string;
}

export interface BudgetSuggestions {
  average: number;
  median: number;
  min: number;
  max: number;
  recommended: number;
  count: number;
}

type ProjectSuggestionRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  created_at: string;
};

/**
 * Search for similar projects based on title and description keywords
 */
export async function searchSimilarProjects(
  title: string,
  description: string,
  limit: number = 5
): Promise<{ data: SimilarProject[] | null; error: Error | null }> {
  try {
    if (!title.trim() && !description.trim()) {
      return { data: [], error: null };
    }

    // const supabase = createClient();
    
    // Extract keywords from title and description
    const searchText = `${title} ${description}`.trim();
    
    if (searchText.length < 3) {
      return { data: [], error: null };
    }

    // Search for projects with similar keywords in title or description
    // Use ilike for case-insensitive pattern matching
    const searchPattern = `%${searchText}%`;
    
    // Search both title and description fields using OR
    // Supabase PostgREST syntax: "column1.ilike.value1,column2.ilike.value2"
    const { data, error } = await supabase
      .from("requests")
      .select("id, title, description, category, budget, created_at")
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(limit)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: (data || []).map((p: ProjectSuggestionRow) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        budget: p.budget,
        created_at: p.created_at,
      })) as SimilarProject[],
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to search similar projects"),
    };
  }
}

/**
 * Search Hugging Face datasets based on keywords
 * Uses the public Hugging Face API
 */
export async function searchHuggingFaceDatasets(
  query: string,
  limit: number = 5
): Promise<{ data: HuggingFaceDataset[] | null; error: Error | null }> {
  try {
    if (!query.trim()) {
      return { data: [], error: null };
    }

    // Hugging Face Datasets API endpoint
    const apiUrl = `https://huggingface.co/api/datasets?search=${encodeURIComponent(query)}&limit=${limit}`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform the response to our format
    const datasets: HuggingFaceDataset[] = (data || []).map((dataset: any) => ({
      id: dataset.id || dataset.name || "",
      name: dataset.id || dataset.name || "Unknown",
      description: dataset.description || dataset.paper?.title || "No description available",
      downloads: dataset.downloads || 0,
      likes: dataset.likes || 0,
      tags: dataset.tags || [],
      author: dataset.author || "Unknown",
      url: `https://huggingface.co/datasets/${dataset.id || dataset.name}`,
    }));

    return { data: datasets, error: null };
  } catch (err) {
    // Return mock data if API fails (for development)
    console.warn("Hugging Face API error, using mock data:", err);
    return {
      data: getMockHuggingFaceDatasets(query, limit),
      error: null,
    };
  }
}

/**
 * Mock Hugging Face datasets for development/fallback
 */
function getMockHuggingFaceDatasets(
  query: string,
  limit: number
): HuggingFaceDataset[] {
  const mockDatasets: HuggingFaceDataset[] = [
    {
      id: "common-voice",
      name: "Mozilla Common Voice",
      description: "A dataset of voices that everyone can use to train speech-enabled applications",
      downloads: 150000,
      likes: 3200,
      tags: ["audio", "speech", "multilingual"],
      author: "mozilla",
      url: "https://huggingface.co/datasets/mozilla-foundation/common_voice_13_0",
    },
    {
      id: "imagenet",
      name: "ImageNet",
      description: "A large visual database designed for use in visual object recognition research",
      downloads: 500000,
      likes: 8500,
      tags: ["images", "classification", "computer-vision"],
      author: "stanford",
      url: "https://huggingface.co/datasets/imagenet-1k",
    },
    {
      id: "coco",
      name: "COCO",
      description: "Common Objects in Context - large-scale object detection, segmentation, and captioning dataset",
      downloads: 300000,
      likes: 5200,
      tags: ["images", "object-detection", "segmentation"],
      author: "microsoft",
      url: "https://huggingface.co/datasets/coco",
    },
    {
      id: "squad",
      name: "SQuAD",
      description: "Stanford Question Answering Dataset - reading comprehension dataset",
      downloads: 200000,
      likes: 4100,
      tags: ["text", "qa", "nlp"],
      author: "stanford",
      url: "https://huggingface.co/datasets/squad",
    },
    {
      id: "wikipedia",
      name: "Wikipedia",
      description: "Wikipedia dataset containing cleaned articles from all languages",
      downloads: 1000000,
      likes: 12000,
      tags: ["text", "multilingual", "knowledge"],
      author: "wikipedia",
      url: "https://huggingface.co/datasets/wikipedia",
    },
  ];

  // Filter by query keywords if provided
  const queryLower = query.toLowerCase();
  const filtered = mockDatasets.filter(
    (ds) =>
      ds.name.toLowerCase().includes(queryLower) ||
      ds.description.toLowerCase().includes(queryLower) ||
      ds.tags.some((tag) => tag.toLowerCase().includes(queryLower))
  );

  return filtered.slice(0, limit);
}

/**
 * Calculate budget suggestions based on similar projects
 */
export function calculateBudgetSuggestions(
  projects: SimilarProject[]
): BudgetSuggestions | null {
  if (!projects || projects.length === 0) {
    return null;
  }

  const budgets = projects
    .map((p) => p.budget)
    .filter((b) => b > 0)
    .sort((a, b) => a - b);

  if (budgets.length === 0) {
    return null;
  }

  const sum = budgets.reduce((acc, val) => acc + val, 0);
  const average = sum / budgets.length;
  const min = budgets[0];
  const max = budgets[budgets.length - 1];
  
  // Calculate median
  const mid = Math.floor(budgets.length / 2);
  const median =
    budgets.length % 2 === 0
      ? (budgets[mid - 1] + budgets[mid]) / 2
      : budgets[mid];

  // Recommended budget: average rounded to nearest 10
  const recommended = Math.round(average / 10) * 10;

  return {
    average: Math.round(average * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    recommended,
    count: budgets.length,
  };
}
