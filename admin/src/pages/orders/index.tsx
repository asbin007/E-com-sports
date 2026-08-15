import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import type { Order } from '@/types';
import {
  Search, Package, ChevronDown, ChevronLeft, ChevronRight, Truck, Download, Image,
  CheckCircle, XCircle, AlertTriangle, X, Clock, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_STATUSES = ['pending', 'confirmed', 'preparation', 'ontheway', 'delivered', 'cancelled'];

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparation: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-orange-100 text-orange-700',
  ontheway: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  esewa: 'eSewa',
  khalti: 'Khalti',
  bank: 'Bank Transfer',
  cod: 'Cash on Delivery',
  qr: 'QR / Manual', // legacy value on pre-split orders
};

// Every method except COD is paid manually and needs its proof reviewed.
const needsPaymentReview = (method: string) => method !== 'cod';

const orderLabel = (o: Order) => o.orderNumber || `#${o.id.slice(-8).toUpperCase()}`;

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

type PaymentReview = { orderId: string; step: 'view' | 'verify' | 'reject' };

interface Pagination { total: number; page: number; limit: number; totalPages: number }

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });

  // Payment proof lightbox + confirmation flow
  const [review, setReview] = useState<PaymentReview | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  // Cancellation confirmation flow
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  // In-flight guard: blocks double submits and pauses the background poll.
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const mutatingRef = useRef(false);

  const fetchOrders = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await api.get('/orders', {
        params: { page, limit: PAGE_SIZE, ...(statusFilter ? { status: statusFilter } : {}) },
      });
      setOrders(res.data?.data || []);
      const p = res.data?.pagination;
      if (p) setPagination({ total: p.total ?? 0, page: p.page ?? page, limit: p.limit ?? PAGE_SIZE, totalPages: p.totalPages ?? 1 });
      setError(null);
    } catch (err: any) {
      // Only a foreground fetch surfaces an error panel; a failed background
      // poll must never wipe the list the operator is working from.
      if (!opts?.silent) {
        setOrders([]);
        setError(err.response?.data?.message || err.message || 'Failed to load orders');
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  useEffect(() => {
    api.get('/admin/delivery-boys').then((r) => setDeliveryBoys(r.data?.data || [])).catch(() => setDeliveryBoys([]));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Skip the poll while a mutation is in flight, otherwise an in-transit GET
      // can land after a PATCH and revert the optimistic update.
      if (mutatingRef.current) return;
      fetchOrders({ silent: true });
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  // Escape closes the open dialogs (never mid-request).
  useEffect(() => {
    if (!review && !cancelTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || busyOrderId) return;
      setReview(null);
      setCancelTarget(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [review, cancelTarget, busyOrderId]);

  const runMutation = async (orderId: string, fn: () => Promise<void>) => {
    if (mutatingRef.current) return;
    mutatingRef.current = true;
    setBusyOrderId(orderId);
    try {
      await fn();
    } finally {
      mutatingRef.current = false;
      setBusyOrderId(null);
    }
  };

  const updateStatus = (orderId: string, newStatus: string) =>
    runMutation(orderId, async () => {
      try {
        await api.patch(`/orders/${orderId}/status`, { status: newStatus });
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
        toast.success(`Status updated to ${newStatus}`);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update status');
      }
    });

  const assignDelivery = (orderId: string, deliveryBoyId: string) =>
    runMutation(orderId, async () => {
      try {
        await api.patch(`/orders/${orderId}/assign`, { deliveryBoyId: deliveryBoyId || null });
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, deliveryBoyId: deliveryBoyId || undefined } : o));
        toast.success(deliveryBoyId ? 'Delivery boy assigned' : 'Assignment removed');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to assign');
      }
    });

  const verifyPayment = (order: Order) =>
    runMutation(order.id, async () => {
      try {
        await api.patch(`/payments/${order.id}/verify`);
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, paymentStatus: 'paid' } : o));
        toast.success(`Payment verified for ${orderLabel(order)}`);
        setReview(null);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to verify');
      }
    });

  const rejectPayment = (order: Order, reason: string) =>
    runMutation(order.id, async () => {
      try {
        await api.patch(`/payments/${order.id}/reject`, { reason });
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, paymentStatus: 'failed' } : o));
        toast.success(`Payment rejected for ${orderLabel(order)}`);
        setReview(null);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to reject');
      }
    });

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      // Must go through the authed axios client — a raw <a href> sends no
      // Authorization header and the export endpoint 401s.
      const res = await api.get('/orders/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Failed to export orders');
    } finally {
      setExporting(false);
    }
  };

  const openReview = (orderId: string, step: PaymentReview['step']) => {
    setRejectReason('');
    setReview({ orderId, step });
  };

  // Search is client-side over the current page only — the backend getOrders
  // endpoint accepts status/page/limit but has no search param.
  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.firstName?.toLowerCase().includes(q) ||
      o.lastName?.toLowerCase().includes(q) ||
      o.phoneNumber?.includes(search) ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  const reviewOrder = review ? orders.find((o) => o.id === review.orderId) ?? null : null;
  const cancelOrder = cancelTarget ? orders.find((o) => o.id === cancelTarget) ?? null : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total.toLocaleString()} orders total
            {statusFilter && <span className="text-gray-400"> · filtered by “{statusFilter}”</span>}
            {pagination.totalPages > 1 && (
              <span className="text-gray-400"> · page {pagination.page} of {pagination.totalPages}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search this page by name, phone, order #..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Searches the {orders.length} orders on this page only — use the status filter and pages to narrow the full list.</p>
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="self-start px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Couldn’t load orders</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <p className="text-xs text-gray-400 mt-1">This is a loading failure, not an empty list — orders may still be waiting.</p>
            <button
              type="button"
              onClick={() => fetchOrders()}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search && orders.length > 0
                ? `No orders on this page match “${search}”`
                : 'No orders found'}
            </p>
          </div>
        ) : (
          filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header row */}
              <button
                type="button"
                aria-expanded={expanded === order.id}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-gray-600">{orderLabel(order)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {order.orderStatus}
                  </span>
                  {needsPaymentReview(order.paymentMethod) && order.paymentStatus === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                      payment awaiting review
                    </span>
                  )}
                  {order.deliveryBoyId && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-xs font-medium text-orange-600">
                      <Truck className="w-3 h-3" />
                      {deliveryBoys.find((b: any) => b.id === order.deliveryBoyId)?.username ?? 'Assigned'}
                    </span>
                  )}
                  <span className="text-sm text-gray-500 hidden sm:inline">
                    {order.firstName} {order.lastName} · {order.phoneNumber}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" /> {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-gray-900">Rs {order.totalPrice?.toLocaleString()}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded details */}
              {expanded === order.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Items */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Items</p>
                      {order.OrderItems?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.productName} ({item.size || 'N/A'}) x{item.quantity}</span>
                          <span className="font-medium text-gray-900">Rs {item.totalPrice?.toLocaleString()}</span>
                        </div>
                      ))}
                      {order.subtotal != null && (
                        <div className="pt-2 border-t border-gray-100 space-y-1">
                          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-900">Rs {order.subtotal.toLocaleString()}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span><span className="text-gray-900">Rs {(order.deliveryCharge ?? 0).toLocaleString()}</span></div>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold"><span>Payment</span><span>{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod} · {order.paymentStatus}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Placed</span><span className="text-gray-900">{formatDate(order.createdAt)}</span></div>
                    </div>

                    {/* Payment Proof & Verification */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Payment Proof</p>

                      {/* Transaction ID */}
                      {order.paymentPid && (
                        <div className="text-sm">
                          <span className="text-gray-500">Transaction ID: </span>
                          <span className="font-mono font-medium text-gray-900">{order.paymentPid}</span>
                        </div>
                      )}

                      {/* Screenshot — opens in-page so the total stays on screen */}
                      {order.paymentScreenshot ? (
                        <button
                          type="button"
                          onClick={() => openReview(order.id, 'view')}
                          className="block relative group rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                        >
                          <img
                            src={order.paymentScreenshot}
                            alt={`Payment screenshot for ${orderLabel(order)}`}
                            className="w-full max-w-[200px] h-auto rounded-lg border border-gray-200 shadow-sm group-hover:ring-2 group-hover:ring-orange-500/30 transition-all"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg flex items-center justify-center transition-all">
                            <Image className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="block text-xs text-orange-600 font-medium mt-1">Open full size to review</span>
                        </button>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No screenshot uploaded</p>
                      )}

                      {/* Verify / Reject — both open the review dialog for confirmation */}
                      {needsPaymentReview(order.paymentMethod) && order.paymentStatus === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            disabled={busyOrderId === order.id}
                            onClick={() => openReview(order.id, 'verify')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Verify
                          </button>
                          <button
                            type="button"
                            disabled={busyOrderId === order.id}
                            onClick={() => openReview(order.id, 'reject')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}

                      {order.paymentStatus === 'paid' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> Payment Verified
                        </span>
                      )}
                      {order.paymentStatus === 'failed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Payment Rejected
                        </span>
                      )}
                    </div>

                    {/* Status + Delivery */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Status</p>
                        <select
                          value={order.orderStatus}
                          disabled={busyOrderId === order.id}
                          onChange={(e) => {
                            const next = e.target.value;
                            if (next === order.orderStatus) return;
                            // Cancelling is destructive — confirm before applying.
                            if (next === 'cancelled') setCancelTarget(order.id);
                            else updateStatus(order.id, next);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-50"
                        >
                          {ALL_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                        </select>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Assign Delivery Boy</p>
                        <select
                          value={order.deliveryBoyId ?? ''}
                          disabled={busyOrderId === order.id}
                          onChange={(e) => assignDelivery(order.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-50"
                        >
                          <option value="">— Unassigned —</option>
                          {deliveryBoys.map((b: any) => (<option key={b.id} value={b.id}>{b.username}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing {orders.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            –{(pagination.page - 1) * pagination.limit + orders.length} of {pagination.total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm text-gray-600 px-1">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Payment proof lightbox + verify/reject confirmation */}
      {reviewOrder && review && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!busyOrderId) setReview(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Payment proof for ${orderLabel(reviewOrder)}`}
            className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Payment proof · {orderLabel(reviewOrder)}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Placed {formatDate(reviewOrder.createdAt)}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={!!busyOrderId}
                onClick={() => setReview(null)}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              {/* Screenshot, large */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-2 min-h-[240px]">
                {reviewOrder.paymentScreenshot ? (
                  <img
                    src={reviewOrder.paymentScreenshot}
                    alt={`Payment screenshot for ${orderLabel(reviewOrder)}`}
                    className="max-h-[65vh] w-auto max-w-full object-contain rounded"
                  />
                ) : (
                  <p className="text-sm text-gray-400 italic">No screenshot uploaded</p>
                )}
              </div>

              {/* Decision facts stay on screen next to the image */}
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Order total to match</p>
                    <p className="text-2xl font-bold text-gray-900">Rs {reviewOrder.totalPrice?.toLocaleString()}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Transaction ID: </span>
                    <span className="font-mono font-medium text-gray-900">{reviewOrder.paymentPid || '— none provided —'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Method: </span>
                    <span className="font-medium text-gray-900">{PAYMENT_METHOD_LABELS[reviewOrder.paymentMethod] || reviewOrder.paymentMethod}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Customer: </span>
                    <span className="font-medium text-gray-900">{reviewOrder.firstName} {reviewOrder.lastName} · {reviewOrder.phoneNumber}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Payment status: </span>
                    <span className="font-medium text-gray-900">{reviewOrder.paymentStatus}</span>
                  </div>
                </div>

                {needsPaymentReview(reviewOrder.paymentMethod) && reviewOrder.paymentStatus === 'pending' ? (
                  <>
                    {review.step === 'view' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!!busyOrderId}
                          onClick={() => setReview({ ...review, step: 'verify' })}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" /> Verify
                        </button>
                        <button
                          type="button"
                          disabled={!!busyOrderId}
                          onClick={() => setReview({ ...review, step: 'reject' })}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}

                    {review.step === 'verify' && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                        <p className="flex items-start gap-2 text-sm text-gray-800">
                          <AlertTriangle className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />
                          <span>
                            Mark <span className="font-semibold">{orderLabel(reviewOrder)}</span> as paid for{' '}
                            <span className="font-semibold">Rs {reviewOrder.totalPrice?.toLocaleString()}</span>? This
                            authorises the money as received and cannot be undone from this screen.
                          </span>
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={!!busyOrderId}
                            onClick={() => verifyPayment(reviewOrder)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {busyOrderId === reviewOrder.id ? 'Verifying…' : `Confirm — mark Rs ${reviewOrder.totalPrice?.toLocaleString()} paid`}
                          </button>
                          <button
                            type="button"
                            disabled={!!busyOrderId}
                            onClick={() => setReview({ ...review, step: 'view' })}
                            className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    )}

                    {review.step === 'reject' && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
                        <p className="flex items-start gap-2 text-sm text-gray-800">
                          <AlertTriangle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
                          <span>
                            Reject the payment proof for <span className="font-semibold">{orderLabel(reviewOrder)}</span>{' '}
                            (<span className="font-semibold">Rs {reviewOrder.totalPrice?.toLocaleString()}</span>)? The
                            reason below is recorded and shown to the customer.
                          </span>
                        </p>
                        <div>
                          <label htmlFor="reject-reason" className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            Reason for rejection
                          </label>
                          <textarea
                            id="reject-reason"
                            rows={3}
                            value={rejectReason}
                            disabled={!!busyOrderId}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Screenshot shows Rs 2,400 but the order total is Rs 3,150"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-50"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={!!busyOrderId || !rejectReason.trim()}
                            onClick={() => rejectPayment(reviewOrder, rejectReason.trim())}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-4 h-4" />
                            {busyOrderId === reviewOrder.id ? 'Rejecting…' : 'Confirm rejection'}
                          </button>
                          <button
                            type="button"
                            disabled={!!busyOrderId}
                            onClick={() => setReview({ ...review, step: 'view' })}
                            className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Back
                          </button>
                        </div>
                        {!rejectReason.trim() && (
                          <p className="text-xs text-gray-500">Enter a reason to enable rejection.</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-gray-200 p-4">
                    {reviewOrder.paymentStatus === 'paid' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> Payment Verified
                      </span>
                    )}
                    {reviewOrder.paymentStatus === 'failed' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Payment Rejected
                      </span>
                    )}
                    {reviewOrder.paymentStatus !== 'paid' && reviewOrder.paymentStatus !== 'failed' && (
                      <p className="text-sm text-gray-500">This payment method needs no manual review.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel-order confirmation */}
      {cancelOrder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!busyOrderId) setCancelTarget(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Cancel order ${orderLabel(cancelOrder)}`}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Cancel this order?</h2>
              <button
                type="button"
                aria-label="Close"
                disabled={!!busyOrderId}
                onClick={() => setCancelTarget(null)}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="flex items-start gap-2 text-sm text-gray-700">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>
                Set <span className="font-semibold">{orderLabel(cancelOrder)}</span> (
                <span className="font-semibold">Rs {cancelOrder.totalPrice?.toLocaleString()}</span> ·{' '}
                {cancelOrder.firstName} {cancelOrder.lastName}) from{' '}
                <span className="font-semibold">{cancelOrder.orderStatus}</span> to{' '}
                <span className="font-semibold">cancelled</span>?
              </span>
            </p>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                disabled={!!busyOrderId}
                onClick={async () => {
                  const id = cancelOrder.id;
                  await updateStatus(id, 'cancelled');
                  setCancelTarget(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" />
                {busyOrderId === cancelOrder.id ? 'Cancelling…' : 'Confirm cancellation'}
              </button>
              <button
                type="button"
                disabled={!!busyOrderId}
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
