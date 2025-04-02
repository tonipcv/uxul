interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`relative group ${className || ''}`}>
      <span className="text-2xl font-light tracking-widest text-white">MED1</span>
      <div className="absolute inset-0 bg-gradient-to-r from-turquoise/0 via-turquoise/10 to-turquoise/0 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />
    </div>
  );
} 