import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import {
  Package, ShoppingCart, Users, TrendingUp, ArrowRight,
  Clock, AlertTriangle, Trophy, ArrowUp, ArrowDown,
  RefreshCw, X,
} from 'lucide-react';
import type {
  Order, DashboardStats, RevenuePoint, TopProduct, OrderStatusCount, LowStockVariant,
} from '@/types';

function RevenueChange({ today, yesterday }: { today: number; yesterday: number }) {
  if (!yesterday) return null;
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  const up = pct >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(pct)}% vs yesterday
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-purple-500',
  preparation: 'bg-indigo-500',
  shipped: 'bg-orange-500',
  ontheway: 'bg-orange-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<OrderStatusCount[]>([]);
  const [lowStock, setLowStock] = useState<LowStockVariant[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string[]>([]);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // `refreshing` is only ever visible on the retry button, so the mount-time
  // load never needs to raise it; `retry` does.
  const load = useCallback(async () => {
    const failures: string[] = [];
    const fetchOr = async <T,>(label: string, url: string, fallback: T): Promise<T> => {
      try {
        const r = await api.get(url);
        return r.data.data as T;
      } catch (err) {
        console.error(`Dashboard error (${label}):`, err);
        failures.push(label);
        return fallback;
      }
    };

    const [s, rc, tp, ro, sb, ls] = await Promise.all([
      fetchOr<DashboardStats | null>('Overview stats', '/dashboard/stats', null),
      fetchOr<RevenuePoint[]>('Revenue chart', '/dashboard/revenue-chart?days=7', []),
      fetchOr<TopProduct[]>('Top products', '/dashboard/top-products?limit=5', []),
      fetchOr<Order[]>('Recent orders', '/dashboard/recent-orders?limit=5', []),
      fetchOr<OrderStatusCount[]>('Order status breakdown', '/dashboard/orders-by-status', []),
      fetchOr<LowStockVariant[]>('Low stock', '/admin/inventory/low-stock?threshold=5', []),
    ]);

    setStats(s);
    setRevenueChart(rc);
    setTopProducts(tp);
    setRecentOrders(ro);
    setStatusBreakdown(sb);
    setLowStock(ls);
    setFailed(failures);
    setErrorDismissed(false);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const run = async () => {
      await load();
    };
    run();
  }, [load]);

  const retry = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Brothers Sports House overview</p>
      </div>

      {/* Load failure banner */}
      {failed.length > 0 && !errorDismissed && (
        <div role="alert" className="flex items-start justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {failed.length === 6
                  ? "Couldn't load the dashboard"
                  : `Couldn't load ${failed.length} of 6 sections`}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {failed.join(', ')} — the numbers below are incomplete, not zero.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={retry}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Retrying…' : 'Retry'}
            </button>
            <button
              onClick={() => setErrorDismissed(true)}
              aria-label="Dismiss error"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Alert banners */}
      <div className="space-y-3">
        {stats && stats.pendingOrders > 0 && (
          <Link to="/orders" className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:border-yellow-300 transition-all">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{stats.pendingOrders} orders pending confirmation</p>
                <p className="text-xs text-gray-500">Needs your attention</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        )}
        {lowStock.length > 0 && (
          <Link to="/products" className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl hover:border-red-300 transition-all">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{lowStock.length} products running low on stock</p>
                <p className="text-xs text-gray-500">Some variants have ≤ 5 units remaining</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'bg-orange-500', sub: `${stats?.todayOrders ?? 0} today`, link: '/orders' },
          { label: "Today's Revenue", value: `Rs ${(stats?.todayRevenue ?? 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500', sub: stats?.yesterdayRevenue != null ? <RevenueChange today={stats.todayRevenue} yesterday={stats.yesterdayRevenue} /> : null, link: '/orders' },
          { label: 'Active Products', value: stats?.totalProducts ?? 0, icon: Package, color: 'bg-blue-500', link: '/products' },
          { label: 'Customers', value: stats?.totalUsers ?? 0, icon: Users, color: 'bg-purple-500', link: '/users' },
        ].map((card) => (
          <Link key={card.label} to={card.link} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{card.value}</p>
            <div className="mt-0.5">{typeof card.sub === 'string' ? <p className="text-sm text-gray-500">{card.sub}</p> : card.sub}</div>
          </Link>
        ))}
      </div>

      {/* Revenue chart + Status breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue — Last 7 Days</h3>
          {revenueChart.length === 0 ? (
            <p className="text-sm text-gray-400">No revenue data yet</p>
          ) : (
            <>
              <div className="flex h-36 items-end gap-1.5">
                {revenueChart.map((d) => {
                  const heightPct = Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 4 : 0);
                  const label = new Date(d.date).toLocaleDateString('en-NP', { weekday: 'short' });
                  return (
                    <div key={d.date} className="group relative flex flex-1 flex-col items-center gap-1">
                      <div className="absolute bottom-6 hidden -translate-y-1 rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block whitespace-nowrap z-10">
                        Rs {d.revenue.toLocaleString()}
                      </div>
                      <div className="w-full rounded-t bg-orange-400 transition-all group-hover:bg-accent" style={{ height: `${heightPct}%` }} />
                      <span className="text-[10px] text-gray-500">{label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-right text-xs text-gray-500">
                Total: Rs {revenueChart.reduce((s, d) => s + d.revenue, 0).toLocaleString()}
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No orders to break down yet</p>
          ) : (
          <div className="space-y-3">
            {[...statusBreakdown].sort((a, b) => b.count - a.count).map((item) => {
              const total = statusBreakdown.reduce((s, i) => s + i.count, 0) || 1;
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 capitalize">{item.status}</span>
                    <span className="text-gray-500">{item.count} ({Math.round((item.count / total) * 100)}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full transition-all ${STATUS_COLORS[item.status] ?? 'bg-orange-500'}`} style={{ width: `${(item.count / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* Top products + Low stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" /> Top Selling Products
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{p.productName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{p.totalQty} sold</p>
                    <p className="text-xs text-gray-500">Rs {Number(p.totalRevenue).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Low Stock Alert
            </h3>
            <Link to="/products" className="text-xs text-accent hover:underline font-medium">Manage</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">All products well stocked</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((item) => (
                <div key={item.variantId} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.size && `Size: ${item.size}`}{item.color && ` · ${item.color}`}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {item.stock === 0 ? 'OUT' : `${item.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/orders" className="text-sm text-orange-500 hover:text-orange-600 font-medium">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No orders yet</td></tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{order.orderNumber || `#${order.id.slice(-8).toUpperCase()}`}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{order.firstName} {order.lastName}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">Rs {order.totalPrice?.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-NP')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
