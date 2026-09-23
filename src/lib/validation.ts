import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "姓名不能为空").max(50, "姓名过长"),
  username: z.string().trim().min(1, "用户名不能为空"),
  password: z.string().min(6, "密码至少 6 位").max(100, "密码过长"),
  classId: z.string().min(1, "请选择班级"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "姓名不能为空").max(50, "姓名过长"),
  username: z.string().trim().min(1, "用户名不能为空"),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

export const assignmentSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(200, "标题过长"),
  description: z.string().max(20000, "描述过长"),
  startAt: z.string().min(1, "请设置开始时间"),
  dueAt: z.string().min(1, "请设置截止时间"),
  classId: z.string().min(1, "请选择班级"),
  studentIds: z.array(z.string()).min(1, "请选择需要交作业的学生"),
  images: z.array(z.string()).max(10, "图片最多 10 张"),
});

export const classSchema = z.object({
  name: z.string().trim().min(1, "班级号不能为空").max(50, "班级号过长"),
});

export const feedbackSchema = z.object({
  feedback: z.string().max(2000, "评语过长"),
  feedbackImages: z.array(z.string()).max(6, "评语图片最多 6 张"),
});

export const submissionSchema = z.object({
  remark: z.string().max(500, "备注过长"),
  images: z.array(z.string()).max(10, "照片最多 10 张"),
});

export const scoreSchema = z.object({
  score: z.coerce.number().min(0, "分数不能为负").max(1000, "分数过大"),
});
