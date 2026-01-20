import type { AppProps } from 'next/app';
import '../globals.css';
import { MainNav } from '../components/layout/MainNav';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <MainNav />
      <Component {...pageProps} />
    </>
  );
}
