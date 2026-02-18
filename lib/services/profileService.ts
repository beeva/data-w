/**
 * Supabase service functions for Profile operations
 */

import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/user";

/**
 * Fetch user profile by ID
 */
export async function getProfileById(
  userId: string
): Promise<{ data: UserProfile | null; error: Error | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as UserProfile, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to fetch profile"),
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ data: UserProfile | null; error: Error | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as UserProfile, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error("Failed to update profile"),
    };
  }
}

/**
 * Upload user avatar image
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const supabase = createClient();
    
    // Note: File validation and resizing should be done before calling this function
    // This service accepts pre-optimized images
    
    // Create a unique file name based on file type
    const fileExt = file.type.split('/')[1] || 'jpg';
    const fileName = `${userId}/avatar.${fileExt}`;
    
    // Delete old avatar if exists
    const { data: existingFiles } = await supabase
      .storage
      .from('avatars')
      .list(userId);
    
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage.from('avatars').remove(filesToDelete);
    }
    
    // Upload new avatar
    const { data, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      return { url: null, error: new Error(uploadError.message) };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);
    
    if (updateError) {
      return { url: null, error: new Error(updateError.message) };
    }
    
    return { url: publicUrl, error: null };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err : new Error('Failed to upload avatar'),
    };
  }
}

/**
 * Delete user avatar
 */
export async function deleteAvatar(
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient();
    
    // Delete avatar files from storage
    const { data: existingFiles } = await supabase
      .storage
      .from('avatars')
      .list(userId);
    
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage.from('avatars').remove(filesToDelete);
    }
    
    // Remove avatar URL from profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId);
    
    if (updateError) {
      return { error: new Error(updateError.message) };
    }
    
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete avatar'),
    };
  }
}