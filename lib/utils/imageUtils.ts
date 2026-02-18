/**
 * Image utility functions for resizing and optimizing images
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Resize and optimize an image file
 * @param file - The image file to resize
 * @param options - Resize options
 * @returns Promise<File> - The resized image file
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<File> {
  const {
    maxWidth = 256,
    maxHeight = 256,
    quality = 0.9,
    outputFormat = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions (square crop)
          const size = Math.min(img.width, img.height);
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;

          // Set canvas size to target dimensions
          canvas.width = maxWidth;
          canvas.height = maxHeight;

          // Draw image (cropped to square and resized)
          ctx.drawImage(
            img,
            offsetX,
            offsetY,
            size,
            size,
            0,
            0,
            maxWidth,
            maxHeight
          );

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              // Get file extension based on output format
              const ext = outputFormat.split('/')[1];
              const fileName = `avatar.${ext}`;

              // Create new file from blob
              const resizedFile = new File([blob], fileName, {
                type: outputFormat,
                lastModified: Date.now(),
              });

              resolve(resizedFile);
            },
            outputFormat,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns Object with isValid boolean and optional error message
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { isValid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a valid image file (JPG, PNG, or WebP)',
    };
  }

  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Image must be less than ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Get optimized output format based on input
 * WebP for supported browsers, JPEG as fallback
 */
export function getOptimalImageFormat(): 'image/webp' | 'image/jpeg' {
  // Check if browser supports WebP
  const canvas = document.createElement('canvas');
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'image/webp';
  }
  return 'image/jpeg';
}
