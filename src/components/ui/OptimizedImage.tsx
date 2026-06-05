import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g. '4/3', '1/1', '16/9'
  containerClassName?: string;
}

/**
 * OptimizedImage — Reusable image component with lazy loading, object-fit,
 * and aspect-ratio containers to prevent layout shift (CLS).
 *
 * NOTE: Firestore Storage URLs already serve WebP when requested with proper
 * Accept headers — no explicit WebP conversion needed here.
 */
export function OptimizedImage({
  src,
  alt,
  className,
  aspectRatio = "4/3",
  containerClassName,
}: OptimizedImageProps) {
  return (
    <div
      className={cn("overflow-hidden", containerClassName)}
      style={{ aspectRatio }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn("h-full w-full object-cover object-center", className)}
      />
    </div>
  );
}
