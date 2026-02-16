import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/auth/context/AuthContext';
import { DialogProvider } from '@/ui/context/DialogContext';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sudoku.uk').replace(/\/$/, '');
const AUTHOR_NAME = 'Dylan Almond';
const AUTHOR_URL = 'https://dylanalmond.net';
const AUTHOR_EMAIL = 'dylan@dylanalmond.net';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${AUTHOR_URL}#person`,
      name: AUTHOR_NAME,
      url: AUTHOR_URL,
      email: AUTHOR_EMAIL,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      url: SITE_URL,
      name: 'Sudoki',
      author: {
        '@id': `${AUTHOR_URL}#person`,
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Sudoki',
    template: '%s | Sudoki',
  },
  description:
    'Play daily Sudoku challenges, track your stats, and compete on the Sudoki leaderboard.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Sudoki',
    title: 'Sudoki',
    description:
      'Play daily Sudoku challenges, track your stats, and compete on the Sudoki leaderboard.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Sudoki - Daily Sudoku and leaderboard competition',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sudoki',
    description:
      'Play daily Sudoku challenges, track your stats, and compete on the Sudoki leaderboard.',
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  authors: [
    {
      name: AUTHOR_NAME,
      url: AUTHOR_URL,
    },
  ],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  other: {
    'author:email': AUTHOR_EMAIL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <AuthProvider>
          <DialogProvider>{children}</DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
