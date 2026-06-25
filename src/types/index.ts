export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  category: string | null;
  inventory_quantity: number;
  sku: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  subtotal?: number;
  shipping_fee?: number;
  additional_fee?: number;
  platform_fee?: number;
  gst_amount?: number;
  custom_fields_total?: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant_name?: string | null;
  sku?: string | null;
  shipping_fee?: number;
  additional_fee?: number;
  platform_fee?: number;
  gst_amount?: number;
  custom_fields?: any;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_id: string;
  shipping_policy: string | null;
  refund_policy: string | null;
  privacy_policy: string | null;
  terms_conditions: string | null;
  primary_color: string;
  accent_color: string;
  font_family: string;
  updated_at: string;
}

export interface PaymentSettings {
  id: string;
  store_id: string;
  razorpay_key_id: string | null;
  razorpay_key_secret: string | null;
  is_connected: boolean;
  currency: string | null;
  test_mode: boolean | null;
  razorpay_webhook_secret: string | null;
  updated_at: string;
}

export interface ThemeSettings {
  id: string;
  store_id: string;
  sections: any;
  colors: any;
  typography: any;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  store_id: string;
  platform: string;
  url: string;
  created_at: string;
}

export interface Analytics {
  id: string;
  store_id: string;
  date: string;
  page_views: number;
  orders: number;
  revenue: number;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_plan: string;
  created_at: string;
  updated_at: string;
}

// Razorpay-related types
export interface RazorpayOrderResponse {
  order: Order;
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
  currency: string;
}

export interface RazorpayVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
  store_slug: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  message?: string;
  payment_id?: string;
  error?: string;
}