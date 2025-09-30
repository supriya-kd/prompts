import { openaiClient, geminiClient } from './config.js';
import { MAIN_MODEL, EVALUATOR_MODEL, OUTPUT_PROMPT_TEMPLATE, IMPROVEMENT_PROMPT_TEMPLATE } from './constants.js';

export class LLMClient {
  constructor() {
    this.clients = {
      'main': openaiClient,
      'evaluator': geminiClient
    };
  }

  async generate(messages, modelType = 'main', temperature = 0.1, maxRetries = 3) {
    const client = this.clients[modelType];
    const model = modelType === 'main' ? MAIN_MODEL : EVALUATOR_MODEL;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await client.chat.completions.create({
          model: model,
          messages: messages,
          temperature: temperature,
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message.content;
        
        // Parse JSON response
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', content);
          throw new Error(`Invalid JSON response: ${content.substring(0, 100)}...`);
        }
        
        // Validate the response structure
        if (!parsed.step || !parsed.content) {
          console.error('Response missing required fields:', parsed);
          throw new Error('Response missing step or content fields');
        }

        return parsed;

      } catch (error) {
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          return this.createFallbackResponse(modelType, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  async generateText(messages, modelType = 'main', temperature = 0.1, maxRetries = 3) {
    const client = this.clients[modelType];
    const model = modelType === 'main' ? MAIN_MODEL : EVALUATOR_MODEL;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await client.chat.completions.create({
          model: model,
          messages: messages,
          temperature: temperature
          // Note: No response_format constraint - allows free text response
        });

        return response.choices[0].message.content;

      } catch (error) {
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          return `Error: ${error.message}. Please continue.`;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  createFallbackResponse(modelType, error) {
    const step = modelType === 'main' ? 'THINK' : 'EVALUATE';
    const content = `I encountered an error: ${error.message}. Please continue with the next step.`;
    
    return {
      step: step,
      content: content
    };
  }

  async generateWithSystemPrompt(userPrompt, systemPrompt, modelType = 'main', temperature = 0.1) {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    return this.generate(messages, modelType, temperature);
  }

 async generateImprovedThinking(previousThought, evaluation, conversationContext, thoughtStepNumber, thoughtStepId, temperature = 0.1) {
  
  // USE THE IMPROVEMENT PROMPT TEMPLATE
  const improvementPrompt = IMPROVEMENT_PROMPT_TEMPLATE
    .replace('{previousThought}', previousThought)
    .replace('{evaluation}', evaluation)
    .replace('{conversationContext}', conversationContext)
    .replace('{thoughtStepNumber}', thoughtStepNumber)
    .replace('{thoughtStepId}', thoughtStepId);

  const messages = [
    { role: 'user', content: improvementPrompt }
  ];

  // Use generateText (not generate) since we want free-form text response
  const improvedContent = await this.generateText(messages, 'main', temperature);
  
  return {
    step: 'THINK',
    content: improvedContent
  };
}

  async generateOutputStep(completeConversation, temperature = 0.1) {
    try {
      const outputPrompt = OUTPUT_PROMPT_TEMPLATE.replace('{completeConversation}', completeConversation);
      
      const messages = [
        { role: 'user', content: outputPrompt }
      ];

      // Use the regular generate method that expects JSON response
      return await this.generate(messages, 'main', temperature);
      
    } catch (error) {
      console.error('Output generation failed:', error.message);
      return {
        step: 'OUTPUT',
        content: `Error generating output: ${error.message}. The final answer is based on the reasoning process.`
      };
    }
  }
}