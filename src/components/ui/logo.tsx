interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function Logo({ className, variant = 'dark' }: LogoProps) {
  return (
    <div className={`relative group ${className || ''}`}>
      <span className={`text-2xl font-light tracking-widest ${variant === 'light' ? 'text-white' : 'text-black'}`}>MED1</span>
    </div>
  );
} 