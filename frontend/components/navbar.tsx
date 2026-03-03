'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { agent, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Smart Triage
        </Link>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">{agent?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
