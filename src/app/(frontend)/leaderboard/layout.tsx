import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard Top 10 Pembelian | Raja Digital",
  description: "Lihat 10 pembeli terbanyak di Raja Digital. Leaderboard diperbarui otomatis setiap 10 menit.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
