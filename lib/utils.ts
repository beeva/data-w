import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function withTimeout<T>(promise: PromiseLike<T>, ms = 15000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ])
}

const categoryColorMap: Record<string, string> = {
  "Photography": "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "Video":       "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "Audio":       "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
  "Text":        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "Survey":      "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  "Location Data": "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
  "Sensor Data": "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  "Other":       "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

export function getCategoryColor(category: string): string {
  return categoryColorMap[category] ?? categoryColorMap["Other"];
}

