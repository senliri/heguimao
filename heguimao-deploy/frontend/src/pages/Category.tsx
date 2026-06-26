import { t } from "../lib/i18n.js";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { productCategories, subCategories } from "../data/site";

export function Category() {
  const [searchParams] = useSearchParams();
  const catId = searchParams.get("cat") || "";
  const category = productCategories.find((c) => c.id === catId);
  const subs = subCategories[catId] || [];

  return (
    <div>
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-white">{t("site.nav_category")}</Link>
          <span>/</span>
          <span className="text-slate-200">{category?.label ? t(`site.category_${category.id}`) : t("category.not_found")}</span>
        </div>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          {t("category.back_to_categories")}
        </Link>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{category?.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{category?.label ? t(`site.category_${category.id}`) : t("category.not_found")}</h1>
              <p className="mt-1 text-sm text-slate-400">{t("category.select_specific_type")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t("category.subcategories")}</h2>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-slate-400">
            {subs.length} items
          </span>
        </div>

        {subs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-slate-500" />
            <p className="mt-3 text-slate-400">{t("category.data_being_updated")}</p>
            <Link to="/market" className="mt-4 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-5 py-2 text-sm text-white transition hover:bg-blue-700">
              {t("category.skip_default_data")}
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {subs.map((sub) => (
              <Link
                key={sub.id}
                to={`/market?cat=${catId}&sub=${sub.id}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-blue-500/40 hover:bg-white/10"
              >
                <span className="text-sm font-medium text-slate-200">{t(`site.sub_${sub.id}`)}</span>
                <CheckCircle className="h-5 w-5 shrink-0 text-slate-600" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <h3 className="font-semibold text-amber-300">{t("category.tip")}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {t("category.subcategory_tip")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
