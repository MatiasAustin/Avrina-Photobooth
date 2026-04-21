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
  created_at: string;
}

export interface PhotoTemplate {
  id: string;
  event_id: string;
  name: string;
  image_url: string;
  created_at: string;
}

export interface Session {
  id: string;
  event_id: string;
  photos: string[] | string; // JSONB
  template_id?: string;
  payment_status: 'pending' | 'paid' | 'free';
  payment_id?: string;
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
