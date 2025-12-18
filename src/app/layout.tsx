import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import { ModalRouterProvider } from '@/context/ModalRouterContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Sudoki! - Alpha',
  description: 'The online fun Sudoku game.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>
        <AuthProvider>
          <ModalRouterProvider>
            <Header />
            <main>
              {children}
            </main>

            <a
              className='copyright'
              href='https://dylanalmond.net'
              target='_blank'
              rel='noopener noreferrer'
            >
              @{new Date().getFullYear()} Dylan Almond
            </a>
          </ModalRouterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
