export type Service = {
  id: string;
  slug: string;
  title: string;
  title_en?: string | null;
  summary: string;
  summary_en?: string | null;
  description: string;
  description_en?: string | null;
  icon: string;
  image_url: string | null;
  features: string[];
  features_en?: string[] | null;
  content?: string;
  content_en?: string | null;
  meta_title?: string | null;
  meta_title_en?: string | null;
  meta_description?: string | null;
  meta_description_en?: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  title_en?: string | null;
  client: string | null;
  service_id: string | null;
  summary: string;
  summary_en?: string | null;
  description: string;
  description_en?: string | null;
  cover_url: string | null;
  link_url: string | null;
  tags: string[];
  tags_en?: string[] | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  services?: { title: string; title_en?: string | null; slug: string } | null;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  title_en?: string | null;
  excerpt: string;
  excerpt_en?: string | null;
  content: string;
  content_en?: string | null;
  cover_url: string | null;
  category: string | null;
  category_en?: string | null;
  meta_title?: string | null;
  meta_title_en?: string | null;
  meta_description?: string | null;
  meta_description_en?: string | null;
  author_name: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at?: string;
};

export type ConsultationStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Consultation = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  service_slug: string | null;
  channel: "online" | "phone" | "office";
  scheduled_date: string;
  scheduled_time: string;
  message: string | null;
  status: ConsultationStatus;
  admin_notes: string | null;
  lang: "ar" | "en";
  confirmation_sent_at?: string | null;
  reminder_sent_at?: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  body: string;
  is_read: boolean;
  lang?: "ar" | "en";
  created_at: string;
};

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

export type Package = {
  id: string;
  name: string;
  name_en: string | null;
  price: number;
  currency: string;
  period: "month" | "year" | "once";
  tagline: string;
  tagline_en: string | null;
  features: string[];
  features_en: string[];
  cta: string | null;
  cta_en: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskRecurrence = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  due_time: string | null;
  recurrence: TaskRecurrence;
  assignee_id: string | null;
  created_by: string | null;
  contact_id: string | null;
  consultation_id: string | null;
  source: "manual" | "auto";
  position: number;
  completed_at: string | null;
  created_at: string;
  contact?: { id: string; full_name: string } | null;
};

export type ContactStage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
export type ContactSource =
  | "website"
  | "booking"
  | "contact_form"
  | "whatsapp"
  | "meta_ads"
  | "meta_lead_form"
  | "google_ads"
  | "instagram"
  | "referral"
  | "manual"
  | "other";

export type Contact = {
  id: string;
  full_name: string;
  phone: string | null;
  phone_norm: string | null;
  wa_id: string | null;
  email: string | null;
  company: string | null;
  source: ContactSource;
  campaign: string | null;
  utm: Record<string, string>;
  stage: ContactStage;
  value: number | null;
  service_slug: string | null;
  tags: string[];
  notes: string | null;
  assignee_id: string | null;
  last_activity_at: string;
  created_at: string;
};

export type ContactActivity = {
  id: string;
  contact_id: string;
  kind: "note" | "call" | "whatsapp_in" | "whatsapp_out" | "email" | "meeting" | "booking" | "message" | "lead" | "stage" | "task";
  body: string | null;
  meta: Record<string, string>;
  author_id: string | null;
  created_at: string;
};
