'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/en');
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--surface)] text-[var(--text-primary)]">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-4 text-center">
        <p className="text-sm text-[var(--text-secondary)]">Redirecting to English...</p>
        <Link href="/en" className="mt-3 inline-block text-sm font-medium text-[var(--brand)]">
          Continue to English
        </Link>
      </div>
    </main>
  );
}
