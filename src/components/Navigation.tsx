/* eslint-disable */
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserCircleIcon,
  ChartBarIcon,
  LinkIcon,
  UsersIcon,
  Cog6ToothIcon,
  FunnelIcon,
  HeartIcon,
  SparklesIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";

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
    '/dashboard',
    '/dashboard/indications',
    '/dashboard/leads',
    '/dashboard/pipeline',
    '/dashboard/services',
    '/profile',
    '/settings',
    '/IA',
    '/links'
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
          href: '/dashboard',
          label: 'Dashboard',
          icon: ChartBarIcon,
          description: 'Visão geral'
        },
        {
          href: '/dashboard/services',
          label: 'Serviços',
          icon: ShoppingBagIcon,
          description: 'Gerenciar serviços'
        },
        {
          href: '/dashboard/indications',
          label: 'Indicações',
          icon: LinkIcon,
          description: 'Gerenciar links'
        },
        {
          href: '/links',
          label: 'Páginas',
          icon: LinkIcon,
          description: 'Páginas de links'
        },
        {
          href: '/dashboard/leads',
          label: 'Leads',
          icon: UsersIcon,
          description: 'Lista de contatos'
        },
        {
          href: '/dashboard/pacientes',
          label: 'Pacientes',
          icon: HeartIcon,
          description: 'Gerenciar pacientes'
        },
        {
          href: '/dashboard/pipeline',
          label: 'Pipeline',
          icon: FunnelIcon,
          description: 'Gestão de status'
        },
        {
          href: '/IA',
          label: 'Assistente IA',
          icon: SparklesIcon,
          description: 'Análise de pacientes'
        },
      ]
    },
    {
      title: "Configurações",
      items: [
        {
          href: '/settings/interest-options',
          label: 'Configurações',
          icon: Cog6ToothIcon,
          description: 'Opções do sistema'
        }
      ]
    }
  ];

  const NavButton = ({ item, className }: { item: typeof navSections[0]['items'][0], className?: string }) => (
    <Button
      variant="outline"
      className={cn(
        "w-full h-9 flex items-center px-2.5 bg-transparent transition-all duration-200 border-transparent gap-2.5 rounded-lg group",
        pathname === item.href 
          ? "bg-white/90 text-[#2d5568] shadow-sm" 
          : "text-[#2d5568] hover:bg-white/20",
        className
      )}
    >
      <item.icon className={cn(
        "h-[18px] w-[18px] stroke-[1.5] flex-shrink-0 transition-colors duration-200",
        pathname === item.href ? "text-[#2d5568]" : "text-[#2d5568]/80"
      )} />
      <span className={cn(
        "text-sm font-medium whitespace-nowrap transition-colors duration-200",
        pathname === item.href ? "text-[#2d5568]" : "text-[#2d5568]/90"
      )}>
        {item.label}
      </span>
    </Button>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-xs font-semibold text-[#2d5568]/70 uppercase tracking-wider px-3 mb-2">
      {title}
    </h3>
  );

  const UserAvatar = () => (
    session?.user?.image ? (
      <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-800">
        <Image
          src={session.user.image}
          alt={session.user.name || 'Profile'}
          fill
          sizes="100%"
          priority
          className="object-cover"
        />
      </div>
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <UserCircleIcon className="h-5 w-5 text-[#2d5568]" />
      </div>
    )
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-52 transition-all duration-300 border-r border-gray-200/50 bg-gradient-to-b from-gray-100 to-gray-200/80 shadow-[1px_0_5px_rgba(0,0,0,0.05)] hidden lg:block z-40">
        <div className="flex flex-col h-full">
          <div className="h-14 flex items-center px-4 border-b border-gray-200/50 bg-white/10">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-24 h-8">
                <Image
                  src="/logo.png"
                  alt="MED1 Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-semibold text-[#2d5568] text-lg">MED1</span>
            </Link>
          </div>
          <div className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
            <nav className="space-y-6 px-2">
              {navSections.map((section) => (
                <div key={section.title}>
                  <SectionTitle title={section.title} />
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link key={item.href} href={item.href} className="block">
                        <NavButton item={item} />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className="p-2 border-t border-gray-200/50 bg-white/10">
            <Link href="/profile">
              <div className="w-full flex items-center gap-2.5 cursor-pointer px-2.5 py-2 hover:bg-white/20 rounded-lg transition-all duration-200 group">
                <div className="w-[22px] h-[22px] flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-white/80 ring-1 ring-white/20">
                  <UserAvatar />
                </div>
                <span className="text-sm font-medium text-[#2d5568] group-hover:text-[#2d5568]/90">Perfil</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b border-gray-200/50 bg-gradient-to-b from-gray-100 to-gray-200/80 shadow-[0_1px_5px_rgba(0,0,0,0.05)] z-40 lg:hidden">
        <div className="h-full px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-20 h-7">
              <Image
                src="/logo.png"
                alt="MED1 Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-[#2d5568] text-lg">MED1</span>
          </Link>
          <Link href="/profile">
            <div className="w-8 h-8 flex items-center justify-center rounded-full overflow-hidden bg-white/80 ring-1 ring-white/20">
              <UserAvatar />
            </div>
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200/50 bg-gradient-to-t from-gray-100 to-gray-200/80 shadow-[0_-1px_5px_rgba(0,0,0,0.05)] z-50 lg:hidden">
        <div className="py-1.5 px-2">
          <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
            {navSections
              .filter(section => section.title !== "Configurações")
              .flatMap(section => section.items)
              .map((item) => (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10 flex items-center justify-center bg-transparent transition-colors border-transparent rounded-lg",
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
      <div className="hidden lg:block w-52 flex-shrink-0" />

      {/* WhatsApp Float Button */}
      <a 
        href="https://wa.me/5511976638147" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50"
      >
        <div className="relative">
          {/* Profile Image */}
          <div className="rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 w-14 h-14 lg:w-16 lg:h-16 ring-2 ring-white bg-white">
            <Image
              src="/toni.jpeg"
              alt="Contact Toni"
              width={64}
              height={64}
              className="object-cover w-full h-full hover:scale-110 transition-transform duration-300"
              priority
            />
            {/* Online Indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
          </div>
        </div>
      </a>
    </>
  );
} 