'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import { 
  CalendarIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Navigation() {
  const pathname = usePathname();

  // Não mostrar navegação em páginas de autenticação
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  const navSections: NavSection[] = [
    {
      title: "Planejamento",
      items: [
        { 
          href: '/checklist', 
          label: 'Checklist', 
          icon: CheckCircleIcon,
          description: 'Checklist mensal de hábitos'
        },
        { 
          href: '/oneweek', 
          label: '12 Semanas', 
          icon: CalendarIcon,
          description: 'Planejamento trimestral'
        },
        { 
          href: '/circles', 
          label: 'Círculos', 
          icon: CircleStackIcon,
          description: 'Progresso em círculos'
        },
      ]
    }
  ];

  const NavButton = ({ item, className }: { item: typeof navSections[0]['items'][0], className?: string }) => (
    <Button
      variant="outline"
      className={cn(
        "w-full h-14 flex items-center justify-center bg-transparent",
        pathname === item.href 
          ? "border-white/20 text-white hover:bg-white/5" 
          : "border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/5",
        className
      )}
    >
      <item.icon className="h-5 w-5" />
    </Button>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 border-r border-white/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 hidden lg:block z-40">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <Link href="/" className="flex items-center justify-center">
              <span className="text-sm font-normal text-white tracking-wide">BOOP</span>
            </Link>
          </div>
          <div className="flex-1 py-6">
            <nav className="space-y-6 px-2">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  {section.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <NavButton item={item} />
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
          <div className="p-6 border-t border-white/10">
            <Button
              variant="outline"
              className="w-full h-14 flex items-center justify-center bg-transparent border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/5"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 border-b border-white/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-40">
          <div className="py-4 px-4 flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <span className="text-sm font-normal text-white tracking-wide">BOOP</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/70"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-40">
          <div className="py-3 px-4">
            <div className="flex items-center justify-around gap-2">
              {navSections.flatMap(section => section.items).map((item) => (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full flex-col h-14 gap-1 px-0 bg-transparent",
                      pathname === item.href 
                        ? "border-white/20 text-white hover:bg-white/5" 
                        : "border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px]">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
} 