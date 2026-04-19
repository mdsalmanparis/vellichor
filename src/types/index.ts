export type Folder = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
};

export type Section = {
  id: string;
  folder_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
};

export type Page = {
  id: string;
  folder_id: string;
  section_id: string | null;
  user_id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
};
