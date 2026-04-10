// src/shared/components/layout/MainLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MainLayout() {
  return (
    <div
      className="flex flex-col min-h-screen font-dm"
      style={{ background: "#e8e8e6" }}
    >
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
