export type Media = {
  id: string;
  created_at: string;
  storage_path: string;
  type: "image" | "video";
  title: string | null;
  note: string | null;
  published: boolean;
  featured: boolean;
  sort_order: number;
};

export type Inquiry = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  interest: string | null;
  message: string | null;
  handled: boolean;
};
