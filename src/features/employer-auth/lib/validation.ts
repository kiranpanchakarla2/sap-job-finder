import { z } from "zod";

const workEmailField = z
  .string()
  .min(1, "Work email is required.")
  .pipe(z.email("Please enter a valid work email."));

const passwordField = z
  .string()
  .min(1, "Password is required.")
  .min(8, "Password must be at least 8 characters.");

export const employerSprintLoginSchema = z.object({
  email: workEmailField,
  password: passwordField,
});

export type EmployerSprintLoginValues = z.infer<typeof employerSprintLoginSchema>;

export const employerSprintRegisterSchema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: workEmailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm password is required."),
    jobTitle: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export type EmployerSprintRegisterValues = z.infer<typeof employerSprintRegisterSchema>;

export const employerSprintForgotPasswordSchema = z.object({
  email: workEmailField,
});

export type EmployerSprintForgotPasswordValues = z.infer<
  typeof employerSprintForgotPasswordSchema
>;

export const employerSprintResetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm new password is required."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export type EmployerSprintResetPasswordValues = z.infer<
  typeof employerSprintResetPasswordSchema
>;
