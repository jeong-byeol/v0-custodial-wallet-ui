import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import Provider from '@/lib/provider'
import { cookieToWeb3AuthState } from "@web3auth/modal";
import { headers } from "next/headers";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers();
  const web3authInitialState = cookieToWeb3AuthState(headersList.get('cookie'));
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Provider web3authInitialState={web3authInitialState}>
          {children}
        </Provider>
        <Analytics />
      </body>
    </html>
  )
}
