import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home,
  ScanLine,
  PackagePlus,
  History,
  Package,
  PlusCircle,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  // Intro (blue)
  { to: '/', icon: Home, label: 'Intro', color: 'blue' },
  // Transaction (green)
  { to: '/scan/out', icon: ScanLine, label: 'Customer Beli', color: 'green' },
  { to: '/scan/in', icon: PackagePlus, label: 'Beli ke Vendor', color: 'green' },
  // Product management (yellow)
  { to: '/add-product', icon: PlusCircle, label: 'Tambah Produk', color: 'yellow' },
  { to: '/products', icon: Package, label: 'Produk Terdaftar', color: 'yellow' },
  // History & stats (orange)
  { to: '/history', icon: History, label: 'Riwayat', color: 'orange' },
  { to: '/statistik', icon: BarChart3, label: 'Statistik', color: 'orange' },
];

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 backdrop-blur-sm bg-white/30 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white shadow-lg flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg text-gray-800">Dream Higher</h1>
              <p className="text-xs text-gray-500">Warung Tracker</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const colorClasses = {
                blue: { base: 'bg-blue-50 text-blue-600', active: 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' },
                green: { base: 'bg-green-50 text-green-600', active: 'bg-green-100 text-green-700 ring-2 ring-green-300' },
                yellow: { base: 'bg-yellow-50 text-yellow-600', active: 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' },
                orange: { base: 'bg-orange-50 text-orange-600', active: 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' },
              };
              const colors = colorClasses[item.color] || colorClasses.blue;

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${colors.base} ${
                        isActive ? `${colors.active} font-medium` : 'hover:opacity-80'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t text-center">
          <p className="text-xs text-gray-400">
            Powered by Kolosal AI
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full lg:p-0 pt-16 lg:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
