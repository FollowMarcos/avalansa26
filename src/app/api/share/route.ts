import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

/**
 * Allowed domains for image fetching (SSRF protection)
 */
const ALLOWED_IMAGE_DOMAINS = [
  // Supabase storage
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', ''),
  // Add other trusted CDN domains as needed
  'replicate.delivery',
  'pbxt.replicate.delivery',
].filter(Boolean) as string[];

/**
 * Validate that the image URL is from a trusted domain
 */
function isAllowedImageUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ALLOWED_IMAGE_DOMAINS.some(domain =>
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * API route for generating watermarked/platform-optimized images for sharing
 *
 * Query params:
 * - image: URL of the source image
 * - watermark: boolean - whether to add AVALANSA.COM watermark
 * - platform: optional - 'twitter' | 'instagram' | 'pinterest' for platform-specific sizing
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('image');
  const addWatermark = searchParams.get('watermark') === 'true';
  const platform = searchParams.get('platform');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  // SSRF protection: validate URL is from allowed domains
  if (!isAllowedImageUrl(imageUrl)) {
    return NextResponse.json(
      { error: 'Image URL not from allowed domain' },
      { status: 403 }
    );
  }

  try {
    // Fetch the original image (validated against allowlist)
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    let processedImage = sharp(imageBuffer);

    // Get image metadata for dimension calculations
    const metadata = await processedImage.metadata();
    const originalWidth = metadata.width || 1024;
    const originalHeight = metadata.height || 1024;

    // Platform-specific resizing
    if (platform === 'twitter') {
      // Twitter card optimal: 1200x675 (16:9)
      processedImage = processedImage.resize(1200, 675, {
        fit: 'cover',
        position: 'center',
      });
    } else if (platform === 'instagram') {
      // Instagram square: 1080x1080
      processedImage = processedImage.resize(1080, 1080, {
        fit: 'cover',
        position: 'center',
      });
    } else if (platform === 'pinterest') {
      // Pinterest optimal: 1000x1500 (2:3)
      processedImage = processedImage.resize(1000, 1500, {
        fit: 'cover',
        position: 'center',
      });
    }

    // Add watermark if requested
    if (addWatermark) {
      // Get current dimensions after potential resize
      const currentMetadata = await processedImage.toBuffer().then(buf =>
        sharp(buf).metadata()
      );
      const width = currentMetadata.width || originalWidth;
      const height = currentMetadata.height || originalHeight;

      // Create text watermark using SVG
      const watermarkText = 'AVALANSA.COM';
      const fontSize = Math.max(16, Math.round(width * 0.03)); // 3% of image width, min 16px
      const padding = Math.round(fontSize * 0.8);

      // Calculate watermark dimensions
      const textWidth = watermarkText.length * fontSize * 0.6; // Approximate text width
      const watermarkWidth = textWidth + padding * 2;
      const watermarkHeight = fontSize + padding * 2;

      // Create SVG watermark with semi-transparent background
      const watermarkSvg = `
        <svg width="${watermarkWidth}" height="${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="0" y="0"
            width="${watermarkWidth}" height="${watermarkHeight}"
            rx="${fontSize * 0.3}"
            fill="rgba(0, 0, 0, 0.5)"
          />
          <text
            x="${padding}"
            y="${padding + fontSize * 0.8}"
            font-family="Arial, sans-serif"
            font-size="${fontSize}"
            font-weight="600"
            fill="rgba(255, 255, 255, 0.9)"
          >${watermarkText}</text>
        </svg>
      `;

      const watermarkBuffer = Buffer.from(watermarkSvg);

      // Position watermark at bottom-right corner
      const xOffset = width - watermarkWidth - padding;
      const yOffset = height - watermarkHeight - padding;

      // Get the current buffer to composite
      const currentBuffer = await processedImage.toBuffer();
      processedImage = sharp(currentBuffer).composite([
        {
          input: watermarkBuffer,
          top: yOffset,
          left: xOffset,
        },
      ]);
    }

    // Output as JPEG with good quality
    const outputBuffer = await processedImage
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Disposition': `inline; filename="shared-image.jpg"`,
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
