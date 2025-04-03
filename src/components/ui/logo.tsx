interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function Logo({ className, variant = 'dark' }: LogoProps) {
  return (
    <div className={`relative group ${className || ''}`}>
      <span className={`text-2xl font-light tracking-widest ${variant === 'light' ? 'text-white' : 'text-blue-700'}`}>MED1</span>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />
    </div>
  );
} 