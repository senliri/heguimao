// Product Portfolio Store — localStorage-based product management
// Used in: src/pages/Portfolio.tsx

export interface PortfolioProduct {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  markets: string[];
  complianceStatus: "compliant" | "in-progress" | "not-checked";
  certifications: Certification[];
  createdAt: number;
  updatedAt: number;
}

export interface Certification {
  name: string;
  status: "pending" | "in-progress" | "completed" | "expired";
  issuedDate: string;
  expiryDate: string;
  lab: string;
  certificateNumber: string;
}

const STORAGE_KEY = "compliance-cat-portfolio";

function loadProducts(): PortfolioProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProducts(products: PortfolioProduct[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error("Portfolio: localStorage write failed", e);
  }
}

export function getPortfolioProducts(): PortfolioProduct[] {
  return loadProducts();
}

export function addPortfolioProduct(product: Omit<PortfolioProduct, "id" | "certifications" | "createdAt" | "updatedAt">): PortfolioProduct {
  const products = loadProducts();
  const newProduct: PortfolioProduct = {
    ...product,
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    certifications: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updatePortfolioProduct(id: string, updates: Partial<PortfolioProduct>): PortfolioProduct | null {
  const products = loadProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates, updatedAt: Date.now() };
  saveProducts(products);
  return products[idx];
}

export function deletePortfolioProduct(id: string): boolean {
  const products = loadProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  saveProducts(filtered);
  return true;
}

export function addCertification(productId: string, cert: Certification): PortfolioProduct | null {
  const products = loadProducts();
  const idx = products.findIndex(p => p.id === productId);
  if (idx === -1) return null;
  products[idx].certifications.push(cert);
  products[idx].updatedAt = Date.now();
  // Auto-update compliance status
  if (products[idx].complianceStatus === "not-checked") {
    products[idx].complianceStatus = "in-progress";
  }
  saveProducts(products);
  return products[idx];
}

export function removeCertification(productId: string, certIndex: number): PortfolioProduct | null {
  const products = loadProducts();
  const idx = products.findIndex(p => p.id === productId);
  if (idx === -1) return null;
  products[idx].certifications.splice(certIndex, 1);
  products[idx].updatedAt = Date.now();
  saveProducts(products);
  return products[idx];
}

// Check for expiring certificates and return alerts
export function getExpiryAlerts(daysAhead: number = 30): Array<{ product: PortfolioProduct; cert: Certification; daysLeft: number }> {
  const products = loadProducts();
  const now = new Date();
  const alerts: Array<{ product: PortfolioProduct; cert: Certification; daysLeft: number }> = [];
  
  for (const product of products) {
    for (const cert of product.certifications) {
      if (!cert.expiryDate || cert.status !== "completed") continue;
      const expiry = new Date(cert.expiryDate);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= daysAhead && daysLeft > -365) {
        alerts.push({ product, cert, daysLeft });
      }
    }
  }
  
  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

// Export all portfolio data as CSV
export function exportPortfolioCSV(): string {
  const products = loadProducts();
  const headers = ["Product Name", "Category", "Subcategory", "Markets", "Status", "Certifications", "Created"];
  const rows = products.map(p => [
    `"${p.name}"`,
    `"${p.category}"`,
    `"${p.subcategory}"`,
    `"${p.markets.join(', ')}"`,
    p.complianceStatus,
    `"${p.certifications.map(c => c.name).join('; ')}"`,
    new Date(p.createdAt).toLocaleDateString("en-US"),
  ]);
  
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
