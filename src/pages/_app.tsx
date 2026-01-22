import type { AppProps } from 'next/app';
import '../globals.css';
import { MainNav } from '../components/layout/MainNav';
import { useRouter } from 'next/router';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideNav = router.pathname === '/login';
  return (
    <>
      {!hideNav && <MainNav />}
      <Component {...pageProps} />
    </>
  );
}
