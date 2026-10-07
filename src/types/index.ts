export interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Image payload sent when creating or updating a product. */
export interface ProductImageInput {
  url: string;
  is_primary: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  description: string;
  /** URL of the primary image (falls back to the first image). */
  image_url?: string;
  images?: ProductImage[];
  price: number;
  /** Quantity below which the product is flagged as low stock. 0 disables monitoring. */
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Inventory {
  id: string;
  company_id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Stock {
  id: string;
  company_id: string;
  inventory_id: string;
  product_id: string;
  product_name?: string;
  product_image_url?: string;
  inventory_name?: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page_index: number;
  page_size: number;
}

// --- Dashboard types ---

export interface DashboardCounts {
  total_value: number;
  active_products: number;
  locations_count: number;
  low_stock: number;
}

export interface DashboardLocation {
  id: string;
  name: string;
  lat: string;
  long: string;
}

export interface LowStockItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  inventory_name: string;
  quantity: number;
  /** The product's low stock threshold at the time of the query. */
  threshold: number;
  /** True when the product has no stock entries at all (none of its inventories hold it). */
  no_stock: boolean;
  /** StockStatus from the API; always 0 (low) for items in this list. */
  stats: number;
}

export interface DashboardData {
  counts: DashboardCounts;
  inventories: DashboardLocation[];
  stocks: LowStockItem[];
}

// --- Auth types ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  company_name: string;
  company_phone: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  /** Access token lifetime in seconds. */
  expires_in: number;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  is_root: boolean;
  is_active: boolean;
  role_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDto {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  is_root: boolean;
  is_active: boolean;
  role_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- Role types ---

export interface PermissionResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissionsResponse {
  id: string;
  name: string;
  description: string;
  user_count: number;
  permissions: PermissionResponse[];
  created_at: string;
  updated_at: string;
}

export interface ClaimsResponse {
  user_id: string;
  company_id: string;
  company_name: string;
  company_status: string;
  is_root: boolean;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

// --- Platform (operator) types ---

export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface CompanyDto {
  id: string;
  name: string;
  slug: string;
  phone: string;
  status: CompanyStatus;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  root_user_id?: string;
  root_user_name?: string;
  root_user_email?: string;
  root_user_phone?: string;
}

export interface PlatformCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

export interface PlatformDashboardData {
  counts: PlatformCounts;
  pending: CompanyDto[];
}

export interface PlatformUserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformLoginRequest {
  email: string;
  password: string;
}

export interface PlatformLoginResponse {
  token: string;
  expires_in: number;
  user: PlatformUserResponse;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
}

export interface CreatePermissionRequest {
  code: string;
  name: string;
  description: string;
}
