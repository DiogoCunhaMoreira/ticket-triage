import { z } from "zod";

export const TicketType = z.enum(["bug", "question", "task"]);
export const Priority = z.enum(["P0", "P1", "P2", "P3"]);

export const Component = z.enum([
  "checkout",
  "auth",
  "navigation",
  "ui",
  "performance",
  "forms",
  "payments",
  "search",
  "unknown",
]);

export const Team = z.enum(["frontend-core", "web-platform", "growth", "payments", "unknown"]);

export const TriageOutputSchema = z.object({
  ticket_id: z.string(),

  ticket_type: TicketType,
  priority: Priority,
  component: Component,

  labels: z.array(z.string()).max(12),

  routing: z.object({
    team: Team,
    reason: z.string().min(5),
  }),

  missing_info_questions: z.array(z.string()).max(8),

  draft_comment: z.string().min(20),

  should_escalate: z.boolean(),
  escalate_reason: z.string().optional(),

  confidence: z.number().min(0).max(1),
});

export type TriageOutput = z.infer<typeof TriageOutputSchema>;