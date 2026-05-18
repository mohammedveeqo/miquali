'use client';

/**
 * LayoutShell — Client component that conditionally renders the sidebar.
 * The sidebar only appears on /topics/* routes.
 * The homepage (/) and other pages render standalone without navigation chrome.
 */

import { usePathname } from 'next/navigation';

import { Sidebar } from '@/components/layout/Sidebar';

interface LayoutShellProps {
  children: React.ReactNode;
}

/**
 * LayoutShell — Wraps the app content with conditional sidebar.
 * Shows sidebar + offset main content on topic pages.
 * Shows full-width content on all other pages.
 */
export function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const showSidebar = pathname.startsWith('/topics');

  if (showSidebar) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main
          id="main-content"
          className="flex-1 md:ml-[250px] min-h-screen"
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <main id="main-content" className="min-h-screen">
      {children}
    </main>
  );
}
