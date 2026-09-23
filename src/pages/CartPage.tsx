import React, { useState } from 'react';
import { CartItem, Product, PageType } from '../types';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag, Truck, Lock, CheckCircle2 } from 'lucide-react';
import { formatNaira } from '../utils/formatters';
import { api, type CreatedOrder } from '../lib/api';
import { useMarketplace } from '../context/AppContext';

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onViewProduct: (product: Product) => void;
  setCurrentPage: (page: PageType) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onViewProduct,
  setCurrentPage
}) => {
  const { reference, user } = useMarketplace();
  const [deliveryState, setDeliveryState] = useState('Lagos');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [buyerName, setBuyerName] = useState(user?.name ?? '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone ?? '');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrders, setPlacedOrders] = useState<CreatedOrder[]>([]);

  const deliveryStates = reference.states.filter((state) => state !== 'All Nigeria');
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  // Waybill pricing comes from the same table the checkout API uses.
  const deliveryFee =
    subtotal > 0 ? (reference.shippingFees[deliveryState] ?? reference.shippingFees.default ?? 0) : 0;
  const total = subtotal + deliveryFee;
  const checkoutSuccess = placedOrders.length > 0;

  const handleCompleteOrder = async () => {
    setCheckoutError(null);
    setIsCheckingOut(true);

    try {
      const res = await api.orders.checkout({
        buyerName,
        buyerPhone,
        buyerEmail: user?.email,
        deliveryAddress,
        buyerCityState: `${deliveryState}, Nigeria`,
        deliveryState,
        paymentProvider: 'escrow',
      });
      setPlacedOrders(res.orders);
      await onClearCart();
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (checkoutSuccess) {
    return (
      <div className="py-16 bg-[#F8FAFC] min-h-screen">
        <div className="max-w-md mx-auto px-4 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Order Placed Successfully!
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your order has been transmitted to verified sellers on Komback. You will receive an SMS & WhatsApp waybill dispatch confirmation within 30 minutes.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-left space-y-1 text-slate-700">
            {placedOrders.map((order) => (
              <div key={order.orderNumber}>
                <strong>Order #{order.orderNumber}</strong> — {order.storeName} ·{' '}
                {formatNaira(order.total)} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
              </div>
            ))}
            <div><strong>Destination:</strong> {deliveryState}, Nigeria</div>
            <div><strong>Payment Mode:</strong> Komback Escrow Protected</div>
          </div>
          <button
            onClick={() => {
              setPlacedOrders([]);
              setCurrentPage('track-order');
            }}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            Track This Order
          </button>
          <button
            onClick={() => {
              setPlacedOrders([]);
              setCurrentPage('products');
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="py-16 bg-[#F8FAFC] min-h-screen">
        <div className="max-w-md mx-auto px-4 text-center bg-white p-10 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Your Shopping Bag is Empty
          </h2>
          <p className="text-xs text-slate-500">
            Explore verified gadgets, real estate, vehicles, and native wear on Nigeria's premier marketplace.
          </p>
          <button
            onClick={() => setCurrentPage('products')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            Start Shopping Now →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="komback-cart-page" className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mb-6">
          Your Shopping Cart ({cart.reduce((a, c) => a + c.quantity, 0)} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-4"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-24 h-24 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
                  onClick={() => onViewProduct(item.product)}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {item.product.seller.name}
                    </span>
                    <span className="text-[10px] text-slate-400">📍 {item.product.location}</span>
                  </div>

                  <h3
                    onClick={() => onViewProduct(item.product)}
                    className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-2 cursor-pointer"
                  >
                    {item.product.title}
                  </h3>

                  <div className="mt-1 text-sm font-black text-slate-900">
                    {formatNaira(item.product.price)}
                  </div>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      className="p-1 rounded-lg hover:bg-white text-slate-700 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      className="p-1 rounded-lg hover:bg-white text-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentPage('products')}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                ← Add More Items from Listings
              </button>
              <button
                onClick={onClearCart}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear Entire Bag
              </button>
            </div>
          </div>

          {/* Checkout & Order Summary Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
              Order Summary
            </h3>

            {/* Delivery State Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Delivery State in Nigeria</label>
              <select
                value={deliveryState}
                onChange={(e) => setDeliveryState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
              >
                {deliveryStates.map((state) => (
                  <option key={state} value={state}>
                    {state} — {formatNaira(reference.shippingFees[state] ?? reference.shippingFees.default ?? 0)} waybill
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Full name of the person receiving delivery…"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />

              <input
                type="tel"
                placeholder="Phone number for the courier…"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />

              <input
                type="text"
                placeholder="Doorstep delivery street address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-900">{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Verified Waybill Delivery:</span>
                <span className="font-bold text-slate-900">{formatNaira(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-emerald-700 text-base">{formatNaira(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCompleteOrder}
              disabled={isCheckingOut}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isCheckingOut ? 'Securing Transaction...' : 'Proceed to Secure Checkout'}</span>
            </button>

            {checkoutError && (
              <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {checkoutError}
              </p>
            )}

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Komback Escrow: Funds released to merchant only after satisfactory inspection.</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
