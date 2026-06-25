// ============================================
// EVENT SYSTEM TYPES
// ============================================

export interface EventStore {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  event_store_id: string;
  user_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  google_maps_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  refund_policy: string | null;
  terms: string | null;
  instructions: string | null;
  whatsapp_support: string | null;
  age_restriction: string | null;
  dress_code: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  posters?: EventPoster[];
  ticket_types?: EventTicketType[];
  store?: EventStore;
}

export interface EventPoster {
  id: string;
  event_id: string;
  image_url: string;
  display_order: number;
  is_main: boolean;
  created_at: string;
}

export interface EventTicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_total: number;
  quantity_sold: number;
  max_per_booking: number;
  sale_start: string | null;
  sale_end: string | null;
  is_active: boolean;
  created_at: string;
  // Computed
  available?: number;
}

export interface EventBooking {
  id: string;
  event_id: string;
  event_store_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  platform_fee: number;
  host_payout_amount: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  booking_status: "confirmed" | "cancelled" | "refunded";
  created_at: string;
  // Joined
  items?: EventBookingItem[];
  event?: Event;
  tickets?: EventTicket[];
}

export interface EventBookingItem {
  id: string;
  booking_id: string;
  ticket_type_id: string;
  ticket_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface EventTicket {
  id: string;
  booking_id: string;
  event_id: string;
  ticket_code: string;
  qr_code_url: string | null;
  attendee_name: string | null;
  ticket_type_name: string | null;
  status: "active" | "used" | "cancelled";
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

export interface EventPayout {
  id: string;
  event_id: string;
  event_store_id: string;
  gross_revenue: number;
  platform_commission: number;
  payout_amount: number;
  payout_status: "pending" | "scheduled" | "paid" | "on_hold";
  payout_due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateEventStoreForm {
  name: string;
  slug: string;
  description: string;
}

export interface CreateEventForm {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  address: string;
  city: string;
  google_maps_url: string;
  contact_email: string;
  contact_phone: string;
  refund_policy: string;
  terms: string;
  instructions: string;
  whatsapp_support: string;
  age_restriction: string;
  dress_code: string;
}

export interface TicketTypeFormData {
  name: string;
  description: string;
  price: number;
  quantity_total: number;
  max_per_booking: number;
  sale_start: string;
  sale_end: string;
}

export interface BookingFormData {
  ticket_type_id: string;
  quantity: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface EventDashboardStats {
  total_events: number;
  total_tickets_sold: number;
  total_revenue: number;
  total_attendees: number;
  upcoming_events: number;
}

export interface EventWithStats extends Event {
  tickets_sold: number;
  revenue: number;
  attendees: number;
}

export interface PublishChecklistItem {
  label: string;
  completed: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface SlugCheckResponse {
  available: boolean;
}

export interface PaymentOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  booking_id?: string;
  tickets?: EventTicket[];
}