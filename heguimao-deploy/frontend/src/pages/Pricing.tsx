import { useState, useEffect } from "react";
import { Check, X, Star, Crown, Zap, ArrowRight, CreditCard, Shield, Clock, HelpCircle, Download, Globe } from "lucide-react";
import { PLAN_CONFIG, upgradePlan, getSubscription, type PlanType, syncSubscriptionFromServer, upgradePlanOnServer } from "../lib/subscription";
import { logMonitor } from "../lib/monitor";

interface PaymentRecord {
  id: string;
  date: number;
  plan: PlanType;
  amount: number;
  status: "pending" | "completed" | "failed";
  method: string;
}

const PAYMENT_RECORD_KEY = "compliance_cat_payment_records";

export function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("basic");
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "stripe">("card");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const currentPlan = getSubscription().plan;

  // Load payment records and sync subscription on mount
  useEffect(() => {
    try {
      const data = localStorage.getItem(PAYMENT_RECORD_KEY);
      if (data) {
        setPaymentRecords(JSON.parse(data));
      }
    } catch (e) {
      console.error("Failed to load payment records", e);
    }
    // Sync subscription from server if user is logged in
    syncSubscriptionFromServer().catch(console.warn);
  }, []);

  const handleUpgrade = async (plan: PlanType) => {
    if (plan === currentPlan) {
      alert("You're already on this plan!");
      return;
    }

    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setProcessing(true);
    try {
      // Simulate payment processing (in production, integrate Stripe/PayPal)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Upgrade on server (source of truth)
      const serverOk = await upgradePlanOnServer(selectedPlan);
      if (!serverOk) {
        alert("Server upgrade failed. Please try again.");
        return;
      }
      
      // Also update local cache
      upgradePlan(selectedPlan);
      
      // Create payment record
      const record: PaymentRecord = {
        id: `pay_${Date.now()}`,
        date: Date.now(),
        plan: selectedPlan,
        amount: PLAN_CONFIG[selectedPlan].price,
        status: "completed",
        method: paymentMethod === "card" ? "Credit Card" : paymentMethod === "paypal" ? "PayPal" : "Stripe",
      };
      
      const newRecords = [record, ...paymentRecords];
      setPaymentRecords(newRecords);
      localStorage.setItem(PAYMENT_RECORD_KEY, JSON.stringify(newRecords));
      
      logMonitor({
        type: "success",
        category: "auth",
        message: `Payment completed: ${selectedPlan} plan`,
        details: { amount: PLAN_CONFIG[selectedPlan].price, method: paymentMethod },
      });
      
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccess(false);
      }, 2000);
    } catch (err) {
      logMonitor({
        type: "error",
        category: "auth",
        message: `Payment failed: ${(err as Error).message}`,
      });
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const plans = [
    {
      type: "free" as PlanType,
      name: "Free",
      price: 0,
      features: [
        "10 API calls/month",
        "5 reports/month",
        "Basic compliance check",
        "Community support",
      ],
      notPopular: true,
    },
    {
      type: "basic" as PlanType,
      name: "Basic",
      price: 9.99,
      features: [
        "100 API calls/month",
        "50 reports/month",
        "Advanced compliance check",
        "Priority email support",
        "Basic analytics",
      ],
      popular: true,
    },
    {
      type: "pro" as PlanType,
      name: "Pro",
      price: 29.99,
      features: [
        "1000 API calls/month",
        "500 reports/month",
        "Full compliance suite",
        "Export to CSV/PDF",
        "Priority phone support",
        "Advanced analytics",
        "Custom compliance templates",
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h1>
        <p className="text-lg text-slate-400">Start free, upgrade when you need more</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.type}
            className={`relative rounded-2xl border p-8 transition-all hover:scale-105 ${
              plan.popular
                ? "border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-transparent"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                {plan.type === "free" && <Zap className="h-6 w-6 text-slate-400" />}
                {plan.type === "basic" && <Star className="h-6 w-6 text-blue-400" />}
                {plan.type === "pro" && <Crown className="h-6 w-6 text-yellow-400" />}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                ${plan.price}
                <span className="text-lg font-normal text-slate-400">/month</span>
              </div>
              {plan.price === 0 && (
                <span className="text-sm text-slate-400">Free forever</span>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.type)}
              disabled={processing || plan.type === currentPlan}
              className={`w-full py-3 px-4 rounded-xl font-medium transition ${
                plan.type === currentPlan
                  ? "bg-green-600/20 text-green-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {plan.type === currentPlan ? "Current Plan" : processing ? "Processing..." : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Payment History */}
      <div className="mt-12">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-white hover:text-blue-400 transition"
        >
          <Clock className="h-4 w-4" />
          Payment History ({paymentRecords.length})
        </button>
        
        {showHistory && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <h3 className="text-sm font-semibold text-white">Recent Payments</h3>
            </div>
            <div className="divide-y divide-white/5">
              {paymentRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No payment records yet
                </div>
              ) : (
                paymentRecords.map((record) => (
                  <div key={record.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">{PLAN_CONFIG[record.plan].name} Plan</div>
                      <div className="text-xs text-slate-400">
                        {new Date(record.date).toLocaleDateString()} • {record.method}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">${record.amount}</div>
                      <div className={`text-xs ${record.status === "completed" ? "text-green-400" : "text-red-400"}`}>
                        {record.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-white">Can I cancel my subscription?</h4>
              <p className="text-sm text-slate-400 mt-1">Yes, you can cancel anytime. Your plan will remain active until the end of the billing period.</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">What happens when I reach my limit?</h4>
              <p className="text-sm text-slate-400 mt-1">You'll be notified when you're close to your limit. You can upgrade to a higher plan or wait for the next month.</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">Is there a refund policy?</h4>
              <p className="text-sm text-slate-400 mt-1">Yes, we offer a 30-day money-back guarantee for all paid plans.</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Security & Privacy</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-sm text-slate-300">All payments are encrypted and secure</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-slate-300">We support major credit cards and digital wallets</span>
            </div>
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-slate-300">Need help? Contact our support team</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Complete Payment</h3>
            
            <div className="mb-6">
              <div className="text-sm text-slate-400 mb-2">Selected Plan</div>
              <div className="text-lg font-medium text-white">{PLAN_CONFIG[selectedPlan].name} - ${PLAN_CONFIG[selectedPlan].price}/month</div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-slate-400 mb-2">Payment Method</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 rounded-xl border text-sm ${
                    paymentMethod === "card"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  Credit Card
                </button>
                <button
                  onClick={() => setPaymentMethod("paypal")}
                  className={`p-3 rounded-xl border text-sm ${
                    paymentMethod === "paypal"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  PayPal
                </button>
                <button
                  onClick={() => setPaymentMethod("stripe")}
                  className={`p-3 rounded-xl border text-sm ${
                    paymentMethod === "stripe"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  Stripe
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={processing}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {processing ? "Processing..." : `Pay $${PLAN_CONFIG[selectedPlan].price}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl border border-green-500/50 p-8 max-w-sm w-full text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
            <p className="text-slate-400">Your subscription has been upgraded to {PLAN_CONFIG[selectedPlan].name} plan.</p>
          </div>
        </div>
      )}
    </div>
  );
}
