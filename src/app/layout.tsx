import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'KRA Dashboard',
  description: 'Manage and track Key Result Areas for your team.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
              <div className="flex flex-col">
                 <Navbar />
                 <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-4 md:gap-8">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
