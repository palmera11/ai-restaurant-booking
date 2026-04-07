"use client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-n-200)", borderTopColor: "var(--color-n-800)" }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-n-50)" }}>
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
