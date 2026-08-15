import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/dashboard';
import Products from '@/pages/products';
import ProductForm from '@/pages/products/ProductForm';
import Orders from '@/pages/orders';
import Categories from '@/pages/categories';
import Brands from '@/pages/brands';
import Sports from '@/pages/sports';
import ProductTypes from '@/pages/product-types';
import Users from '@/pages/users';
import Delivery from '@/pages/delivery';
import Reviews from '@/pages/reviews';

function NotAuthorised() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 text-red-600" />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Not authorised</h1>
        <p className="text-sm text-gray-500 mt-2">
          This admin panel is for administrator accounts only. You are signed in as{' '}
          <span className="font-medium text-gray-700">{user?.email}</span>
          {user?.role ? ` (${user.role})` : ''}.
        </p>
        <button
          onClick={logout}
          className="w-full mt-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where they were headed so signing back in returns them there
    // instead of dumping them on the dashboard.
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  // Signed in but not an admin: show an explicit refusal with a way out. A
  // redirect here would only bounce between /login and / forever.
  if (!isAdmin) {
    return <NotAuthorised />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="orders" element={<Orders />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="categories" element={<Categories />} />
        <Route path="brands" element={<Brands />} />
        <Route path="sports" element={<Sports />} />
        <Route path="product-types" element={<ProductTypes />} />
        <Route path="users" element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: '14px',
              fontWeight: 500,
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
