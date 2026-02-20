import type { AppProps } from 'next/app';
import '../globals.css';

import { MainNav } from '../components/layout/MainNav';
import { useRouter } from 'next/router';
import { MeProvider } from '../context/MeContext';
import { Toaster } from '../components/ui/toaster';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideNav = router.pathname === '/' || router.pathname === '/login' || router.pathname === '/register';


  if (hideNav) {
    return (
      <MeProvider>
        <Component {...pageProps} />
        <Toaster />
      </MeProvider>
    );
  }

  return (
    <MeProvider>
      <MainNav>
        <Component {...pageProps} />
      </MainNav>
      <Toaster />
    </MeProvider>
  );
}
