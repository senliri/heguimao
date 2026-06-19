import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Plus, Trash2, Search, Filter, Download, Clock, AlertCircle, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Bell, OctagonAlert, Hourglass } from "lucide-react";
import { getPortfolioProducts, deletePortfolioProduct, addPortfolioProduct, PortfolioProduct, Certification, addCertification, getExpiryAlerts } from "../lib/portfolio";

export function Portfolio() {
  const [products, setProducts] = useState<PortfolioProduct[]>(getPortfolioProducts());
  const [expiryAlerts, setExpiryAlerts] = useState<Array<{ product: PortfolioProduct; cert: Certification; daysLeft: number }>>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "updated">("updated");

  // Check expiry alerts on mount and every minute
  useEffect(() => {
    const checkAlerts = () => {
      const alerts = getExpiryAlerts(30).filter(a => !dismissedAlerts.has(`${a.product.id}-${a.cert.name}`));
      setExpiryAlerts(alerts);
    };
    checkAlerts();
    const interval = setInterval(checkAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [dismissedAlerts]);

  const dismissAlert = (productId: string, certName: string) => {
    setDismissedAlerts(prev => new Set(prev).add(`${productId}-${certName}`));
  };

  // Add product form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("electronics");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newMarkets, setNewMarkets] = useState<string[]>([]);

  // Certificate form
  const [certName, setCertName] = useState("");
  const [certLab, setCertLab] = useState("");
  const [certIssued, setCertIssued] = useState("");
  const [certExpiry, setCertExpiry] = useState("");
  const [certNumber, setCertNumber] = useState("");

  const toggleMarket = (market: string) => {
    setNewMarkets(prev => prev.includes(market) ? prev.filter(m => m !== market) : [...prev, market]);
  };

  const handleAddProduct = () => {
    if (!newName.trim()) return;
    const newProduct = addPortfolioProduct({
      name: newName,
      category: newCategory,
      subcategory: newSubcategory,
      markets: newMarkets,
      complianceStatus: "not-checked",
    });
    setProducts(getPortfolioProducts());
    setShowAddModal(false);
    setNewName("");
    setNewCategory("electronics");
    setNewSubcategory("");
    setNewMarkets([]);
  };

  const handleAddCertification = (productId: string) => {
    if (!certName.trim()) return;
    const cert: Certification = {
      name: certName,
      status: certExpiry ? "completed" : "pending",
      issuedDate: certIssued,
      expiryDate: certExpiry,
      lab: certLab,
      certificateNumber: certNumber,
    };
    addCertification(productId, cert);
    setProducts(getPortfolioProducts());
    setShowCertModal(null);
    setCertName("");
    setCertLab("");
    setCertIssued("");
    setCertExpiry("");
    setCertNumber("");
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this product and all its data?")) return;
    deletePortfolioProduct(id);
    setProducts(getPortfolioProducts());
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => (p.name||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q) || (p.subcategory||'').toLowerCase().includes(q));
    }
    
    if (filterStatus !== "all") {
      result = result.filter(p => p.complianceStatus === filterStatus);
    }
    
    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.updatedAt - a.updatedAt;
    });
    
    return result;
  }, [products, searchQuery, filterStatus, sortBy]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return { color: "bg-green-500/10 text-green-400 border-green-500/20", icon: "🟢", label: "Compliant" };
      case "in-progress":
        return { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: "🟡", label: "In Progress" };
      case "not-checked":
        return { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: "🔴", label: "Not Checked" };
      default:
        return { color: "bg-slate-500/10 text-slate-400", icon: "⚪", label: status };
    }
  };

  const certStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return "✅";
      case "in-progress": return "🔄";
      case "pending": return "⏳";
      case "expired": return "❌";
      default: return "⚪";
    }
  };

  const stats = {
    total: products.length,
    compliant: products.filter(p => p.complianceStatus === "compliant").length,
    inProgress: products.filter(p => p.complianceStatus === "in-progress").length,
    notChecked: products.filter(p => p.complianceStatus === "not-checked").length,
  };

  return (
    <div>
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-slate-200">Product Portfolio</span>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Product Portfolio</h1>
            <p className="mt-1 text-sm text-slate-400">Manage all your products and track compliance status across markets</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const { exportPortfolioCSV } = require("../lib/portfolio");
                const csv = exportPortfolioCSV();
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `compliance-portfolio-${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:text-white transition"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Expiry Alerts Banner */}
        {expiryAlerts.length > 0 && (
          <div className="mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-orange-300">Certificate Expiry Alerts</h3>
                  <div className="mt-2 space-y-1">
                    {expiryAlerts.slice(0, 3).map((alert) => {
                      const daysText = alert.daysLeft > 0 
                        ? `${alert.daysLeft} days remaining`
                        : `Expired ${Math.abs(alert.daysLeft)} days ago`;
                      return (
                        <div key={`${alert.product.id}-${alert.cert.name}`} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">
                            <span className="font-medium text-white">{alert.product.name}</span> — {alert.cert.name}: {daysText}
                          </span>
                          <button
                            onClick={() => dismissAlert(alert.product.id, alert.cert.name)}
                            className="text-slate-500 hover:text-white transition ml-2"
                          >✕</button>
                        </div>
                      );
                    })}
                  </div>
                  {expiryAlerts.length > 3 && (
                    <div className="text-xs text-slate-500 mt-1">+{expiryAlerts.length - 3} more alerts</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-slate-400">Total Products</div>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <div className="text-2xl font-bold text-green-400">{stats.compliant}</div>
            <div className="text-xs text-slate-400">Compliant</div>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
            <div className="text-xs text-slate-400">In Progress</div>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="text-2xl font-bold text-red-400">{stats.notChecked}</div>
            <div className="text-xs text-slate-400">Not Checked</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 text-sm"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value="all">All Status</option>
            <option value="compliant">🟢 Compliant</option>
            <option value="in-progress">🟡 In Progress</option>
            <option value="not-checked">🔴 Not Checked</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "updated")}
            className="rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value="updated">Sort: Latest</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-500" />
            <h3 className="mt-4 text-lg font-medium text-slate-300">{searchQuery ? "No products match your search" : "No Products Yet"}</h3>
            <p className="mt-2 text-sm text-slate-500">{searchQuery ? "Try a different search term" : "Add your first product to start tracking compliance"}</p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const badge = statusBadge(product.complianceStatus);
              return (
                <div key={product.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">{product.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{product.category}{product.subcategory ? ` / ${product.subcategory}` : ""}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${badge.color}`}>
                      {badge.icon} {badge.label}
                    </span>
                  </div>

                  {(product.markets || []).length > 0 && (
                    <div className="mt-3 flex gap-1 flex-wrap">
                      {(product.markets || []).map(m => (
                        <span key={m} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">{m.toUpperCase()}</span>
                      ))}
                    </div>
                  )}

                  {(product.certifications || []).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {(product.certifications || []).slice(0, 3).map((cert, i) => {
                        let expiryBadge = null;
                        if (cert.status === "completed" && cert.expiryDate) {
                          const daysLeft = Math.ceil((new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          if (daysLeft < 0) {
                            expiryBadge = <span className="text-red-400 ml-1">⚠ Expired</span>;
                          } else if (daysLeft <= 30) {
                            expiryBadge = <span className="text-yellow-400 ml-1">⏰ {daysLeft}d</span>;
                          } else {
                            expiryBadge = <span className="text-green-400 ml-1">✓ {daysLeft}d</span>;
                          }
                        }
                        return (
                          <div key={i} className="flex items-center gap-1 text-xs text-slate-400">
                            <span>{certStatusIcon(cert.status)}</span>
                            <span>{cert.name}</span>
                            {cert.expiryDate && (
                              <span className="text-slate-500">— {cert.expiryDate}</span>
                            )}
                            {expiryBadge}
                          </div>
                        );
                      })}
                      {product.certifications.length > 3 && (
                        <div className="text-xs text-slate-500">+{product.certifications.length - 3} more</div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-xs text-slate-500">{new Date(product.updatedAt).toLocaleDateString("en-US")}</span>
                    <div className="flex gap-1">
                      <Link
                        to={`/report?product=${encodeURIComponent(product.name)}`}
                        className="rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 text-xs font-medium transition"
                      >
                        Check
                      </Link>
                      <button
                        onClick={() => { setShowCertModal(product.id); setCertName(""); setCertLab(""); setCertIssued(""); setCertExpiry(""); setCertNumber(""); }}
                        className="rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 px-3 py-1.5 text-xs transition"
                      >
                        Cert
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="rounded-lg bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 text-xs transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">Add Product</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bluetooth Speaker Model X"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white outline-none focus:border-blue-500/50"
                >
                  <option value="electronics">Electronics</option>
                  <option value="toys">Toys</option>
                  <option value="baby">Baby & Kids</option>
                  <option value="clothing">Clothing & Accessories</option>
                  <option value="beauty">Beauty</option>
                  <option value="home">Home & Kitchen</option>
                  <option value="sports">Sports & Outdoors</option>
                  <option value="auto">Auto Parts</option>
                  <option value="office">Office Supplies</option>
                  <option value="pet">Pet Supplies</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="health">Health & Medical</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Subcategory (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. headphones, power bank, silicone spoon"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Target Markets</label>
                <div className="flex gap-2 flex-wrap">
                  {["US", "EU", "UK", "JP", "CA", "AU"].map(m => (
                    <button
                      key={m}
                      onClick={() => toggleMarket(m)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        newMarkets.includes(m)
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={!newName.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Certification Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">Add Certificate</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Certificate Name *</label>
                <input
                  type="text"
                  placeholder="e.g. FCC Certification"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Lab / Issuing Body</label>
                <input
                  type="text"
                  placeholder="e.g. SGS, TÜV, Intertek, CTI"
                  value={certLab}
                  onChange={(e) => setCertLab(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Issue Date</label>
                  <input
                    type="date"
                    value={certIssued}
                    onChange={(e) => setCertIssued(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Expiry Date</label>
                  <input
                    type="date"
                    value={certExpiry}
                    onChange={(e) => setCertExpiry(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Certificate Number</label>
                <input
                  type="text"
                  placeholder="e.g. FCC-ID: 2A2XB-BT01"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => setShowCertModal(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddCertification(showCertModal)}
                disabled={!certName.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                Add Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}