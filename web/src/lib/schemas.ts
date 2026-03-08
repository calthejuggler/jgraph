import { z } from "zod";

import { m } from "@/paraglide/messages.js";

export function loginSchema() {
  return z.object({
    email: z.email(m.validation_invalid_email()),
    password: z.string().min(1, m.validation_password_required()),
  });
}

export type LoginValues = z.infer<ReturnType<typeof loginSchema>>;

export function signupSchema() {
  return z.object({
    name: z.string().min(1, m.validation_name_required()),
    email: z.email(m.validation_invalid_email()),
    password: z.string().min(8, m.validation_password_min()),
  });
}

export type SignupValues = z.infer<ReturnType<typeof signupSchema>>;

export function forgotPasswordSchema() {
  return z.object({
    email: z.email(m.validation_invalid_email()),
  });
}

export type ForgotPasswordValues = z.infer<ReturnType<typeof forgotPasswordSchema>>;

export function resetPasswordSchema() {
  return z
    .object({
      password: z.string().min(8, m.validation_password_min()),
      confirmPassword: z.string().min(8, m.validation_password_min()),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: m.validation_passwords_must_match(),
      path: ["confirmPassword"],
    });
}

export type ResetPasswordValues = z.infer<ReturnType<typeof resetPasswordSchema>>;

export function changePasswordSchema() {
  return z
    .object({
      currentPassword: z.string().min(1, m.validation_password_required()),
      newPassword: z.string().min(8, m.validation_password_min()),
      confirmPassword: z.string().min(8, m.validation_password_min()),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: m.validation_passwords_must_match(),
      path: ["confirmPassword"],
    });
}

export type ChangePasswordValues = z.infer<ReturnType<typeof changePasswordSchema>>;

export const UI_MAX_HEIGHT = 10;
export const ABSOLUTE_MAX_HEIGHT = 128;

function propsHeightSchema(maxHeight: number) {
  return z
    .object({
      num_props: z.number().int().min(1).max(maxHeight),
      max_height: z.number().int().min(1).max(maxHeight),
    })
    .refine((data) => data.max_height >= data.num_props, {
      message: m.validation_max_height(),
      path: ["max_height"],
    });
}

export function graphsSchema() {
  return propsHeightSchema(UI_MAX_HEIGHT);
}

export type GraphsValues = z.infer<ReturnType<typeof graphsSchema>>;

export function builderSchema(maxHeight = ABSOLUTE_MAX_HEIGHT) {
  return propsHeightSchema(maxHeight);
}

export type BuilderValues = z.infer<ReturnType<typeof builderSchema>>;

export function contactSchema() {
  return z.object({
    name: z.string().min(1, m.validation_name_required()).max(100),
    email: z.email(m.validation_invalid_email()).max(254),
    message: z.string().min(1, m.contact_validation_message_required()).max(5000),
  });
}

export type ContactValues = z.infer<ReturnType<typeof contactSchema>>;
