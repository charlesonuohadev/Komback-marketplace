import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  Printer, 
  MapPin, 
  Calculator, 
  Key, 
  CheckCircle2, 
  Package, 
  QrCode, 
  Barcode, 
  Download, 
  ArrowRight,
  ShieldCheck,
  Building,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Store, PageType } from '../../types';
import { useMarketplace } from '../../context/AppContext';
import { api } from '../../lib/api';
import { formatNaira } from '../../utils/formatters';

interface SellerLogisticsProps {
  store: Store;
  setCurrentPage: (page: PageType) => void;
}

export const SellerLogistics: React.FC<SellerLogisticsProps> = ({
  store,
  setCurrentPage
}) => {
  const { reference } = useMarketplace();
  // Waybill Generator Form
  const [orderNumber, setOrderNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [destinationState, setDestinationState] = useState('');
  const [originState, setOriginState] = useState(store.state);
  const [courierProvider, setCourierProvider] = useState<string>('GIG Logistics');
  const [parcelWeight, setParcelWeight] = useState('1');
  const [itemContents, setItemContents] = useState('');
  const [declaredValue, setDeclaredValue] = useState('');
  const [generatedWaybill, setGeneratedWaybill] = useState<string | null>(null);
  const [copiedWaybill, setCopiedWaybill] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Rates, shipments and fulfillable orders all come from the API.
  const [shipments, setShipments] = useState<
    Awaited<ReturnType<typeof api.seller.logistics>>['shipments']
  >([]);
  const [pendingOrders, setPendingOrders] = useState<
    Awaited<ReturnType<typeof api.seller.logistics>>['pendingOrders']
  >([]);
  const [couriers, setCouriers] = useState<string[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.seller.logistics();
        if (cancelled) return;
        setShipments(res.shipments);
        setPendingOrders(res.pendingOrders);
        setCouriers(res.couriers);
        if (res.couriers[0]) setCourierProvider(res.couriers[0]);
      } catch (err) {
        if (!cancelled) {
          setDataError(err instanceof Error ? err.message : 'Could not load logistics data');
        }
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [store.id]);

  /** Pre-fills the waybill form from one of the store's undelivered orders. */
  const handleSelectOrder = (selectedNumber: string) => {
    setOrderNumber(selectedNumber);
    const order = pendingOrders.find((row) => row.orderNumber === selectedNumber);
    if (!order) return;
    setRecipientName(order.buyerName);
    setRecipientPhone(order.buyerPhone);
    setRecipientAddress(`${order.deliveryAddress}, ${order.buyerCityState}`);
    setDestinationState(order.deliveryState);
    setDeclaredValue(String(order.total));
  };

  // Default the rate-estimator destination once the reference data arrives.
  useEffect(() => {
    if (calcDest || reference.states.length === 0) return;
    const options = reference.states.filter((state) => state !== 'All Nigeria');
    if (options[0]) setCalcDest(options[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference.states]);

  // Rate calculator states
  const [calcOrigin, setCalcOrigin] = useState(store.state);
  const [calcDest, setCalcDest] = useState('');
  const [calcWeight, setCalcWeight] = useState('1');
  const [calcRate, setCalcRate] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);

  // Live escrow release tool
  const [testOrderNumber, setTestOrderNumber] = useState('');
  const [testPin, setTestPin] = useState('');
  const [pinValidationResult, setPinValidationResult] = useState<'success' | 'invalid' | null>(null);
  const [pinMessage, setPinMessage] = useState('');

  const handleGenerateWaybill = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsGenerating(true);

    try {
      const res = await api.seller.createWaybill({
        orderNumber,
        courier: courierProvider,
        recipientName,
        recipientPhone,
        parcelWeight,
        itemContents,
        declaredValue,
      });

      setGeneratedWaybill(res.shipment.waybillNumber);

      const refreshed = await api.seller.logistics();
      setShipments(refreshed.shipments);
      setPendingOrders(refreshed.pendingOrders);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not generate the waybill');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCalculateRate = async () => {
    setIsRating(true);
    try {
      const res = await api.seller.rate(calcOrigin, calcDest, calcWeight);
      setCalcRate(res.rate);
    } catch {
      setCalcRate(null);
    } finally {
      setIsRating(false);
    }
  };

  const handleCopyWaybill = () => {
    if (generatedWaybill) {
      navigator.clipboard?.writeText(generatedWaybill);
      setCopiedWaybill(true);
      setTimeout(() => setCopiedWaybill(false), 2000);
    }
  };

  const handleTestPinValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage('');

    if (testPin.length !== 4 || !testOrderNumber) {
      setPinValidationResult('invalid');
      setPinMessage('Select an order and enter the 4-digit code the buyer gave the rider.');
      return;
    }

    try {
      const res = await api.orders.verifyPin(testOrderNumber, testPin);
      setPinValidationResult('success');
      setPinMessage(`${res.order.id} verified — escrow released to your wallet.`);
      const refreshed = await api.seller.logistics();
      setShipments(refreshed.shipments);
      setPendingOrders(refreshed.pendingOrders);
      setTestPin('');
    } catch (err) {
      setPinValidationResult('invalid');
      setPinMessage(err instanceof Error ? err.message : 'PIN verification failed');
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-1">
            <Truck className="w-3.5 h-3.5" />
            <span>Integrated Nigerian Logistics Suite</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Logistics, Waybill Generator & Handover PIN
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate printable waybill manifests, book pickups with top Nigerian couriers, and verify buyer handover codes.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('track-order')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Truck className="w-4 h-4" />
          <span>Real-Time Tracker</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Waybill Generator Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <h2 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mb-1">
            Generate Shipping Waybill
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Creates official courier tracking manifest with Escrow insurance guarantee
          </p>

          <form onSubmit={handleGenerateWaybill} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Order Awaiting Dispatch *
              </label>
              <select
                required
                value={orderNumber}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">
                  {isLoadingData ? 'Loading your orders…' : 'Select an order from your store'}
                </option>
                {pendingOrders.map((order) => (
                  <option key={order.orderNumber} value={order.orderNumber}>
                    {order.orderNumber} — {order.buyerName} ({formatNaira(order.total)})
                  </option>
                ))}
              </select>
              {!isLoadingData && pendingOrders.length === 0 && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  No orders are awaiting dispatch. New paid orders appear here automatically.
                </p>
              )}
            </div>

            {dataError && (
              <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {dataError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Courier Partner *
                </label>
                <select
                  value={courierProvider}
                  onChange={(e) => setCourierProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {couriers.map((courier) => (
                    <option key={courier} value={courier}>
                      {courier}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Origin Hub (Store Location)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${store.name} (${store.location})`}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name of buyer"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Phone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+234 800 000 0000"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destination State *
                </label>
                <select
                  value={destinationState}
                  onChange={(e) => setDestinationState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {reference.states.filter(s => s !== 'All Nigeria').map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destination Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Plot number, street, city"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Weight (KG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={parcelWeight}
                  onChange={(e) => setParcelWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Declared Value (₦)
                </label>
                <input
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Category
                </label>
                <input
                  type="text"
                  value={itemContents}
                  onChange={(e) => setItemContents(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer mt-4"
            >
              <Truck className="w-4 h-4" />
              <span>
                {isGenerating ? 'Registering with courier…' : 'Register & Generate Official Waybill Number'}
              </span>
            </button>

            {formError && (
              <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {formError}
              </p>
            )}
          </form>
        </div>

        {/* Right column: Printable Shipping Manifest Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Printable Manifest Preview
              </h2>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Label</span>
              </button>
            </div>

            {/* Mock Waybill Label Container */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 font-mono text-[11px] space-y-3">
              {/* Courier branding header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <div className="font-black text-xs text-slate-900">{courierProvider.toUpperCase()}</div>
                  <div className="text-[10px] text-slate-500">EXPRESS ESCROW PARCEL</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-400">TRACKING NO.</div>
                  <div className="font-bold text-emerald-700 text-xs">{generatedWaybill || 'NOT ASSIGNED'}</div>
                </div>
              </div>

              {/* Barcode visual simulation */}
              <div className="text-center py-2 bg-white rounded-lg border border-slate-200">
                <div className="tracking-[0.3em] font-bold text-xs text-slate-900">
                  ||||| | |||| ||| || |||||| | ||| ||||
                </div>
                <div className="text-[9px] text-slate-400 mt-1">*{generatedWaybill}*</div>
              </div>

              {/* Sender & Consignee */}
              <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-slate-200 pb-2">
                <div>
                  <div className="text-slate-400 font-bold uppercase">SENDER (MERCHANT):</div>
                  <div className="font-bold text-slate-800 truncate">{store.name}</div>
                  <div className="text-slate-500 truncate">{store.location}</div>
                  <div className="text-slate-500">{store.phone}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase">CONSIGNEE (BUYER):</div>
                  <div className="font-bold text-slate-800 truncate">{recipientName}</div>
                  <div className="text-slate-500 truncate">{recipientAddress}</div>
                  <div className="text-slate-500">{destinationState}</div>
                </div>
              </div>

              {/* Escrow instructions on label */}
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 space-y-0.5">
                <div className="font-black flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>KOMBACK ESCROW RESTRICTION</span>
                </div>
                <p className="text-[9px] text-emerald-700 leading-tight">
                  Courier rider MUST NOT release package without collecting buyer's 4-digit Komback SMS PIN code.
                </p>
              </div>
            </div>

            {/* Quick Copy Waybill */}
            {generatedWaybill && (
              <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">ACTIVE WAYBILL</div>
                  <div className="font-mono text-xs font-black text-slate-900">{generatedWaybill}</div>
                </div>
                <button
                  onClick={handleCopyWaybill}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedWaybill ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tools Grid: Rate Calculator & PIN Unlocker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logistics Rate Calculator */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Interstate Courier Rate Estimator
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Instant calculation across all 36 Nigerian states and Abuja FCT
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Origin</label>
                <select
                  value={calcOrigin}
                  onChange={(e) => setCalcOrigin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {reference.states.filter(s => s !== 'All Nigeria').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Destination</label>
                <select
                  value={calcDest}
                  onChange={(e) => setCalcDest(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {reference.states.filter(s => s !== 'All Nigeria').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Gross Weight (KG)</label>
              <input
                type="number"
                step="0.5"
                value={calcWeight}
                onChange={(e) => setCalcWeight(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleCalculateRate}
              disabled={isRating || !calcDest}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              {isRating ? 'Calculating…' : 'Calculate Estimated Rate'}
            </button>

            {calcRate !== null && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between mt-2">
                <div>
                  <div className="text-[10px] text-emerald-800 font-bold uppercase">Estimated Waybill Cost:</div>
                  <div className="text-sm font-black text-emerald-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    {formatNaira(calcRate)}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                  Doorstep Delivery
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live Buyer Handover PIN Tester & Escrow Unlocker */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Instant PIN Escrow Unlock Tool
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Test and release escrow funds when a customer transmits their 4-digit confirmation token.
          </p>

          <form onSubmit={handleTestPinValidate} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Order to Release *
              </label>
              <select
                required
                value={testOrderNumber}
                onChange={(e) => setTestOrderNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
              >
                <option value="">Select a delivered order</option>
                {pendingOrders.map((order) => (
                  <option key={order.orderNumber} value={order.orderNumber}>
                    {order.orderNumber} — {order.buyerName}
                  </option>
                ))}
                {shipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.order.orderNumber}>
                    {shipment.order.orderNumber} — {shipment.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                4-Digit Buyer Code
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="e.g. 7492"
                value={testPin}
                onChange={(e) => {
                  setTestPin(e.target.value.replace(/\D/g, ''));
                  setPinValidationResult(null);
                }}
                className="w-full tracking-widest text-center text-lg font-black py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Verify Code & Release
            </button>

            {pinValidationResult === 'success' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pinMessage || 'PIN verified — escrow released to your wallet.'}</span>
              </div>
            )}

            {pinValidationResult === 'invalid' && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                {pinMessage || 'Invalid PIN code. Please confirm the code with the buyer.'}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Waybill register — sourced from the `Shipment` table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Waybill Register ({shipments.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every waybill generated for your store, with live courier status.
            </p>
          </div>
        </div>

        {isLoadingData ? (
          <p className="text-xs font-bold text-slate-500 p-6">Loading waybills…</p>
        ) : shipments.length === 0 ? (
          <p className="text-xs font-bold text-slate-500 p-6">
            No waybills generated yet. Select an order above to create your first one.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900">
                      {shipment.waybillNumber}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-700">{shipment.courier}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">#{shipment.order.orderNumber}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {shipment.origin} → {shipment.destination} · {shipment.recipientName}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-black text-slate-900">
                    {formatNaira(shipment.order.total)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                    {shipment.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
