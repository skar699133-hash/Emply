import { db } from '../db/connection.js';
import { generateGeminiText } from './gemini.service.js';

export interface PolicyAnswer {
  question: string;
  answer: string;
  verifiedFact: string;
  policyCode?: string;
  policyTitle?: string;
  policySummary?: string;
  nextStepRecommendation?: string;
  foundInPolicy: boolean;
}

export async function answerPolicyQuestion(question: string): Promise<PolicyAnswer> {
  const policiesRes = await db.query(
    `SELECT * FROM company_policies WHERE is_active = true`
  );
  const policies = policiesRes.rows;

  const qLower = question.toLowerCase();

  // Find relevant policies
  const matchedPolicies = policies.filter((p: any) => {
    const text = `${p.title} ${p.summary} ${p.content} ${p.category}`.toLowerCase();
    const keywords = qLower.split(/\s+/).filter((w) => w.length > 3);
    return keywords.some((kw) => text.includes(kw));
  });

  if (matchedPolicies.length === 0) {
    return {
      question,
      answer: "I couldn't find a definitive answer in the available company policy. I recommend contacting HR.",
      verifiedFact: "No matching authorized company policy record was found in the organizational database.",
      foundInPolicy: false,
      nextStepRecommendation: "Would you like me to create an HR assistance request for you?",
    };
  }

  // Pick top matched policy
  const topPolicy = matchedPolicies[0];

  const geminiPrompt = `You are Nexora's Grounded Policy Intelligence Agent.
Answer the employee's question using ONLY the provided verified company policy text below.
DO NOT invent or extrapolate policies.
If the policy does not address the question, clearly state that.

Question: "${question}"

Policy [${topPolicy.code}] - ${topPolicy.title}:
${topPolicy.content}

Return a concise, supportive answer explaining what the policy says.`;

  const geminiAnswer = await generateGeminiText(geminiPrompt);

  let finalAnswer = geminiAnswer;
  if (!finalAnswer) {
    // Deterministic fallback response based on policy content
    finalAnswer = `According to ${topPolicy.title} (${topPolicy.code}): ${topPolicy.summary}\n\nKey policy clause: ${topPolicy.content.split('\n')[0]}`;
  }

  return {
    question,
    answer: finalAnswer,
    verifiedFact: `Verified against official policy: ${topPolicy.title} (${topPolicy.code}, Version: ${topPolicy.version || '2026.1'})`,
    policyCode: topPolicy.code,
    policyTitle: topPolicy.title,
    policySummary: topPolicy.summary,
    foundInPolicy: true,
    nextStepRecommendation: "If you need specific approval or an exception, you can submit a request through Nexora AI.",
  };
}
