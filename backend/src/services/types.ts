export enum OrderStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Processing = "processing",
  Preparation = "preparation",
  Shipped = "shipped",
  OnTheWay = "ontheway",
  Delivered = "delivered",
  Cancelled = "cancelled",
  Returned = "returned",
}

export enum PaymentMethod {
  // Legacy value - existing orders in the database still use "qr", keep it.
  QR = "qr",
  Esewa = "esewa",
  Khalti = "khalti",
  Bank = "bank",
  COD = "cod",
}

export enum PaymentStatus {
  Pending = "pending",
  Paid = "paid",
  Failed = "failed",
  Refunded = "refunded",
}

