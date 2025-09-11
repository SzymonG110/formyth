import { z } from "zod";

export const fieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["text", "email", "number", "checkbox", "select"]),
  label: z.string().optional(),
  required: z.boolean().optional(),
  validation: z.record(z.string(), z.any()).optional(),
});

export type Field = z.infer<typeof fieldSchema>;

export const formSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldSchema),
});

export type Form = z.infer<typeof formSchema>;
