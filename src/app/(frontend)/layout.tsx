import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/MobileBottomNav";

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* pb-16 to avoid content hiding behind bottom nav */}
      <main className="flex-1 pb-16">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
