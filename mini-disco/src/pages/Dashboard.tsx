import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Package, Search, Filter, Download, BarChart3, TrendingUp, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getPortfolioProducts, exportPortfolioCSV, PortfolioProduct } from "../lib/portfolio";

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMarket, setFilterMarket] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const products = useMemo(() => getPortfolioProducts(), []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (filterMarket !== "all") {
      result = result.filter(p => p.markets.includes(filterMarket));
    }
    if (filterStatus !== "all") {
      result = result.filter(p => p.complianceStatus === filterStatus);
    }
    return result;
  }, [products, searchQuery, filterMarket, filterStatus]);

  // Compute dashboard stats
  const stats = useMemo(() => {
    const total = products.length;
    const compliant = products.filter(p => p.complianceStatus === "compliant").length;
    const inProgress = products.filter(p => p.complianceStatus === "in-progress").length;
    const notChecked = products.filter(p => p.complianceStatus === "not-checked").length;

    // Market breakdown
    const marketStats: Record<string, { total: number; compliant: number }> = {};
    products.forEach(p => {
      p.markets.forEach(m => {
        if (!marketStats[m]) marketStats[m] = { total: 0, compliant: 0 };
        marketStats[m].total++;
        if (p.complianceStatus === "compliant") marketStats[m].compliant++;
      });
    });

    // Category breakdown
    const categoryStats: Record<string, number> = {};
    products.forEach(p => {
      categoryStats[p.category] = (categoryStats[p.category] || 0) + 1;
    });

    // Certificates summary
    let totalCerts = 0;
    let completedCerts = 0;
    let expiredCerts = 0;
    products.forEach(p => {
      p.certifications.forEach(c => {
        totalCerts++;
        if (c.status === "completed") completedCerts++;
        if (c.status === "expired") expiredCerts++;
      });
    });

    return { total, compliant, inProgress, notChecked, marketStats, categoryStats, totalCerts, completedCerts, expiredCerts };
  }, [products]);

  const exportCSV = () => {
    const csv = exportPortfolioCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-dashboard-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDetailedCSV = () => {
    // Export with full certification details per product per market
    const rows: string[][] = [["Product", "Category", "Market", "Status", "Certification", "Lab", "Issue Date", "Expiry Date", "Certificate #", "Cert Status"]];
    products.forEach(p => {
      p.markets.forEach(m => {
        if (p.certifications.length === 0) {
          rows.push([p.name, p.category, m, p.complianceStatus, "—", "—", "—", "—", "—", "Not Checked"]);
        } else {
          p.certifications.forEach(c => {
            rows.push([p.name, p.category, m, p.complianceStatus, c.name, c.lab || "—", c.issuedDate || "—", c.expiryDate || "—", c.certificateNumber || "—", c.status]);
          });
        }
      });
    });
    const csv = [rows[0].join(","), ...rows.slice(1).map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-detailed-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const complianceRate = stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0;

  return (
    <div>
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-slate-200">Compliance Dashboard</span>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Full compliance matrix across all products and markets</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:text-white transition">
              <Download className="h-4 w-4" />
              Quick Export
            </button>
            <button onClick={exportDetailedCSV} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
              <Download className="h-4 w-4" />
              Detailed Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="text-xs text-slate-400 mt-1">Products Tracked</div>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div className="text-2xl font-bold text-green-400">{stats.compliant}</div>
            </div>
            <div className="text-xs text-slate-400 mt-1">Fully Compliant</div>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
            </div>
            <div className="text-xs text-slate-400 mt-1">In Progress</div>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-400" />
              <div className="text-2xl font-bold text-orange-400">{complianceRate}%</div>
            </div>
            <div className="text-xs text-slate-400 mt-1">Compliance Rate</div>
          </div>
        </div>

        {/* Compliance Rate Progress Bar */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Overall Compliance Progress</span>
            <span className="text-sm font-bold text-white">{stats.compliant}/{stats.total}</span>
          </div>
          <div className="h-3 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all" style={{ width: `${stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Market Breakdown */}
        {Object.keys(stats.marketStats).length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Market Compliance</h3>
              <div className="space-y-2">
                {Object.entries(stats.marketStats).map(([market, data]) => {
                  const rate = Math.round((data.compliant / data.total) * 100);
                  return (
                    <div key={market}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">{market}</span>
                        <span className="text-slate-400">{data.compliant}/{data.total} ({rate}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Category Distribution</h3>
              <div className="space-y-2">
                {Object.entries(stats.categoryStats).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 capitalize">{cat}</span>
                    <span className="text-slate-400">{count} product{count > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Certificate Summary */}
        {stats.totalCerts > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.totalCerts}</div>
              <div className="text-xs text-slate-400">Total Certificates</div>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="text-2xl font-bold text-green-400">{stats.completedCerts}</div>
              <div className="text-xs text-slate-400">Completed</div>
            </div>
            {stats.expiredCerts > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="text-2xl font-bold text-red-400">{stats.expiredCerts}</div>
                <div className="text-xs text-slate-400">Expired</div>
              </div>
            )}
          </div>
        )}

        {/* Search & Filter */}
        <div className="mt-6 flex gap-2 flex-wrap">
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
            value={filterMarket}
            onChange={(e) => setFilterMarket(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value="all">All Markets</option>
            <option value="US">US</option>
            <option value="EU">EU</option>
            <option value="UK">UK</option>
            <option value="JP">JP</option>
            <option value="CA">CA</option>
            <option value="AU">AU</option>
          </select>
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
        </div>

        {/* Compliance Matrix Table */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Compliance Matrix</h3>
            <p className="text-xs text-slate-400 mt-0.5">Showing {filteredProducts.length} of {products.length} products</p>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-slate-500" />
              <p className="text-sm text-slate-400 mt-2">No products match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Markets</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Certificates</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map((product) => {
                    const statusMap = {
                      compliant: { emoji: "🟢", label: "Compliant", color: "text-green-400" },
                      "in-progress": { emoji: "🟡", label: "In Progress", color: "text-yellow-400" },
                      "not-checked": { emoji: "🔴", label: "Not Checked", color: "text-red-400" },
                    };
                    const status = statusMap[product.complianceStatus] || statusMap["not-checked"];
                    return (
                      <tr key={product.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white text-sm">{product.name}</div>
                          {product.subcategory && (
                            <div className="text-xs text-slate-500">{product.subcategory}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm capitalize">{product.category}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {product.markets.map(m => (
                              <span key={m} className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-300">{m}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${status.color}`}>
                            {status.emoji} {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {product.certifications.length > 0 ? (
                            <div className="space-y-0.5">
                              {product.certifications.slice(0, 2).map((c, i) => (
                                <div key={i} className="text-xs">• {c.name}</div>
                              ))}
                              {product.certifications.length > 2 && (
                                <div className="text-xs text-slate-500">+{product.certifications.length - 2} more</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/report?product=${encodeURIComponent(product.name)}`}
                            className="text-xs text-blue-400 hover:text-blue-300 transition"
                          >
                            Check →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {products.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">Start by adding products to your portfolio</p>
            <Link to="/portfolio">
              <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
                Go to Portfolio
              </button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}