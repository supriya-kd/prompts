import { LLMClient } from './llm-client.js';
import { EVALUATION_PROMPT_TEMPLATE, EVALUATION_TEMPERATURE } from './constants.js';

export class EvaluationService {
  constructor() {
    this.llmClient = new LLMClient();
  }

  async evaluateThinkingStep(currentThought, conversationContext) {
    try {
      const evaluationPrompt = EVALUATION_PROMPT_TEMPLATE
        .replace('{conversationContext}', conversationContext)
        .replace('{currentThought}', currentThought);

      // Use generateText instead of generate to get free-form text response
      const evaluationContent = await this.llmClient.generateText(
        [{ role: 'user', content: evaluationPrompt }],
        'evaluator',
        EVALUATION_TEMPERATURE
      );

      // Create the evaluate step ourselves with proper structure
      return {
        step: 'EVALUATE',
        content: evaluationContent
      };

    } catch (error) {
      console.error('Evaluation failed:', error.message);
      
      // Return a properly structured evaluate step even on error
      return {
        step: 'EVALUATE',
        content: `Evaluation error: ${error.message}. Please continue with the next step.`
      };
    }
  }

  isPositiveEvaluation(evaluationContent) {
    const content = evaluationContent.toLowerCase();
    const positiveIndicators = [
      'no suggestions',
      'proceed to output',
      'excellent reasoning',
      'no further improvements',
      'complete and correct',
      'ready for output'
    ];

    return positiveIndicators.some(indicator => content.includes(indicator));
  }

  hasSpecificSuggestions(evaluationContent) {
    const content = evaluationContent.toLowerCase();
    const suggestionIndicators = [
      'should consider',
      'suggest',
      'recommend',
      'improve',
      'add',
      'include',
      'clarify',
      'missing',
      'consider'
    ];

    return suggestionIndicators.some(indicator => content.includes(indicator));
  }
}