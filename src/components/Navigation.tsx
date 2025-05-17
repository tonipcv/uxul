/* eslint-disable */
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserCircleIcon,
  MegaphoneIcon,
  ChartBarIcon,
  SparklesIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const { data: session } = useSession();

  // Lista de rotas protegidas onde a navegação deve aparecer
  const protectedRoutes = [
    '/profile',
    '/outbound',
    '/dre',
    '/ia',
    '/formulas'
  ];

  // Só mostrar navegação em rotas protegidas
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
  if (!isProtectedRoute) {
    return null;
  }

  const navSections: NavSection[] = [
    {
      title: "Dashboard",
      items: [
        {
          href: '/outbound',
          label: 'Outbound',
          icon: MegaphoneIcon,
          description: 'Prospecção ativa'
        },
        {
          href: '/dre',
          label: 'DRE',
          icon: ChartBarIcon,
          description: 'Demonstrativo de Resultados'
        },
        {
          href: '/ia',
          label: 'Assistente IA',
          icon: SparklesIcon,
          description: 'Análise financeira inteligente'
        },
        {
          href: '/formulas',
          label: 'Fórmulas',
          icon: CalculatorIcon,
          description: 'Fórmulas básicas do P&L'
        },
      ]
    }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-16 transition-all duration-300 border-r border-gray-200/50 bg-gradient-to-b from-gray-100 to-gray-200/80 shadow-[1px_0_5px_rgba(0,0,0,0.05)] hidden lg:block z-40">
        <div className="flex flex-col h-full">
          <div className="h-14 flex items-center justify-center border-b border-gray-200/50 bg-white/10">
            <Link href="/" className="flex items-center justify-center">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="MED1 Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-6">
              {navSections.map((section) => (
                <div key={section.title} className="px-2">
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <TooltipProvider key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={item.href}>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "w-full h-12 flex items-center justify-center transition-all duration-200 rounded-lg group",
                                  pathname === item.href 
                                    ? "bg-white/90 text-[#2d5568] shadow-sm" 
                                    : "text-[#2d5568] hover:bg-white/20"
                                )}
                              >
                                <item.icon className={cn(
                                  "h-5 w-5 stroke-[1.5] flex-shrink-0 transition-colors duration-200",
                                  pathname === item.href ? "text-[#2d5568]" : "text-[#2d5568]/80"
                                )} />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                            <p className="text-xs text-gray-500">{item.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>
          <Separator />
          <div className="p-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full h-12 flex items-center justify-center">
                      <Avatar className="h-8 w-8 ring-1 ring-white/20 bg-white/80">
                        {session?.user?.image ? (
                          <AvatarImage src={session.user.image} alt={session.user.name || "Profile"} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-white">
                            <UserCircleIcon className="h-5 w-5 text-[#2d5568]" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Perfil</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b border-gray-200/50 bg-gradient-to-b from-gray-100 to-gray-200/80 shadow-[0_1px_5px_rgba(0,0,0,0.05)] z-40 lg:hidden">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="w-8">
            {/* Espaço vazio para manter o layout centralizado */}
          </div>
          <Link href="/" className="flex items-center justify-center">
            <div className="relative w-20 h-7">
              <Image
                src="/logo.png"
                alt="MED1 Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <Link href="/profile">
            <Avatar className="h-8 w-8 ring-1 ring-white/20 bg-white/80">
              {session?.user?.image ? (
                <AvatarImage src={session.user.image} alt={session.user.name || "Profile"} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-white">
                  <UserCircleIcon className="h-5 w-5 text-[#2d5568]" />
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200/50 bg-gradient-to-t from-gray-100 to-gray-200/80 shadow-[0_-1px_5px_rgba(0,0,0,0.05)] z-50 lg:hidden">
        <div className="py-1.5 px-2">
          <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
            {navSections.flatMap(section => section.items).map((item) => (
              <Link key={item.href} href={item.href} className="flex-1">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-10 flex items-center justify-center transition-colors rounded-lg",
                    pathname === item.href 
                      ? "bg-white/90 text-[#2d5568] shadow-sm" 
                      : "text-[#2d5568] hover:bg-white/20"
                  )}
                >
                  <item.icon className={cn(
                    "h-[18px] w-[18px] stroke-[1.5]",
                    pathname === item.href ? "text-[#2d5568]" : "text-[#2d5568]/80"
                  )} />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Desktop Spacer */}
      <div className="hidden lg:block w-16 flex-shrink-0" />
    </>
  );
} 