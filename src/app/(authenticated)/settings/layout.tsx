'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PuzzlePieceIcon, ShieldCheckIcon, UserCircleIcon, SwatchIcon, BookmarkIcon } from "@heroicons/react/24/outline";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900">
      <div className="hidden md:flex md:w-64 md:flex-col p-4">
        <div className="flex flex-col flex-grow pt-5 rounded-lg backdrop-blur-sm bg-blue-950/40 overflow-y-auto">
          <div className="flex-1 overflow-auto p-0">
            <nav className="grid items-start px-4 text-sm font-medium relative">
              <Link
                href="/settings/profile"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  pathname === '/settings/profile'
                    ? 'text-white bg-blue-600/20 border border-blue-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-blue-900/10'
                } transition-all`}
              >
                <UserCircleIcon className="h-4 w-4" />
                Perfil
              </Link>
              <Link
                href="/settings/page-template"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  pathname === '/settings/page-template'
                    ? 'text-white bg-blue-600/20 border border-blue-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-blue-900/10'
                } transition-all`}
              >
                <SwatchIcon className="h-4 w-4" />
                Template
              </Link>
              <Link
                href="/settings/interest-options"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  pathname === '/settings/interest-options'
                    ? 'text-white bg-blue-600/20 border border-blue-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-blue-900/10'
                } transition-all`}
              >
                <BookmarkIcon className="h-4 w-4" />
                Opções de Interesse
              </Link>
              <Link
                href="/settings/security"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  pathname === '/settings/security'
                    ? 'text-white bg-blue-600/20 border border-blue-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-blue-900/10'
                } transition-all`}
              >
                <ShieldCheckIcon className="h-4 w-4" />
                Segurança
              </Link>
              <Link
                href="/settings/integrations"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  pathname === '/settings/integrations'
                    ? 'text-white bg-blue-600/20 border border-blue-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-blue-900/10'
                } transition-all`}
              >
                <PuzzlePieceIcon className="h-4 w-4" />
                Integrações
              </Link>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
} 