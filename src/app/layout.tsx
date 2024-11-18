import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Providers } from './providers';
import getCurrentUser from './actions/getCurrentUser';
import Script from 'next/script';
import ToastProvider from '@/components/ToastProvider';

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();
  return (
    <html lang='en'>
      <body className={inter.className}>
        <Providers>
          <Navbar currentUser={currentUser} />
          <ToastProvider />
          {children}
          <Script
            type='text/javascript'
            src='//dapi.kakao.com/v2/maps/sdk.js?appkey=9268d3bcf6b80dc4ae2dd0de7e26caab&libraries=services,clusterer&autoload=false'
          />
        </Providers>
      </body>
    </html>
  );
}
