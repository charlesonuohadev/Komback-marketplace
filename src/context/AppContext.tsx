import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, type AuthUser, type Reference } from '../lib/api';
import type { BlogPost, CartItem, Category, Product, Review, Store } from '../types';

interface AppContextValue {
  // Reference / catalog
  categories: Category[];
  stores: Store[];
  blogPosts: BlogPost[];
  recentReviews: Review[];
  reference: Reference;
  products: Product[];
  loading: boolean;
  error: string | null;

  // Cart
  cart: CartItem[];
  cartCount: number;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateCartQuantity: (productId: string, delta: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (product: Product) => Promise<boolean>;

  // Auth
  user: AuthUser | null;
  store: Store | null;
  authReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;

  // Catalog mutation + refresh helpers
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  refreshProducts: () => Promise<void>;
  refreshStores: () => Promise<void>;
  refreshReviews: () => Promise<void>;
}

const EMPTY_REFERENCE: Reference = {
  states: [],
  cities: [],
  banks: [],
  couriers: [],
  conditions: [],
  badges: [],
  shippingFees: {},
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [reference, setReference] = useState<Reference>(EMPTY_REFERENCE);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const refreshProducts = useCallback(async () => {
    const res = await api.catalog.products({ limit: 100 });
    setProducts(res.products);
  }, []);

  const refreshStores = useCallback(async () => {
    const res = await api.catalog.stores({ limit: 100 });
    setStores(res.stores);
  }, []);

  const refreshReviews = useCallback(async () => {
    const res = await api.catalog.recentReviews(4);
    setRecentReviews(res.reviews);
  }, []);

  const refreshCart = useCallback(async () => {
    const res = await api.cart.get();
    setCart(res.items);
  }, []);

  const refreshWishlist = useCallback(async () => {
    const res = await api.wishlist.get();
    setWishlistIds(res.ids);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await api.auth.me();
      setUser(res.user);
      setStore(res.store);
    } catch {
      setUser(null);
      setStore(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  // Initial load — everything comes from PostgreSQL via the API.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [
          categoriesRes,
          storesRes,
          blogRes,
          reviewsRes,
          productsRes,
          referenceRes,
          cartRes,
          wishlistRes,
        ] = await Promise.all([
          api.catalog.categories(),
          api.catalog.stores({ limit: 100 }),
          api.catalog.blog(),
          api.catalog.recentReviews(4),
          api.catalog.products({ limit: 100 }),
          api.reference(),
          api.cart.get(),
          api.wishlist.get(),
        ]);

        if (cancelled) return;

        setCategories(categoriesRes.categories);
        setStores(storesRes.stores);
        setBlogPosts(blogRes.posts);
        setRecentReviews(reviewsRes.reviews);
        setProducts(productsRes.products);
        setReference(referenceRes);
        setCart(cartRes.items);
        setWishlistIds(wishlistRes.ids);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `Could not reach the marketplace database: ${err.message}`
              : 'Could not reach the marketplace database'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      await refreshAuth();
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshAuth]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, { product, quantity }];
      });
      try {
        await api.cart.add(product.id, quantity);
      } finally {
        await refreshCart();
      }
    },
    [refreshCart]
  );

  const updateCartQuantity = useCallback(
    async (productId: string, delta: number) => {
      setCart((prev) =>
        prev
          .map((item) =>
            item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item
          )
          .filter((item) => item.quantity > 0)
      );
      const current = cart.find((item) => item.product.id === productId);
      const next = (current?.quantity ?? 1) + delta;
      try {
        await api.cart.update(productId, next);
      } finally {
        await refreshCart();
      }
    },
    [cart, refreshCart]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      try {
        await api.cart.remove(productId);
      } finally {
        await refreshCart();
      }
    },
    [refreshCart]
  );

  const clearCart = useCallback(async () => {
    setCart([]);
    await api.cart.clear();
  }, []);

  const toggleWishlist = useCallback(async (product: Product) => {
    const res = await api.wishlist.toggle(product.id);
    setWishlistIds(res.ids);
    return res.wishlisted;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
    const me = await api.auth.me();
    setStore(me.store);
    // Guest cart/wishlist rows were merged server-side on login.
    await Promise.all([refreshCart(), refreshWishlist()]);
  }, [refreshCart, refreshWishlist]);

  const register = useCallback(async (payload: Record<string, unknown>) => {
    const res = await api.auth.register(payload);
    setUser(res.user);
    const me = await api.auth.me();
    setStore(me.store);
    await Promise.all([refreshCart(), refreshWishlist(), refreshStores()]);
  }, [refreshCart, refreshStores, refreshWishlist]);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
    setStore(null);
    await Promise.all([refreshCart(), refreshWishlist()]);
  }, [refreshCart, refreshWishlist]);

  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);

  const value = useMemo<AppContextValue>(
    () => ({
      categories,
      stores,
      blogPosts,
      recentReviews,
      reference,
      products,
      loading,
      error,
      cart,
      cartCount,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      wishlistIds,
      toggleWishlist,
      user,
      store,
      authReady,
      login,
      register,
      logout,
      refreshAuth,
      setProducts,
      refreshProducts,
      refreshStores,
      refreshReviews,
    }),
    [
      categories,
      stores,
      blogPosts,
      recentReviews,
      reference,
      products,
      loading,
      error,
      cart,
      cartCount,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      wishlistIds,
      toggleWishlist,
      user,
      store,
      authReady,
      login,
      register,
      logout,
      refreshAuth,
      refreshProducts,
      refreshStores,
      refreshReviews,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useMarketplace(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useMarketplace must be used inside <AppProvider>');
  }
  return context;
}
