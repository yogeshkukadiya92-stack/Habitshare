import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { Navbar } from '@/components/navbar';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { DataStoreProvider } from '@/hooks/use-data-store';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'HR Studio | Enterprise Management',
  description: 'Advanced Key Result Areas and performance tracking for elite teams.',
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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-background min-h-screen">
        <FirebaseClientProvider>
          <AuthProvider>
            <DataStoreProvider>
              <SidebarProvider>
                <Sidebar className="border-none">
                    <AppSidebar/>
                </Sidebar>
                <SidebarInset className="bg-transparent overflow-x-hidden">
                    <Navbar />
                    <main className="p-4 sm:px-8 sm:py-8">
                        <div className="max-w-7xl mx-auto">
                          {children}
                        </div>
                    </main>
                    <Toaster />
                </SidebarInset>
              </SidebarProvider>
            </DataStoreProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}