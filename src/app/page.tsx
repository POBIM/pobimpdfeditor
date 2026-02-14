import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--surface)] text-[var(--text-primary)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-center shadow-xl">
        <h1 className="text-2xl font-semibold">POBIM PDF Editor</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Select your language to continue.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/th"
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
          >
            Thai
          </Link>
          <Link
            href="/en"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium"
          >
            English
          </Link>
        </div>
      </div>
    </main>
  );
}
