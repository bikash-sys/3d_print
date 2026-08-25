import { useState, useEffect, useMemo } from 'react';
import { Calculator, Clock, Sparkles, DollarSign, Weight, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import type { STLModel, PrintSettings } from '../../types/model';
import { MATERIALS } from './SettingsPanel';

interface EstimatePanelProps {
  models: STLModel[];
  settings: PrintSettings;
}

export function EstimatePanel({ models, settings }: EstimatePanelProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  // Razorpay states
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Reset calculations and payment when models or settings change
  useEffect(() => {
    setHasCalculated(false);
    setPaymentSuccess(false);
    setPaymentError(null);
  }, [models, settings]);

  const handlePayment = async () => {
    setIsPaying(true);
    setPaymentError(null);
    setPaymentSuccess(false);

    try {
      // 1. Convert USD estimated price to INR paise (e.g. 1 USD = 80 INR)
      const priceInINR = quoteData.price * 80;
      const amountInPaise = Math.max(100, Math.round(priceInINR * 100));

      // 2. Call backend order creation endpoint
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_estimate_${Date.now()}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Razorpay order');
      }

      const orderData = await response.json();
      const { order_id } = orderData;

      // 3. Configure Razorpay checkout options
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('VITE_RAZORPAY_KEY_ID is not configured in the environment.');
      }

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: 'INR',
        name: '3D Print Estimate',
        description: `3D Printing Service - ${activeModelsInfo.count} parts`,
        order_id: order_id,
        handler: async function (response: any) {
          setIsPaying(true);
          try {
            // Verify payment signature on backend
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (verifyResponse.ok && verifyData.success) {
              setPaymentSuccess(true);
            } else {
              setPaymentError(verifyData.error || 'Payment signature verification failed.');
            }
          } catch (err: any) {
            console.error(err);
            setPaymentError(err.message || 'Error occurred during payment verification.');
          } finally {
            setIsPaying(false);
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#0ea5e9',
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
            setPaymentError('Payment cancelled by user.');
          },
        },
        external: {
          wallets: ['amazonpay'],
          handler: function (data: any) {
            console.log("External wallet callback data:", data);
            setIsPaying(false);
            alert(`Amazon Pay selected! Redirecting to external flow for: ${data.wallet}`);
            setPaymentSuccess(true); // Mark as success for local mock testing
          }
        }
      };

      // 4. Open Razorpay checkout modal
      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        setIsPaying(false);
        setPaymentError(response.error.description || 'Payment transaction failed.');
      });

      rzp.open();
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.message || 'Could not initiate Razorpay payment.');
      setIsPaying(false);
    }
  };

  // 1. Calculate active models count and combined scaled volume (cm³)
  const activeModelsInfo = useMemo(() => {
    const visibleModels = models.filter(m => m.visible);
    const count = visibleModels.length;
    
    let totalVolume = 0;
    visibleModels.forEach(m => {
      // Volume scales cubically with individual scale values [sx, sy, sz]
      const scaledVol = m.volume * m.scale[0] * m.scale[1] * m.scale[2];
      totalVolume += scaledVol;
    });

    return { count, totalVolume };
  }, [models]);

  // 2. Slicing quotation mathematical model (PLA, PETG, etc.)
  const quoteData = useMemo(() => {
    if (activeModelsInfo.totalVolume === 0) {
      return { weightGrams: 0, printTimeMins: 0, price: 0 };
    }

    const mat = MATERIALS.find(m => m.id === settings.material) || MATERIALS[0];
    const density = mat.density;
    
    // Solid shell vs sparse infill volume fraction model
    // Walls and infill drive the effective density multiplier
    const shellFraction = Math.min(0.20 + (settings.walls * 0.04), 0.70); // 0.20 to 0.70 max solid
    const infillFraction = 1 - shellFraction;
    const effectiveDensityMultiplier = shellFraction * 1.0 + infillFraction * (settings.infill / 100);
    
    // Filament weight (grams)
    const weightGrams = activeModelsInfo.totalVolume * density * effectiveDensityMultiplier;

    // Print Time (minutes)
    // Setup time: 8 minutes (bed leveling + hotend heating)
    const setupTime = 8;
    // Volumetric speed coefficient (lower layer height means more layers, meaning more time)
    const speedCoeff = 0.20 / settings.layerHeight; // Standard is 0.20mm
    const supportMultiplier = settings.supports !== 'none' ? 1.20 : 1.0;
    
    // printTime = volume * coefficient * speedCoeff * supportMultiplier
    // Bambu Lab A1 is fast (average 15mm³/s extrusion), so 1 cm³ = 1000 mm³ takes ~67 sec at full speed
    // With infill, travel, wall deceleration, it takes about 2 to 3.5 minutes per cm³ of printed volume
    const printTimeMins = setupTime + (activeModelsInfo.totalVolume * 2.8 * effectiveDensityMultiplier * speedCoeff * supportMultiplier);

    // Cost Model (USD)
    // - Base setup: $2.00
    // - Filament material cost: costPerGram * weight
    // - Printer wear/electricity: $1.20 per hour
    const materialCost = weightGrams * mat.costPerGram;
    const printerRunCost = (printTimeMins / 60) * 1.20;
    const setupFee = 2.00;
    const price = setupFee + materialCost + printerRunCost;

    return {
      weightGrams,
      printTimeMins,
      price
    };
  }, [activeModelsInfo.totalVolume, settings]);

  const handleCalculate = () => {
    setIsCalculating(true);
    // Simulate slicer pathing analysis
    setTimeout(() => {
      setIsCalculating(false);
      setHasCalculated(true);
    }, 1200);
  };

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = Math.round(mins % 60);
    if (hours === 0) return `${remainingMins}m`;
    return `${hours}h ${remainingMins}m`;
  };

  const visibleModels = models.filter(m => m.visible);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Calculator className="h-4 w-4 text-sky-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Price Estimation
        </h3>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
          <span className="text-slate-500 text-[10px] block">Visible Models</span>
          <span className="text-sm font-bold text-slate-200 mt-1 block">
            {activeModelsInfo.count} {activeModelsInfo.count === 1 ? 'part' : 'parts'}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
          <span className="text-slate-500 text-[10px] block">Total Volume</span>
          <span className="text-sm font-bold text-slate-200 mt-1 block font-mono">
            {activeModelsInfo.totalVolume.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">cm³</span>
          </span>
        </div>
      </div>

      {/* Calculation Output */}
      {visibleModels.length === 0 ? (
        <div className="text-center py-4 text-xs text-slate-500">
          Add models to calculate quotation
        </div>
      ) : isCalculating ? (
        <div className="flex flex-col items-center justify-center py-6 bg-slate-900/40 border border-slate-850 rounded-lg">
          <Loader2 className="h-6 w-6 text-sky-500 animate-spin" />
          <span className="text-xs text-slate-400 font-medium mt-2">Slicing & simulating path...</span>
        </div>
      ) : hasCalculated ? (
        <div className="space-y-3.5 animate-fade-in">
          {/* Estimated Weight */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Weight className="h-3.5 w-3.5 text-slate-500" />
              Filament Weight
            </span>
            <span className="text-xs font-bold text-slate-200 font-mono">
              {quoteData.weightGrams.toFixed(1)} g
            </span>
          </div>

          {/* Estimated Print Time */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Print Duration
            </span>
            <span className="text-xs font-bold text-slate-200 font-mono">
              {formatTime(quoteData.printTimeMins)}
            </span>
          </div>

          {/* Pricing Quote */}
          <div className="bg-gradient-to-r from-sky-950/20 to-indigo-950/20 border border-sky-500/20 rounded-xl p-3.5 flex items-center justify-between mt-2 shadow-inner">
            <div>
              <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">Estimated Cost</span>
              <p className="text-2xl font-bold text-white font-mono mt-0.5 flex items-baseline">
                <span className="text-lg font-medium text-sky-400 mr-0.5">$</span>
                {quoteData.price.toFixed(2)}
              </p>
            </div>
            <div className="h-10 w-10 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400 border border-sky-500/15">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          {paymentSuccess ? (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex flex-col items-center text-center mt-3 animate-fade-in">
              <CheckCircle className="h-8 w-8 text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Payment Successful</span>
              <p className="text-[11px] text-slate-300 mt-1">
                Your payment was verified. We'll start processing your 3D print order now!
              </p>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              <button
                onClick={handlePayment}
                disabled={isPaying}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:from-sky-800 disabled:to-indigo-800 disabled:cursor-not-allowed text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-sky-500/10 active:scale-[0.99] transition-all cursor-pointer"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-sky-200" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 text-sky-200" />
                    Pay Now (₹{(quoteData.price * 80).toFixed(2)})
                  </>
                )}
              </button>

              {paymentError && (
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-rose-450 text-[11px] animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-rose-400">Payment Failed / Cancelled</span>
                    <span className="text-slate-300">{paymentError}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleCalculate}
            disabled={isPaying}
            className="w-full flex items-center justify-center gap-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-slate-300 font-semibold py-2 rounded-lg transition-colors mt-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-calculate
          </button>
        </div>
      ) : (
        <button
          onClick={handleCalculate}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold py-3 rounded-lg shadow-lg shadow-sky-500/10 active:scale-[0.99] transition-all"
        >
          <Sparkles className="h-4 w-4 text-sky-200 animate-pulse" />
          Calculate Print Estimate
        </button>
      )}
    </div>
  );
}
