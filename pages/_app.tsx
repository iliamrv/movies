import { Roboto_Mono } from "next/font/google";
import Layout from "../components/Layout";
const roboto = Roboto_Mono({ subsets: ["latin"] });

import "/styles/globals.css";
import type { AppProps } from "next/app";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <style jsx global>{`
        html {
          font-family: ${roboto.style.fontFamily};
        }
      `}</style>

      <Component {...pageProps} />
    </Layout>
  );
}
