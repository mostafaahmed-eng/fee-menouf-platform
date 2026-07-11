import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - FEE Menouf',
  description: 'Admin dashboard for FEE Menouf platform - manage users, courses, departments, and system settings',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
