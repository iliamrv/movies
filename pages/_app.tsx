import { Roboto_Mono } from "next/font/google";
import Layout from "../components/Layout";
const roboto = Roboto_Mono({ subsets: ["latin"] });
import Head from "next/head";

import "/styles/globals.css";
import type { AppProps } from "next/app";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>

      <Head>

        <link rel="icon" href="/favicon.svg" />
      </Head>

      <style jsx global>{`
        html {
          font-family: ${roboto.style.fontFamily};
        }
      `}</style>

      <Component {...pageProps} />
    </Layout>
  );
}
