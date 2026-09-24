import Image from 'next/image';
import { getMascot } from '@/lib/mascots';

type MascotAvatarProps = {
  readonly avatar: string;
  readonly alt?: string;
  readonly className?: string;
  readonly imageClassName?: string;
  readonly priority?: boolean;
  readonly sizes?: string;
};

export function MascotAvatar({
  avatar,
  alt = '',
  className = '',
  imageClassName = '',
  priority = false,
  sizes = '(max-width: 640px) 96px, 128px',
}: MascotAvatarProps) {
  const mascot = getMascot(avatar);

  if (!mascot) {
    return <span aria-hidden={alt ? undefined : true} aria-label={alt || undefined} className={className}>{avatar || '🌟'}</span>;
  }

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>
      <Image
        src={mascot.image}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-contain drop-shadow-sm ${imageClassName}`}
      />
    </span>
  );
}
