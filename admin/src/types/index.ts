export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  brandId: string;
  productTypeId: string;
  sportId?: string;
  gender?: string;
  isActive: boolean;
  isFeatured: boolean;
  allowCustomization: boolean;
  tags: string[];
  createdAt: string;
  Category?: { id: string; name: string; slug: string; needsSize: boolean; sizeType: string | null };
  Brand?: { id: string; name: string; slug: string; logo?: string };
  ProductType?: { id: string; name: string; slug: string };
  Sport?: { id: string; name: string; slug: string };
  variants?: Variant[];
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  Variants?: Variant[];
  ProductImages?: ProductImage[];
  ProductAttributes?: ProductAttribute[];
}

export interface Variant {
  id: string;
  size: string;
  color: string;
  price: number;
  originalPrice?: number | null;
  costPrice?: number | null;
  stock: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
  isThumbnail: boolean;
  sortOrder: number;
}

export interface ProductAttribute {
  id: string;
  attributeName: string;
  attributeValue: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  needsSize: boolean;
  sizeType: string | null;
  isActive: boolean;
  parentId?: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
}

/**
 * Known checkout payment methods.
 *
 * `qr` is a legacy value: orders placed before the eSewa/Khalti/bank split
 * still carry it and it means the same thing as the new manual methods
 * (customer uploads a screenshot, admin approves or rejects). `cod` is the
 * only method that needs no proof review.
 *
 * The union is deliberately widened with `(string & {})` so it stays
 * assignable from arbitrary API strings — the backend is the source of truth
 * and may add methods before this file catches up. The known members are kept
 * for editor autocomplete; render one via PAYMENT_METHOD_LABELS, which falls
 * back to the raw value for anything unmapped.
 */
export type PaymentMethod =
  | 'esewa'
  | 'khalti'
  | 'bank'
  | 'cod'
  | 'qr'
  | (string & {});

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  zipcode: string;
  orderStatus: string;
  totalPrice: number;
  subtotal?: number;
  deliveryCharge?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  paymentPid?: string;
  paymentScreenshot?: string;
  deliveryBoyId?: string;
  createdAt: string;
  OrderItems?: OrderItem[];
  Payment?: Payment;
  User?: User;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  amount: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: Order[];
}
