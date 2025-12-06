import { Outlet, NavLink } from 'react-router-dom';
import {
  Home,
  ScanLine,
  PackagePlus,
  History,
  Package,
  PlusCircle,
  BarChart3,
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
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
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
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
