import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Travel2Egypt',
  description: 'Egypt travel, with judgment. An Egyptian operator since 1995.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
