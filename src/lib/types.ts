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
  created_at: string;
};

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};
