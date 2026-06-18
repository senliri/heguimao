import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Globe, CheckCircle, ArrowRight } from "lucide-react";
import { productCategories, subCategories, markets } from "../data/site";

export function Market() {
  const [searchParams] = useSearchParams();
  const catId = searchParams.get("cat") || "";
  const subId = searchParams.get("sub") || "";
  const selectedMarket = searchParams.get("market") || "";

  const category = productCategories.find((c) => c.id === catId);
  const sub = subCategories[catId]?.find((s) => s.id === subId);

  return (
    <div>
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link to={catId ? `/category?cat=${catId}` : "/"} className="hover:text-white">{category?.label || "Category"}</Link>
          <span>/</span>
          <span className="text-slate-200">Select Market</span>
        </div>
        <Link to={catId ? `/category?cat=${catId}` : "/"} className="mt-4 inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Category
        </Link>
      </section>

      {(category || sub) && (
        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-400">Selected:</span>
              {category && <span className="rounded-lg bg-blue-600/20 px-3 py-1 text-blue-300">{category.icon} {category.label}</span>}
              {sub && <span className="rounded-lg bg-blue-600/20 px-3 py-1 text-blue-300">{sub.label}</span>}
              {!category && !sub && <span className="text-slate-400">No category selected, using general compliance data</span>}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" />
          <h1 className="text-2xl font-bold">Select Target Market</h1>
        </div>
        <p className="mt-1 text-sm text-slate-400">Perform targeted compliance checks based on each market's regulatory requirements</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((m) => {
            const isSelected = selectedMarket === m.id;
            return (
              <Link
                key={m.id}
                to={`/report?market=${m.id}&cat=${catId}&sub=${subId}`}
                className={`rounded-2xl border p-5 transition ${isSelected ? "border-blue-500 bg-blue-600/10" : "border-white/10 bg-white/[0.03] hover:border-blue-500/40 hover:bg-white/10"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{m.flag}</span>
                  {isSelected && <CheckCircle className="h-5 w-5 text-blue-400" />}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{m.label}</h3>
                <p className="mt-1 text-sm text-slate-400">{m.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm text-blue-400">
                  View compliance report <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
          <p className="text-sm text-slate-400">Not sure about your target market?</p>
          <Link to="/report" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-400 transition hover:text-blue-300">
            Use general compliance data <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
