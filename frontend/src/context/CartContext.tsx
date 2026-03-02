import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type Product } from "../services/productService";

export interface CartItem extends Product {
  selectedSize: string | null; // null for Gear
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string | null) => void;
  removeFromCart: (productId: string, size: string | null) => void;
  updateQuantity: (productId: string, size: string | null, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, size: string | null) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => item.id === product.id && item.selectedSize === size,
      );

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        { ...product, selectedSize: size, quantity: 1 },
      ];
    });
    setIsCartOpen(true); // Open drawer on add
  };

  const removeFromCart = (productId: string, size: string | null) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.id === productId && item.selectedSize === size),
      ),
    );
  };

  const updateQuantity = (
    productId: string,
    size: string | null,
    quantity: number,
  ) => {
    if (quantity < 1) {
      removeFromCart(productId, size);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId && item.selectedSize === size
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (total, item) => total + (item.price || 0) * item.quantity,
    0,
  );
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
