import { z } from "zod";

import { m } from "@/paraglide/messages.js";

export const loginSchema = z.object({
  email: z.email(m.validation_invalid_email()),
  password: z.string().min(1, m.validation_password_required()),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(1, m.validation_name_required()),
  email: z.email(m.validation_invalid_email()),
  password: z.string().min(8, m.validation_password_min()),
});

export type SignupValues = z.infer<typeof signupSchema>;

export const UI_MAX_HEIGHT = 20;

export const graphsSchema = z
  .object({
    num_props: z.number().int().min(1).max(UI_MAX_HEIGHT),
    max_height: z.number().int().min(1).max(UI_MAX_HEIGHT),
  })
  .refine((data) => data.max_height >= data.num_props, {
    message: m.validation_max_height(),
    path: ["max_height"],
  });

export type GraphsValues = z.infer<typeof graphsSchema>;

export const builderSchema = z
  .object({
    num_props: z.number().int().min(1).max(UI_MAX_HEIGHT),
    max_height: z.number().int().min(1).max(UI_MAX_HEIGHT),
  })
  .refine((data) => data.max_height >= data.num_props, {
    message: m.validation_max_height(),
    path: ["max_height"],
  });

export type BuilderValues = z.infer<typeof builderSchema>;
