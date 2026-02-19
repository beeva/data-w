import { NextRequest, NextResponse } from "next/server";

interface FileToCheck {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number | null;
}

interface FileResult {
  id: string;
  file_name: string;
  is_ai_generated: boolean;
  confidence: number;
  reasons: string[];
}

/**
 * Analyzes image binary data for AI-generation indicators by examining
 * raw byte patterns rather than relying on a third-party API.
 */
function analyzeImageBytes(buffer: Buffer, fileName: string, fileSize: number | null): {
  is_ai_generated: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let aiScore = 0;

  // 1. Check for EXIF / metadata presence
  //    Real camera photos contain EXIF (starts with 0xFFE1 in JPEG after SOI).
  //    AI images typically have zero EXIF.
  const hasJpegSOI = buffer[0] === 0xff && buffer[1] === 0xd8;
  const hasPngSig =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  if (hasJpegSOI) {
    const exifMarker = buffer.indexOf(Buffer.from([0xff, 0xe1]));
    const jfifMarker = buffer.indexOf(Buffer.from([0xff, 0xe0]));

    if (exifMarker === -1 && jfifMarker === -1) {
      aiScore += 25;
      reasons.push("No EXIF or JFIF metadata found (common in AI-generated images)");
    } else if (exifMarker !== -1) {
      const exifBlock = buffer.slice(exifMarker, Math.min(exifMarker + 500, buffer.length));
      const exifStr = exifBlock.toString("latin1");
      const hasCameraModel =
        exifStr.includes("Canon") ||
        exifStr.includes("Nikon") ||
        exifStr.includes("Sony") ||
        exifStr.includes("Samsung") ||
        exifStr.includes("Apple") ||
        exifStr.includes("Google") ||
        exifStr.includes("HUAWEI") ||
        exifStr.includes("Xiaomi") ||
        exifStr.includes("OLYMPUS") ||
        exifStr.includes("Fujifilm") ||
        exifStr.includes("Panasonic");

      if (!hasCameraModel) {
        aiScore += 15;
        reasons.push("EXIF present but no recognized camera manufacturer");
      }

      const hasGPS =
        exifStr.includes("GPS") || buffer.indexOf(Buffer.from([0x00, 0x12])) !== -1;
      if (!hasGPS) {
        aiScore += 5;
        reasons.push("No GPS data in EXIF");
      }
    }

    // Check for known AI tool signatures embedded as JPEG comments (0xFFFE)
    const commentMarker = buffer.indexOf(Buffer.from([0xff, 0xfe]));
    if (commentMarker !== -1) {
      const comment = buffer
        .slice(commentMarker + 4, Math.min(commentMarker + 200, buffer.length))
        .toString("latin1")
        .toLowerCase();
      const aiTools = [
        "stable diffusion",
        "midjourney",
        "dall-e",
        "dalle",
        "comfyui",
        "automatic1111",
        "novelai",
        "adobe firefly",
        "dreamstudio",
      ];
      for (const tool of aiTools) {
        if (comment.includes(tool)) {
          aiScore += 40;
          reasons.push(`AI tool signature detected: "${tool}"`);
          break;
        }
      }
    }
  }

  if (hasPngSig) {
    const pngText = buffer.toString("latin1");

    // PNG tEXt / iTXt chunks may contain generator info
    const aiKeywords = [
      "stable diffusion",
      "midjourney",
      "dall-e",
      "dalle",
      "comfyui",
      "novelai",
      "dreamstudio",
      "adobe firefly",
      "ai_generated",
      "dream_prompt",
      "parameters\nsteps",
      "sampler:",
      "cfg scale",
    ];
    for (const kw of aiKeywords) {
      if (pngText.toLowerCase().includes(kw)) {
        aiScore += 40;
        reasons.push(`AI generation metadata found: "${kw}"`);
        break;
      }
    }

    // Check for tEXt chunks that contain "parameters" (Automatic1111 style)
    if (pngText.includes("tEXt") && pngText.includes("parameters")) {
      aiScore += 30;
      reasons.push("PNG contains generation parameters chunk (typical of AI tools)");
    }

    // No camera-like chunks
    const hasExifInPng = pngText.includes("eXIf") || pngText.includes("Exif");
    if (!hasExifInPng) {
      aiScore += 10;
      reasons.push("No EXIF data in PNG (real photos usually retain EXIF)");
    }
  }

  // 2. Statistical byte analysis
  //    AI images tend to have very uniform byte distributions compared to real photos
  //    which have more noise variety.
  if (buffer.length > 1000) {
    const sampleSize = Math.min(buffer.length, 50000);
    const sampleStart = Math.floor((buffer.length - sampleSize) / 2);
    const sample = buffer.slice(sampleStart, sampleStart + sampleSize);

    const freq = new Uint32Array(256);
    for (let i = 0; i < sample.length; i++) {
      freq[sample[i]]++;
    }

    const mean = sample.length / 256;
    let variance = 0;
    for (let i = 0; i < 256; i++) {
      variance += (freq[i] - mean) ** 2;
    }
    variance /= 256;
    const coeffOfVariation = Math.sqrt(variance) / mean;

    // Very low variation can indicate synthetic data
    if (coeffOfVariation < 0.3) {
      aiScore += 15;
      reasons.push("Unusually uniform byte distribution (statistical anomaly)");
    }
  }

  // 3. File size heuristic
  //    AI images at typical resolutions (512x512, 1024x1024) tend to be
  //    in specific size ranges. Real camera photos at high MP are usually > 1MB.
  if (fileSize) {
    if (fileSize < 200_000 && (hasJpegSOI || hasPngSig)) {
      aiScore += 10;
      reasons.push("Unusually small file size for an image");
    }
  }

  // 4. File name patterns
  const lowerName = fileName.toLowerCase();
  const aiNamePatterns = [
    /^(image|output|generated|result|sample|img)[-_]?\d*\./,
    /\b(sd|sdxl|flux|dalle|mj|midjourney)\b/,
    /^\d{8,}_\d+\./,
    /^[0-9a-f]{8,}\./,
    /^comfyui/,
    /^tmpimg/,
  ];
  for (const pattern of aiNamePatterns) {
    if (pattern.test(lowerName)) {
      aiScore += 10;
      reasons.push("File name matches common AI output naming pattern");
      break;
    }
  }

  const confidence = Math.min(aiScore, 100);
  const is_ai_generated = confidence >= 40;

  if (reasons.length === 0) {
    reasons.push("No AI-generation indicators detected");
  }

  return { is_ai_generated, confidence, reasons };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const files: FileToCheck[] = body.files;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results: FileResult[] = [];
    let hasAiContent = false;

    for (const file of files) {
      // Only analyze image files for AI detection
      if (file.file_type !== "image") {
        results.push({
          id: file.id,
          file_name: file.file_name,
          is_ai_generated: false,
          confidence: 0,
          reasons: ["Non-image file — skipped AI check"],
        });
        continue;
      }

      try {
        const res = await fetch(file.file_url, {
          headers: { Range: "bytes=0-65535" },
        });

        if (!res.ok) {
          results.push({
            id: file.id,
            file_name: file.file_name,
            is_ai_generated: false,
            confidence: 0,
            reasons: ["Could not fetch file for analysis"],
          });
          continue;
        }

        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const analysis = analyzeImageBytes(buffer, file.file_name, file.file_size);

        if (analysis.is_ai_generated) hasAiContent = true;

        results.push({
          id: file.id,
          file_name: file.file_name,
          ...analysis,
        });
      } catch {
        results.push({
          id: file.id,
          file_name: file.file_name,
          is_ai_generated: false,
          confidence: 0,
          reasons: ["Error analyzing file"],
        });
      }
    }

    return NextResponse.json({
      has_ai_content: hasAiContent,
      overall_pass: !hasAiContent,
      files: results,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
