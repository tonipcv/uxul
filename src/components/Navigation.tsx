/* eslint-disable */
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircleIcon,
  UserCircleIcon,
  CheckIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ChartBarIcon,
  LinkIcon,
  UsersIcon,
  Cog6ToothIcon,
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
    '/agenda',
    '/profile',
    '/settings'
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
          href: '/dashboard/indications',
          label: 'Indicações',
          icon: LinkIcon,
          description: 'Gerenciar links'
        },
        {
          href: '/dashboard/leads',
          label: 'Leads',
          icon: UsersIcon,
          description: 'Lista de contatos'
        },
        {
          href: '/dashboard/pipeline',
          label: 'Pipeline',
          icon: CalendarDaysIcon,
          description: 'Gestão de status'
        },
        {
          href: '/agenda',
          label: 'Agenda',
          icon: CalendarDaysIcon,
          description: 'Google Calendar'
        }
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
        "w-full h-10 flex items-center justify-start px-3 bg-transparent transition-colors border-transparent gap-2 rounded-xl",
        pathname === item.href 
          ? "bg-blue-700 text-blue-100 border-blue-600 hover:bg-blue-600" 
          : "text-blue-200 hover:text-blue-100 hover:bg-blue-800",
        className
      )}
    >
      <item.icon className="h-4 w-4 stroke-current flex-shrink-0" />
      <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
    </Button>
  );

  const UserAvatar = () => (
    session?.user?.image ? (
      <div className="relative w-full h-full rounded-full overflow-hidden">
        <Image
          src={session.user.image}
          alt="Profile"
          fill
          className="object-cover"
        />
      </div>
    ) : (
      <UserCircleIcon className="h-4 w-4 text-blue-200" />
    )
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-44 border-r border-blue-700 bg-blue-900 shadow-md hidden lg:block z-40 rounded-tr-xl rounded-br-xl">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-blue-700">
            <Link href="/" className="flex items-center justify-center">
              <span className="text-sm font-medium text-blue-100 tracking-wide">MED1</span>
            </Link>
          </div>
          <div className="flex-1 py-4">
            <nav className="space-y-4 px-2">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  {section.items.map((item) => (
                    <Link key={item.href} href={item.href} className="block">
                      <NavButton item={item} />
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t border-blue-700">
            <Link href="/profile">
              <div className="flex items-center gap-2 cursor-pointer border border-blue-600 rounded-xl px-3 py-2 hover:border-blue-500 hover:bg-blue-800 transition-colors">
                <div className="w-6 h-6 flex items-center justify-center rounded-full overflow-hidden flex-shrink-0">
                  <UserAvatar />
                </div>
                <span className="text-xs text-blue-100">Perfil</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Add a spacer for desktop to prevent content overlap */}
      <div className="hidden lg:block w-44 flex-shrink-0"></div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 border-b border-blue-700 bg-blue-900 shadow-md z-40">
          <div className="py-4 px-4 flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <span className="text-sm font-medium text-blue-100 tracking-wide">MED1</span>
            </Link>
            <Link href="/profile">
              <div className="h-8 w-8 flex items-center justify-center cursor-pointer border border-blue-600 rounded-xl hover:border-blue-500 hover:bg-blue-800 transition-colors">
                <UserAvatar />
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-blue-700 bg-blue-900 shadow-md z-50 rounded-tl-xl rounded-tr-xl">
          <div className="py-2 px-3">
            <div className="flex items-center justify-around gap-1">
              {navSections
                .filter(section => section.title !== "Configurações") // Filter out the "Configurações" section for mobile
                .flatMap(section => section.items)
                .map((item) => (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10 flex items-center justify-center bg-transparent transition-colors border-transparent rounded-xl",
                      pathname === item.href 
                        ? "bg-blue-700 text-blue-100 border-blue-600 hover:bg-blue-600" 
                        : "text-blue-200 hover:text-blue-100 hover:bg-blue-800"
                    )}
                  >
                    <item.icon className="h-5 w-5 stroke-current" />
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