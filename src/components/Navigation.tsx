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
    '/profile'
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
        }
      ]
    }
  ];

  const NavButton = ({ item, className }: { item: typeof navSections[0]['items'][0], className?: string }) => (
    <Button
      variant="outline"
      className={cn(
        "w-full h-14 flex items-center justify-center bg-transparent transition-colors border-transparent",
        pathname === item.href 
          ? "bg-blue-600/30 text-blue-100 border-blue-500/30 hover:bg-blue-600/40" 
          : "text-blue-200/70 hover:text-blue-100 hover:bg-blue-600/20",
        className
      )}
    >
      <item.icon className="h-5 w-5 stroke-current" />
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
      <nav className="fixed left-0 top-0 bottom-0 w-20 border-r border-blue-500/20 bg-blue-900/30 backdrop-blur-sm shadow-md hidden lg:block z-40">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-blue-500/20">
            <Link href="/" className="flex items-center justify-center">
              <span className="text-sm font-medium text-blue-200 tracking-wide">MED1</span>
            </Link>
          </div>
          <div className="flex-1 py-6">
            <nav className="space-y-6 px-2">
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
          <div className="p-6 border-t border-blue-500/20">
            <Link href="/profile">
              <div className="w-10 h-10 flex items-center justify-center cursor-pointer border border-blue-400/30 rounded-full hover:border-blue-400/50 hover:bg-blue-600/20 transition-colors mx-auto">
                <UserAvatar />
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 border-b border-blue-500/20 bg-blue-900/30 backdrop-blur-sm shadow-md z-40">
          <div className="py-4 px-4 flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <span className="text-sm font-medium text-blue-200 tracking-wide">MED1</span>
            </Link>
            <Link href="/profile">
              <div className="h-7 w-7 flex items-center justify-center cursor-pointer border border-blue-400/30 rounded-full hover:border-blue-400/50 hover:bg-blue-600/20 transition-colors">
                <UserAvatar />
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-blue-500/20 bg-blue-900/30 backdrop-blur-sm shadow-md z-40">
          <div className="py-3 px-4">
            <div className="flex items-center justify-around gap-2">
              {navSections.flatMap(section => section.items).map((item) => (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-14 flex items-center justify-center bg-transparent transition-colors border-transparent",
                      pathname === item.href 
                        ? "bg-blue-600/30 text-blue-100 border-blue-500/30 hover:bg-blue-600/40" 
                        : "text-blue-200/70 hover:text-blue-100 hover:bg-blue-600/20"
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