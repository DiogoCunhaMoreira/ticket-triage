import { zodToJsonSchema } from "zod-to-json-schema";
import { ai } from "./gemini.js";
import { TriageOutputSchema, type TriageOutput } from "./schema.js";

export async function triageTicket(ticket: any): Promise<TriageOutput> {
  const prompt = `
You are a ticket triage assistant for a frontend web product team.

Ticket JSON:
${JSON.stringify(ticket, null, 2)}

Return ONLY JSON that matches the provided JSON Schema.
Rules:
- If ticket indicates checkout/payment is broken in production or users can't complete purchase => priority P0/P1 and should_escalate=true.
- Ask for missing info: steps to reproduce, expected vs actual, browser/os/device, screenshots, console errors, network HAR, feature-flag state, regression (when started).
- Labels should be consistent kebab-case (e.g., "needs-repro", "safari", "checkout", "regression").
- Draft comment must be polite, actionable, and structured with bullet points.
- Do NOT invent logs/metrics. If evidence is missing, say so and ask for it.
`;

  // Tenta usar o método nativo do Zod v4
  const zodSchema = TriageOutputSchema.toJSONSchema();
  
  // Remove propriedades incompatíveis
  delete (zodSchema as any).$schema;
  delete (zodSchema as any).additionalProperties;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // Modelo preview com suporte melhorado
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodSchema,
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  return TriageOutputSchema.parse(parsed);
}
