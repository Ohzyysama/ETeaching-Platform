// Supabase 表结构的 TypeScript 类型（与 supabase/schema.sql 对应）。

export type Role = "teacher" | "student";

export interface Profile {
  id: string;
  name: string;
  username: string;
  role: Role;
  class_id: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  images: string[]; // Storage 图片 URL
  start_at: string;
  due_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  remark: string;
  images: string[]; // 学生照片 URL
  feedback: string;
  feedback_images: string[]; // 评语配图 URL
  annotations: (string | null)[]; // 每张照片的涂鸦 PNG URL（索引对应 images）
  submitted_at: string;
  updated_at: string;
  score: number;
  graded: boolean;
  graded_by: string | null;
  graded_at: string | null;
}
