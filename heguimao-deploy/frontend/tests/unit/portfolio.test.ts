import { describe, it, expect } from 'vitest';
import {
  getPortfolioProducts,
  addPortfolioProduct,
  deletePortfolioProduct,
  getExpiryAlerts,
  exportPortfolioCSV,
  STORAGE_KEY,
} from '../../src/lib/portfolio';

describe('Portfolio CRUD Operations', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('starts with empty portfolio', () => {
    const products = getPortfolioProducts();
    expect(products).toEqual([]);
  });

  it('adds a product to portfolio', () => {
    const product = addPortfolioProduct({
      name: 'Test Product',
      category: 'electronics',
      subcategory: 'audio',
      markets: ['US', 'EU'],
    });
    
    expect(product.name).toBe('Test Product');
    expect(product.category).toBe('electronics');
    expect(product.markets).toContain('US');
    expect(product.markets).toContain('EU');
    expect(product.complianceStatus).toBe('not-checked');
    expect(product.certifications).toEqual([]);
    expect(product.id).toBeDefined();
    expect(product.createdAt).toBeDefined();
    expect(product.updatedAt).toBeDefined();
  });

  it('persists products across reads', () => {
    addPortfolioProduct({
      name: 'Persistent Product',
      category: 'toys',
      markets: ['US'],
    });
    
    const products = getPortfolioProducts();
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Persistent Product');
  });

  it('deletes a product', () => {
    const added = addPortfolioProduct({
      name: 'To Delete',
      category: 'electronics',
      markets: ['US'],
    });
    
    expect(getPortfolioProducts()).toHaveLength(1);
    
    deletePortfolioProduct(added.id);
    expect(getPortfolioProducts()).toHaveLength(0);
  });

  it('handles multiple products', () => {
    addPortfolioProduct({ name: 'Product A', category: 'electronics', markets: ['US'] });
    addPortfolioProduct({ name: 'Product B', category: 'toys', markets: ['EU'] });
    
    const products = getPortfolioProducts();
    expect(products).toHaveLength(2);
    expect(products.find(p => p.name === 'Product A')).toBeDefined();
    expect(products.find(p => p.name === 'Product B')).toBeDefined();
  });
});

describe('Portfolio Alerts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns no alerts for empty portfolio', () => {
    const alerts = getExpiryAlerts(30);
    expect(alerts).toEqual([]);
  });

  it('returns no alerts when no certifications have expiry dates', () => {
    const product = addPortfolioProduct({
      name: 'Test',
      category: 'electronics',
      markets: ['US'],
    });
    
    // Manually add a product with a certification (simulating what would happen in real app)
    const products = getPortfolioProducts();
    const alerts = getExpiryAlerts(30);
    expect(alerts).toEqual([]);
  });
});

describe('Portfolio CSV Export', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exports CSV with header row', () => {
    const csv = exportPortfolioCSV();
    expect(csv).toContain('Product Name');
    expect(csv).toContain('Category');
    expect(csv).toContain('Markets');
  });

  it('exports CSV with product data', () => {
    addPortfolioProduct({
      name: 'Export Test',
      category: 'electronics',
      markets: ['US', 'EU'],
    });
    
    const csv = exportPortfolioCSV();
    expect(csv).toContain('Export Test');
    expect(csv).toContain('electronics');
  });
});
