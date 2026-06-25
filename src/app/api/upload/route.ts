import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require("sharp");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const COMPRESSION_CONFIG = {
  product: { width: 1200, height: 1200, quality: 80 },
  banner: { width: 1920, height: 800, quality: 75 },
  logo: { width: 400, height: 400, quality: 85 },
  avatar: { width: 200, height: 200, quality: 80 },
  default: { width: 1600, height: 1600, quality: 80 },
};

function getImageType(fileName: string): keyof typeof COMPRESSION_CONFIG {
  const lower = fileName.toLowerCase();
  if (lower.includes("banner")) return "banner";
  if (lower.includes("logo")) return "logo";
  if (lower.includes("avatar") || lower.includes("profile")) return "avatar";
  if (lower.includes("product") || lower.includes("store")) return "product";
  return "default";
}

async function compressImage(
  inputBuffer: any,
  fileName: string,
  originalType: string
): Promise<{ buffer: any; format: string; wasCompressed: boolean }> {
  const imageType = getImageType(fileName);
  const config = COMPRESSION_CONFIG[imageType];

  const sharpInstance = sharp(inputBuffer);
  const metadata = await sharpInstance.metadata();

  let outputFormat = "webp";
  if (originalType === "image/gif") {
    outputFormat = "gif";
  } else if (originalType === "image/png" && metadata.hasAlpha) {
    outputFormat = "png";
  }

  let pipeline = sharpInstance;
  if (
    metadata.width &&
    metadata.height &&
    (metadata.width > config.width || metadata.height > config.height)
  ) {
    pipeline = pipeline.resize(config.width, config.height, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let compressedBuffer: any;
  const wasCompressed =
    metadata.width! > config.width ||
    metadata.height! > config.height ||
    inputBuffer.length > 1024 * 1024;

  switch (outputFormat) {
    case "webp":
      compressedBuffer = await pipeline.webp({ quality: config.quality, effort: 4 }).toBuffer();
      break;
    case "png":
      compressedBuffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      break;
    case "gif":
      compressedBuffer = await pipeline.toBuffer();
      break;
    default:
      compressedBuffer = await pipeline.jpeg({ quality: config.quality, progressive: true }).toBuffer();
      outputFormat = "jpeg";
  }

  if (compressedBuffer.length > inputBuffer.length && !wasCompressed) {
    return { buffer: inputBuffer, format: originalType.split("/")[1], wasCompressed: false };
  }

  return {
    buffer: compressedBuffer,
    format: outputFormat,
    wasCompressed: wasCompressed || compressedBuffer.length < inputBuffer.length,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;

    if (!file || !fileName) {
      return NextResponse.json(
        { error: "File and fileName required" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer: any = Buffer.from(bytes);
    const originalSize = buffer.length;

    const { buffer: compressedBuffer, format, wasCompressed } = await compressImage(
      buffer,
      fileName,
      file.type
    );

    buffer = compressedBuffer;

    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const newFileName = `${baseName}.${format}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: newFileName,
        Body: buffer,
        ContentType: `image/${format}`,
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${newFileName}`;

    return NextResponse.json({
      url: publicUrl,
      compressed: wasCompressed,
      originalSize: `${(originalSize / 1024).toFixed(1)}KB`,
      compressedSize: `${(buffer.length / 1024).toFixed(1)}KB`,
      saved: `${(((originalSize - buffer.length) / originalSize) * 100).toFixed(1)}%`,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}