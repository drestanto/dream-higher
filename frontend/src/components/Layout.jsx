import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  PackagePlus,
  History,
  Package,
  Store
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scan/out', icon: ScanLine, label: 'Customer Beli' },
  { to: '/scan/in', icon: PackagePlus, label: 'Beli ke Vendor' },
  { to: '/history', icon: History, label: 'Riwayat' },
  { to: '/products', icon: Package, label: 'Produk' },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Store className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="font-bold text-lg text-gray-800">Dream Higher</h1>
              <p className="text-xs text-gray-500">Warung Tracker</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
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
