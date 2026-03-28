import { z } from "zod";

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username phải có ít nhất 3 ký tự")
      .max(30, "Username không được quá 30 ký tự")
      .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ được chứa chữ, số và dấu _"),
    email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
    password: z
      .string()
      .min(6, "Password phải có ít nhất 6 ký tự")
      .max(100, "Password không được quá 100 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password không khớp",
    path: ["confirmPassword"],
  });

// ✅ Dùng "identifier" thay vì "email"
export const signinSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email hoặc username là bắt buộc")
    .min(3, "Phải có ít nhất 3 ký tự")
    .trim(),
  password: z.string().min(1, "Password là bắt buộc"),
});
