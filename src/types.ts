export interface EventConfig {
  id: string;
  name: string;
  slug: string;
  timer: number;
  shotCount: number;
  allowRetake: boolean;
  pricing: number;
  qrisEnabled: boolean;
  googleDriveFolderId?: string;
  createdAt: any;
}

export interface PhotoTemplate {
  id: string;
  name: string;
  imageUrl: string;
  eventId: string;
}

export interface Session {
  id: string;
  eventId: string;
  photos: string[];
  enhancedPhotos?: string[];
  templateId?: string;
  paymentStatus: 'pending' | 'paid' | 'free';
  paymentId?: string;
  createdAt: any;
}

export interface PrintJob {
  id: string;
  sessionId: string;
  status: 'queued' | 'printing' | 'completed' | 'failed';
  imageUrl: string;
  createdAt: any;
}

export type BoothState = 
  | 'idle' 
  | 'payment' 
  | 'template_selection' 
  | 'countdown' 
  | 'capture' 
  | 'review_shot'
  | 'review' 
  | 'enhancing' 
  | 'summary';
