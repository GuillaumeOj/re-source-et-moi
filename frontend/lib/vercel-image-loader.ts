import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader for Vercel builds (wired in next.config.ts). Under vercel.json
 * `services`, `/_next/image` is not routed, so this sends images to Vercel's own
 * optimizer at `/_vercel/image` instead.
 */
export default function vercelImageLoader({ src, width, quality }: ImageLoaderProps): string {
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
