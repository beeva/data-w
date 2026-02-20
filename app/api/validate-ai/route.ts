import { NextRequest, NextResponse } from "next/server";

interface FileToCheck {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number | null;
  mime_type?: string | null;
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

/**
 * Analyzes video binary data for AI-generation indicators.
 * Checks MP4/WebM/MOV container metadata for camera info, AI tool signatures,
 * and structural anomalies.
 */
function analyzeVideoBytes(buffer: Buffer, fileName: string, fileSize: number | null): {
  is_ai_generated: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let aiScore = 0;
  const text = buffer.toString("latin1").toLowerCase();

  // 1. Check for MP4 ftyp box — real camera videos use specific brands
  const ftypIdx = buffer.indexOf("ftyp");
  if (ftypIdx !== -1) {
    const ftypBlock = buffer.slice(ftypIdx, Math.min(ftypIdx + 32, buffer.length)).toString("latin1");
    const cameraFtyps = ["mp41", "mp42", "isom", "avc1", "qt  "];
    const hasCameraBrand = cameraFtyps.some((b) => ftypBlock.includes(b));

    if (!hasCameraBrand) {
      aiScore += 10;
      reasons.push("Unusual MP4 brand (not typical of camera recordings)");
    }
  }

  // 2. Check for camera/device metadata in MP4 moov/udta atoms
  const cameraMarkers = [
    "canon", "nikon", "sony", "samsung", "apple",
    "google", "huawei", "xiaomi", "gopro", "dji",
    "iphone", "pixel", "galaxy", "insta360",
  ];
  const hasDeviceMeta = cameraMarkers.some((m) => text.includes(m));
  if (!hasDeviceMeta) {
    aiScore += 15;
    reasons.push("No recognized camera/device metadata in video container");
  }

  // 3. Check for GPS metadata (©xyz atom in MP4)
  const hasGps = text.includes("©xyz") || text.includes("gps") || text.includes("location");
  if (!hasGps) {
    aiScore += 5;
    reasons.push("No GPS/location data embedded in video");
  }

  // 4. Check for AI video tool signatures
  const aiVideoTools = [
    "runway", "runwayml", "pika", "pika labs",
    "stable video", "svd", "animatediff",
    "deforum", "modelscope", "zeroscope",
    "gen-2", "gen-3", "sora", "kling",
    "luma dream machine", "haiper",
    "synthesia", "d-id", "heygen",
    "elevenlabs", "wav2lip",
  ];
  for (const tool of aiVideoTools) {
    if (text.includes(tool)) {
      aiScore += 40;
      reasons.push(`AI video tool signature detected: "${tool}"`);
      break;
    }
  }

  // 5. Check for encoding software metadata
  const encoderMarkers = [
    "lavf", "ffmpeg", "handbrake", "obs", "x264", "x265",
  ];
  const hasEncoder = encoderMarkers.some((e) => text.includes(e));
  const hasCreationTool = text.includes("©too") || text.includes("encoder") || text.includes("muxer");

  if (hasEncoder && !hasDeviceMeta) {
    aiScore += 10;
    reasons.push("Encoded with desktop software but no camera device metadata");
  }

  // 6. Very short duration heuristic for AI-generated clips
  //    AI video tools typically produce 2-10 second clips
  if (fileSize && fileSize < 5_000_000) {
    aiScore += 5;
    reasons.push("Small file size (common for short AI-generated video clips)");
  }

  // 7. File name patterns
  const lowerName = fileName.toLowerCase();
  const aiVideoNamePatterns = [
    /\b(runway|pika|gen[-_]?[23]|sora|kling|svd|animatediff)\b/,
    /^(output|generated|result|video)[-_]?\d*\./,
    /^\d{8,}_\d+\./,
    /^[0-9a-f]{8,}\./,
  ];
  for (const pattern of aiVideoNamePatterns) {
    if (pattern.test(lowerName)) {
      aiScore += 10;
      reasons.push("File name matches common AI video output naming pattern");
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

/**
 * Analyzes audio binary data for AI-generation indicators.
 * Checks for TTS signatures, AI music tool markers, missing recording
 * device metadata, and structural anomalies.
 */
function analyzeAudioBytes(buffer: Buffer, fileName: string, fileSize: number | null): {
  is_ai_generated: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let aiScore = 0;
  const text = buffer.toString("latin1").toLowerCase();

  // 1. Check for ID3 tags in MP3 (real recordings often have rich ID3 metadata)
  const hasId3 = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33; // "ID3"
  const isFlac = buffer[0] === 0x66 && buffer[1] === 0x4c && buffer[2] === 0x61 && buffer[3] === 0x43;
  const isOgg = buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53;
  const isWav = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // RIFF
  const isM4a = text.includes("ftyp");

  // 2. Check for recording device metadata
  const recorderMarkers = [
    "voice memo", "recorder", "iphone", "samsung",
    "pixel", "microphone", "audacity", "garage",
    "logic pro", "pro tools", "ableton",
  ];
  const hasRecorderMeta = recorderMarkers.some((m) => text.includes(m));

  if (!hasRecorderMeta && !hasId3) {
    aiScore += 15;
    reasons.push("No recording device or ID3 metadata found");
  }

  // 3. Check for AI TTS (text-to-speech) tool signatures
  const aiTtsTools = [
    "elevenlabs", "eleven labs", "xi-api",
    "murf", "play.ht", "resemble",
    "wellsaid", "coqui", "tortoise",
    "bark", "xtts", "azure tts",
    "google tts", "amazon polly",
    "openai tts", "tts-1",
    "speechify", "lovo",
    "deepgram", "unreal speech",
  ];
  for (const tool of aiTtsTools) {
    if (text.includes(tool)) {
      aiScore += 40;
      reasons.push(`AI TTS tool signature detected: "${tool}"`);
      break;
    }
  }

  // 4. Check for AI music generation tool signatures
  const aiMusicTools = [
    "suno", "udio", "mubert",
    "aiva", "soundraw", "boomy",
    "amper", "jukebox", "musiclm",
    "musicgen", "stable audio",
    "riffusion", "harmonai",
    "beatoven", "loudly",
  ];
  for (const tool of aiMusicTools) {
    if (text.includes(tool)) {
      aiScore += 40;
      reasons.push(`AI music generation tool signature detected: "${tool}"`);
      break;
    }
  }

  // 5. Check comment/description fields for AI markers
  const aiCommentKeywords = [
    "generated by", "synthesized",
    "text-to-speech", "text to speech",
    "ai generated", "ai-generated",
    "neural", "voice clone",
  ];
  for (const kw of aiCommentKeywords) {
    if (text.includes(kw)) {
      aiScore += 30;
      reasons.push(`AI-related keyword found in metadata: "${kw}"`);
      break;
    }
  }

  // 6. WAV files from AI tools often lack metadata chunks beyond fmt+data
  if (isWav) {
    const hasListChunk = text.includes("list") || text.includes("info");
    if (!hasListChunk) {
      aiScore += 10;
      reasons.push("WAV file lacks LIST/INFO metadata chunks (common in AI-generated audio)");
    }
  }

  // 7. File name patterns
  const lowerName = fileName.toLowerCase();
  const aiAudioNamePatterns = [
    /\b(elevenlabs|suno|udio|tts|mubert|aiva|musicgen|bark)\b/,
    /^(output|generated|result|audio|speech|voice)[-_]?\d*\./,
    /^\d{8,}_\d+\./,
    /^[0-9a-f]{8,}\./,
    /^tts[-_]/,
  ];
  for (const pattern of aiAudioNamePatterns) {
    if (pattern.test(lowerName)) {
      aiScore += 10;
      reasons.push("File name matches common AI audio output naming pattern");
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

/**
 * Determines the document sub-type from file name extension and mime type.
 */
function getDocType(fileName: string, mimeType?: string | null): "pdf" | "csv" | "json" | "xml" | "other" {
  const ext = fileName.toLowerCase().split(".").pop() || "";
  if (ext === "pdf" || mimeType?.includes("pdf")) return "pdf";
  if (ext === "csv" || mimeType?.includes("csv")) return "csv";
  if (ext === "json" || mimeType?.includes("json")) return "json";
  if (ext === "xml" || mimeType?.includes("xml")) return "xml";
  return "other";
}

/**
 * Analyzes document files (PDF, CSV, JSON, XML) for AI-generation indicators.
 */
function analyzeDocumentBytes(
  buffer: Buffer,
  fileName: string,
  fileSize: number | null,
  mimeType?: string | null
): {
  is_ai_generated: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let aiScore = 0;
  const docType = getDocType(fileName, mimeType);

  // Read as much text as possible (limit to 256KB to avoid OOM on huge files)
  const textSlice = buffer.slice(0, Math.min(buffer.length, 262144));
  const text = textSlice.toString("utf-8").toLowerCase();

  // ── Shared: AI-generation keywords across all document types ──
  const aiKeywords = [
    "generated by chatgpt", "generated by gpt",
    "generated by ai", "ai-generated",
    "openai", "chatgpt", "gpt-4", "gpt-3.5", "gpt-4o",
    "claude", "anthropic",
    "gemini", "google bard", "bard",
    "copilot", "llama", "mistral",
    "this text was generated",
    "as an ai language model",
    "as a large language model",
    "i'm an ai", "i am an ai",
    "generated using artificial intelligence",
    "synthetic data",
    "faker.js", "faker", "fakerpython",
    "mockaroo", "generatedata",
  ];
  for (const kw of aiKeywords) {
    if (text.includes(kw)) {
      aiScore += 35;
      reasons.push(`AI keyword found in content: "${kw}"`);
      break;
    }
  }

  // ── PDF-specific checks ──
  if (docType === "pdf") {
    const rawLatin = buffer.toString("latin1").toLowerCase();

    // Check PDF Producer / Creator metadata
    const producerMatch = rawLatin.match(/\/producer\s*\(([^)]{0,200})\)/);
    const creatorMatch = rawLatin.match(/\/creator\s*\(([^)]{0,200})\)/);
    const producer = producerMatch?.[1] || "";
    const creator = creatorMatch?.[1] || "";
    const meta = producer + " " + creator;

    const aiPdfTools = [
      "chatgpt", "openai", "gpt", "ai2pdf",
      "jasper", "copy.ai", "writesonic",
      "notion ai", "grammarly ai",
    ];
    for (const tool of aiPdfTools) {
      if (meta.includes(tool)) {
        aiScore += 35;
        reasons.push(`PDF Producer/Creator indicates AI tool: "${tool}"`);
        break;
      }
    }

    // Very uniform text blocks (AI text tends to have extremely consistent paragraph sizes)
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 50);
    if (paragraphs.length > 5) {
      const lengths = paragraphs.map((p) => p.length);
      const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((acc, l) => acc + (l - avgLen) ** 2, 0) / lengths.length;
      const cv = Math.sqrt(variance) / avgLen;
      if (cv < 0.15) {
        aiScore += 15;
        reasons.push("Suspiciously uniform paragraph lengths (common in AI-generated text)");
      }
    }
  }

  // ── CSV-specific checks ──
  if (docType === "csv") {
    const lines = text.split("\n").filter((l) => l.trim().length > 0);

    if (lines.length > 10) {
      // Check for synthetic/placeholder data patterns
      const syntheticPatterns = [
        /john\s*doe/g, /jane\s*doe/g, /john\s*smith/g,
        /example\.com/g, /test@/g, /lorem\s*ipsum/g,
        /foo\s*bar/g, /acme/g,
        /123\s*main\s*st/g, /555[-\s]?\d{4}/g,
      ];
      let syntheticHits = 0;
      for (const pattern of syntheticPatterns) {
        const matches = text.match(pattern);
        if (matches) syntheticHits += matches.length;
      }
      if (syntheticHits >= 3) {
        aiScore += 25;
        reasons.push(`Multiple synthetic/placeholder data patterns found (${syntheticHits} matches)`);
      }

      // Check for perfectly sequential IDs (1,2,3,4... in first column)
      const firstColValues = lines.slice(1, Math.min(51, lines.length))
        .map((l) => l.split(",")[0]?.trim())
        .filter(Boolean);
      const sequential = firstColValues.every((v, i) => v === String(i + 1));
      if (sequential && firstColValues.length > 10) {
        aiScore += 15;
        reasons.push("First column contains perfectly sequential IDs (1,2,3...) — common in generated data");
      }

      // Check for zero variance in numeric columns (exact same value repeated)
      const dataLines = lines.slice(1, Math.min(101, lines.length));
      const colCount = lines[0].split(",").length;
      for (let col = 0; col < colCount; col++) {
        const vals = dataLines.map((l) => l.split(",")[col]?.trim()).filter(Boolean);
        const numVals = vals.map(Number).filter((n) => !isNaN(n));
        if (numVals.length > 10) {
          const allSame = numVals.every((v) => v === numVals[0]);
          if (allSame) {
            aiScore += 10;
            reasons.push(`Column ${col + 1} has identical values in all rows — possible filler data`);
            break;
          }
        }
      }
    }
  }

  // ── JSON-specific checks ──
  if (docType === "json") {
    // Check for synthetic data generator markers
    const jsonGenMarkers = [
      "faker", "mockaroo", "json-generator",
      "generatedata", "chance.js", "dummy",
      "randomuser.me", "jsonplaceholder",
    ];
    for (const marker of jsonGenMarkers) {
      if (text.includes(marker)) {
        aiScore += 30;
        reasons.push(`Synthetic data generator marker found: "${marker}"`);
        break;
      }
    }

    // Check for overly repetitive structure (many identical-shape objects with placeholder data)
    const placeholderValues = [
      "lorem ipsum", "john doe", "jane doe",
      "example.com", "test@", "foo", "bar",
      "sample", "placeholder", "dummy",
    ];
    let placeholderHits = 0;
    for (const ph of placeholderValues) {
      const regex = new RegExp(ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi");
      const matches = text.match(regex);
      if (matches) placeholderHits += matches.length;
    }
    if (placeholderHits >= 5) {
      aiScore += 20;
      reasons.push(`Multiple placeholder values detected (${placeholderHits} matches)`);
    }

    // Check for perfectly sequential IDs
    const idMatches = text.match(/"id"\s*:\s*(\d+)/g);
    if (idMatches && idMatches.length > 10) {
      const ids = idMatches.map((m) => parseInt(m.replace(/\D/g, "")));
      const isSequential = ids.every((v, i) => i === 0 || v === ids[i - 1] + 1);
      if (isSequential) {
        aiScore += 15;
        reasons.push("Perfectly sequential IDs suggest generated/synthetic data");
      }
    }
  }

  // ── XML-specific checks ──
  if (docType === "xml") {
    // Check for generator/tool comments
    const xmlGenMarkers = [
      "generated by", "auto-generated",
      "chatgpt", "openai", "gpt",
      "synthetic", "mock data",
      "faker", "mockaroo",
    ];
    for (const marker of xmlGenMarkers) {
      if (text.includes(marker)) {
        aiScore += 30;
        reasons.push(`Generator marker found in XML: "${marker}"`);
        break;
      }
    }

    // Check for placeholder/dummy content
    const xmlPlaceholders = [
      "lorem ipsum", "john doe", "jane doe",
      "example.com", "foo", "bar",
      "sample data", "placeholder", "dummy",
    ];
    let xmlPlaceholderHits = 0;
    for (const ph of xmlPlaceholders) {
      if (text.includes(ph)) xmlPlaceholderHits++;
    }
    if (xmlPlaceholderHits >= 3) {
      aiScore += 20;
      reasons.push(`Multiple placeholder patterns in XML content (${xmlPlaceholderHits} types)`);
    }

    // Check for processing instructions that mention generators
    const piMatch = text.match(/<\?[\s\S]{0,200}\?>/g);
    if (piMatch) {
      for (const pi of piMatch) {
        if (pi.includes("generated") || pi.includes("synthetic") || pi.includes("gpt")) {
          aiScore += 25;
          reasons.push("XML processing instruction references AI/generation tool");
          break;
        }
      }
    }
  }

  // ── File name patterns (shared across doc types) ──
  const lowerName = fileName.toLowerCase();
  const aiDocNamePatterns = [
    /^(output|generated|result|data|synthetic|fake|mock|dummy|sample)[-_]?\d*\./,
    /\b(chatgpt|gpt|ai[-_]?gen|synthetic|faker|mockaroo)\b/,
    /^\d{8,}_\d+\./,
    /^[0-9a-f]{8,}\./,
  ];
  for (const pattern of aiDocNamePatterns) {
    if (pattern.test(lowerName)) {
      aiScore += 10;
      reasons.push("File name matches common AI/synthetic data output naming pattern");
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
      const supportedTypes = ["image", "video", "audio", "document"];
      const docExtensions = [".pdf", ".csv", ".json", ".xml"];
      const isDocByExtension = docExtensions.some((ext) =>
        file.file_name.toLowerCase().endsWith(ext)
      );
      const effectiveType = isDocByExtension ? "document" : file.file_type;

      if (!supportedTypes.includes(effectiveType)) {
        results.push({
          id: file.id,
          file_name: file.file_name,
          is_ai_generated: false,
          confidence: 0,
          reasons: ["File type not applicable for AI check"],
        });
        continue;
      }

      try {
        // Fetch appropriate byte range depending on file type
        const fetchSize = effectiveType === "image" ? 65535
          : effectiveType === "document" ? 262144
          : 131072;
        const res = await fetch(file.file_url, {
          headers: { Range: `bytes=0-${fetchSize}` },
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

        let analysis: { is_ai_generated: boolean; confidence: number; reasons: string[] };

        switch (effectiveType) {
          case "video":
            analysis = analyzeVideoBytes(buffer, file.file_name, file.file_size);
            break;
          case "audio":
            analysis = analyzeAudioBytes(buffer, file.file_name, file.file_size);
            break;
          case "document":
            analysis = analyzeDocumentBytes(buffer, file.file_name, file.file_size, file.mime_type);
            break;
          default:
            analysis = analyzeImageBytes(buffer, file.file_name, file.file_size);
        }

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
