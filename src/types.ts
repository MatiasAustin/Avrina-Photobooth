export interface EventConfig {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  timer: number;
  shot_count: number;
  price: number;
  qris_enabled: boolean;
  is_active: boolean;
  session_timeout: number; // in minutes
  qris_image_url?: string;
  camera_filter?: string;
  is_mirrored?: boolean;
  created_at: string;
}

export interface PhotoTemplate {
  id: string;
  user_id: string;
  event_id?: string;
  name: string;
  image_url: string;
  category?: string;
  slot_count: number;
  created_at: string;
}

export interface Session {
  id: string;
  event_id: string;
  photos: string[] | string; // JSONB
  template_id?: string;
  payment_status: 'pending' | 'paid' | 'free' | 'cancelled';
  payment_id?: string;
  final_photo_url?: string;
  customer_phone?: string;
  created_at: string;
}

export interface PrintJob {
  id: string;
  session_id: string;
  status: 'queued' | 'printing' | 'completed' | 'failed';
  image_url: string;
  created_at: string;
}

export type BoothState = 
  | 'idle' 
  | 'payment' 
  | 'template_selection' 
  | 'countdown' 
  | 'capture' 
  | 'review_shot'
  | 'review' 
  | 'summary';
