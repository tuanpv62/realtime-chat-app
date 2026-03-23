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
      .min(1, "Password phải có ít nhất 1 ký tự")
      .max(100, "Password không được quá 100 ký tự"),

    confirmPassword: z.string().min(1, "Vui lòng xác nhận password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password không khớp",
    path: ["confirmPassword"],
  });

export const signinSchema = z.object({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),

  password: z.string().min(1, "Password là bắt buộc"),
});
