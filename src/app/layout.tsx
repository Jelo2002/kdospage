import type { Metadata } from 'next';
import './globals.css';
import { RoleProvider } from '@/components/RoleContext';
import AppWrapper from './AppWrapper';

export const metadata: Metadata = {
  title: 'KDOS Operations — Candidate Management & Workforce System',
  description: 'Enterprise Applicant Tracking & Staff Management System for Minecraft SMP',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-zinc-800 selection:text-zinc-100">
        <RoleProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </RoleProvider>
      </body>
    </html>
  );
}
