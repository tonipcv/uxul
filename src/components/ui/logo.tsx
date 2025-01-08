interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={className}>
      <span className="text-2xl font-thin tracking-wider text-white">BOOP</span>
    </div>
  );
} 