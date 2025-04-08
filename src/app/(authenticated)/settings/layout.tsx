'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PuzzlePieceIcon, BookmarkIcon } from "@heroicons/react/24/outline";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">{children}</div>
  );
} 