import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'NoticeLens — Clarity, backed by evidence',description:'An evidence-first navigator for Texas tenant notices.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
