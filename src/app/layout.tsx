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
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <RoleProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </RoleProvider>
      </body>
    </html>
  );
}
