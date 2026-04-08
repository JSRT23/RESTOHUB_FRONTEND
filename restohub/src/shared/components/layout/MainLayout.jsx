// src/shared/components/layout/MainLayout.jsx
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 font-dm">
      <Navbar />
      {/* pt-16 para compensar el navbar fijo */}
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
