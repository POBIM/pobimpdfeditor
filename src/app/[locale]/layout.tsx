import type { Metadata, Viewport } from 'next';
import { DM_Sans, JetBrains_Mono, Noto_Sans_Thai, Sarabun } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import PwaRegister from '@/components/pwa/PwaRegister';
import { PdfProvider } from '@/store/PdfContext';
import { EditorProvider } from '@/store/EditorContext';
import { CanvasProvider } from '@/store/CanvasContext';
import { FormProvider } from '@/store/FormContext';
import { ExportProvider } from '@/store/ExportContext';
import { ThemeProvider } from '@/store/ThemeContext';
import { routing } from '@/i18n/routing';
import '../globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
});

const notoSansThai = Noto_Sans_Thai({
  variable: '--font-noto-thai',
  subsets: ['thai'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const sarabun = Sarabun({
  variable: '--font-sarabun',
  subsets: ['thai', 'latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const withBasePath = (pathname: string): string => `${basePath}${pathname}`;

export const metadata: Metadata = {
  title: 'POBIM PDF Editor',
  description: 'Professional PDF editing in your browser',
  applicationName: 'POBIM PDF Editor',
  manifest: withBasePath('/manifest.webmanifest'),
  icons: {
    icon: withBasePath('/icons/icon-maskable-512.png'),
    shortcut: withBasePath('/icons/icon-maskable-512.png'),
    apple: withBasePath('/icons/apple-touch-icon.png'),
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'POBIM PDF Editor',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1e23',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full" data-theme="base">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} ${notoSansThai.variable} ${sarabun.variable} font-[family-name:var(--font-dm-sans)] antialiased h-full`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <PdfProvider>
              <EditorProvider>
                <CanvasProvider>
                  <FormProvider>
                    <ExportProvider>{children}</ExportProvider>
                  </FormProvider>
                </CanvasProvider>
              </EditorProvider>
            </PdfProvider>
          </ThemeProvider>
          <PwaRegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
