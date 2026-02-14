import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { PdfProvider } from '@/store/PdfContext';
import { EditorProvider } from '@/store/EditorContext';
import { CanvasProvider } from '@/store/CanvasContext';
import { FormProvider } from '@/store/FormContext';
import { ExportProvider } from '@/store/ExportContext';
import { ThemeProvider } from '@/store/ThemeContext';
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

export const metadata: Metadata = {
  title: 'POBIM PDF Editor',
  description: 'Professional PDF editing in your browser',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full" data-theme="base">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-[family-name:var(--font-dm-sans)] antialiased h-full`}
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
