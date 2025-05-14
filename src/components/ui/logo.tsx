import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function Logo({ className, variant = 'dark' }: LogoProps) {
  return (
    <div className={`relative w-32 h-10 ${className || ''}`}>
      <Image
        src="/logo.png"
        alt="MED1 Logo"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
} 