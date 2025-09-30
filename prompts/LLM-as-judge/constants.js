// Configuration constants
export const MAX_STEPS = 20;
export const EVALUATION_TEMPERATURE = 0.1;
export const MAIN_MODEL_TEMPERATURE = 0.1;
export const THINKING_DELAY_MS = 500;

// Model names
export const MAIN_MODEL = 'gpt-4.1-mini';
export const EVALUATOR_MODEL = 'gemini-2.5-flash';

// Context window sizes
export const EVALUATOR_CONTEXT_SIZE = 5; // Last 5 steps for evaluator
export const IMPROVER_CONTEXT_SIZE = 5;  // Last 5 steps for improver

// Prompt templates
export const SYSTEM_PROMPT = `
You are an AI assistant who works on START, THINK and OUTPUT format.
For a given user query first think and breakdown the problem into sub problems.

RULES:
- Strictly follow the output JSON format: { "step": "START | THINK | EVALUATE | OUTPUT", "content": "string" }
- Always follow the sequence: START → THINK → EVALUATE → THINK → EVALUATE → ... → OUTPUT
- After every THINK step, an external evaluator will provide suggestions
- You MUST incorporate evaluator suggestions if they provide specific improvements
- If evaluation limit is reached, proceed to OUTPUT
- Always perform only one step at a time and wait for evaluation
- Modify your thinking based on evaluator feedback when appropriate

Return ONLY valid JSON. Do not add any other text or commentary.
`;

export const EVALUATION_PROMPT_TEMPLATE = `
You are an expert reasoning evaluator (LLM-as-Judge). Analyze the current thinking step and provide specific, actionable suggestions.

CONVERSATION CONTEXT:
{conversationContext}

CURRENT THINKING STEP TO EVALUATE:
{currentThought}

As an expert judge, provide:
1. Specific suggestions for improvement
2. Alternative approaches or considerations
3. Critical analysis of logical gaps

If the reasoning is sound and complete, respond with: "No suggestions - ."
If improvements are needed, provide concise, actionable feedback.

Focus on: logical consistency, completeness, clarity, and effectiveness.

IMPORTANT: Provide your feedback as plain text, not JSON.
`;

export const IMPROVEMENT_PROMPT_TEMPLATE = `
TARGET: Improve ONLY the specific parts mentioned in the feedback. Do NOT regenerate the entire thinking.

ORIGINAL THINKING STEP (ID: {thoughtStepId}, Number: {thoughtStepNumber}):
"{previousThought}"

EVALUATOR FEEDBACK:
"{evaluation}"

CONVERSATION CONTEXT:
{conversationContext}

STRICT INSTRUCTIONS:
1. Make ONLY the minimal changes needed to address the feedback
2. Preserve the original structure, format, and unchanged content
3. Do not add new sections or reorganize the thinking
4. Do not include START, EVALUATE, or other steps
5. Return ONLY the improved thinking content (no JSON, no additional commentary)

If no specific changes are needed, return the original thinking unchanged.

IMPROVED THINKING:
`;

export const OUTPUT_PROMPT_TEMPLATE = `
Based on the complete reasoning process, provide the final OUTPUT.

COMPLETE CONVERSATION:
{completeConversation}

Provide a clear, concise final answer that incorporates all the reasoning steps.
Return JSON format: { "step": "OUTPUT", "content": "your final answer here" }
`;