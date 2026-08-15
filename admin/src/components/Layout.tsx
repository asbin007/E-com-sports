import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Layers,
  Users,
  LogOut,
  Menu,
  X,
  Trophy,
  Dumbbell,
  Shapes,
  Truck,
  Star,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/delivery', label: 'Delivery', icon: Truck },
  { path: '/reviews', label: 'Reviews', icon: Star },
  { path: '/categories', label: 'Categories', icon: Tag },
  { path: '/product-types', label: 'Product Types', icon: Shapes },
  { path: '/brands', label: 'Brands', icon: Layers },
  { path: '/sports', label: 'Sports', icon: Trophy },
  { path: '/users', label: 'Users', icon: Users },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // The sidebar is permanently visible from `lg` up, but off-canvas below it.
  // Track the breakpoint so the closed off-canvas sidebar can be made inert
  // (removed from the tab order and the accessibility tree).
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        aria-label="Main navigation"
        inert={!isDesktop && !sidebarOpen}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-none">Brothers Sports</h1>
              <span className="text-[10px] font-medium text-orange-500 uppercase tracking-wider">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
              className="ml-auto -mr-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-accent-hover'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-orange-600">
                  {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.username || 'Admin'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {user?.role || 'admin'}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
