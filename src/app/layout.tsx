'use client';

import { Outfit } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ReduxProvider from '../components/Provider';
import { useAppSelector } from '@/hooks/useTypedHooks';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const outfit = Outfit({ subsets: ['latin'] });

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAppSelector((state) => state.user);
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  const publicRoutes = ['/signin', '/signup'];

  useEffect(() => {
    const validate = async () => {
      if (!token && !publicRoutes.includes(pathname)) {
        router.replace('/signin');
      } else {
        setCheckingAuth(false);
      }
    };

    validate();
  }, [token, pathname, router]);

  if (checkingAuth && !publicRoutes.includes(pathname)) {
    return null; // 🛑 Don't render anything while checking auth
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <ReduxProvider>
            <SidebarProvider>
              <AuthGuard>{children}</AuthGuard>
            </SidebarProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
