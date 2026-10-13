import { get, post, put, del } from './client';
import type { Product, PaginatedResponse, ProductImageInput } from '../types';

/** Payload accepted by the create/update product endpoints. */
export interface ProductPayload {
  name: string;
  /** Unique within the company. Required. */
  sku: string;
  /** Optional EAN/UPC code; unique within the company when set. */
  barcode?: string;
  description?: string;
  price?: number;
  low_stock_threshold?: number;
  images?: ProductImageInput[];
}

export const productsApi = {
  list: (pageIndex = 1, pageSize = 20, search?: string) => {
    const query = new URLSearchParams({
      page_index: String(pageIndex),
      page_size: String(pageSize),
    });
    if (search) query.set('search', search);
    return get<PaginatedResponse<Product>>(`/products?${query.toString()}`);
  },

  getById: (id: string) =>
    get<Product>(`/products/${id}`),

  /** Resolves a scanned code (SKU or barcode) to a single product. */
  scan: (code: string) =>
    get<Product>(`/products/scan?code=${encodeURIComponent(code)}`),

  create: (data: ProductPayload) =>
    post<Product>('/products', data),

  update: (id: string, data: ProductPayload) =>
    put<Product>(`/products/${id}`, data),

  delete: (id: string) =>
    del(`/products/${id}`),
};
