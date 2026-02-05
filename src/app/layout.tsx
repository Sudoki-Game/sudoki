import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/auth/context/AuthContext';
import { DialogProvider } from '@/ui/context/DialogContext';

export const metadata: Metadata = {
  title: 'Sudoki! - Alpha',
  description: 'The online fun Sudoku game.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>
        <AuthProvider>
          <DialogProvider>{children}</DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
