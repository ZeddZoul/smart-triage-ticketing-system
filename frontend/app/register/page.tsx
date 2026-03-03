'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RegisterForm } from '@/components/register-form';

export default function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <RegisterForm />
    </div>
  );
}
