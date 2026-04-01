import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const MODEL = "gpt-4o-mini";

export async function extractQuestions(pdfText: string) {
  const response = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a healthcare compliance document parser. Extract all audit questions from a regulatory questionnaire PDF text.

Return a JSON object with a "questions" key containing an array where each element has:
- "number": the question number (integer)
- "text": the full question text
- "reference": the reference citation (e.g. "APL 25-008, page 1")`,
      },
      {
        role: "user",
        content: pdfText,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content ?? "{}");
  return parsed.questions ?? [];
}

export async function analyzeCompliance(
  questions: { number: number; text: string; reference: string }[],
  policyTexts: { name: string; text: string }[]
) {
  const policyContext = policyTexts
    .map((p) => `=== POLICY: ${p.name} ===\n${p.text}`)
    .join("\n\n");

  const questionList = questions
    .map((q) => `Question ${q.number}: ${q.text}\n(Reference: ${q.reference})`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a healthcare compliance auditor AI. You are given policy documents and audit questions. For each question, determine whether the policy documents satisfy the requirement.

Return a JSON object with a "results" key containing an array of objects with:
- "questionNumber": the question number (integer)
- "status": one of "met", "not_met", or "partial"
  - "met": the policy clearly addresses all aspects of the requirement
  - "partial": the policy addresses some but not all aspects
  - "not_met": the policy does not address the requirement
- "evidence": if met or partial, the exact quote from the policy that serves as evidence. If not_met, empty string.
- "sourceDocument": the name of the policy document the evidence comes from. If not_met, empty string.
- "sourcePage": the page number where the evidence was found (integer). If not_met, 0.
- "explanation": a brief explanation of why the requirement is met, partially met, or not met.

The policy text has page markers like [Page 1], [Page 2] etc. Use these to determine the sourcePage.`,
      },
      {
        role: "user",
        content: `POLICY DOCUMENTS:\n${policyContext}\n\nAUDIT QUESTIONS:\n${questionList}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content ?? "{}");
  return parsed.results ?? [];
}
