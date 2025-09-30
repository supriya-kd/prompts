import { LLMClient } from './llm-client.js';
import { EvaluationService } from './evaluation-service.js';
import { Conversation } from './conversation.js';
import { 
  SYSTEM_PROMPT, 
  MAX_STEPS, 
  MAIN_MODEL_TEMPERATURE, 
  THINKING_DELAY_MS,
  EVALUATOR_CONTEXT_SIZE,
  IMPROVER_CONTEXT_SIZE
} from './constants.js';

export class ChainOrchestrator {
  constructor() {
    this.llmClient = new LLMClient();
    this.evaluationService = new EvaluationService();
    this.conversation = new Conversation();
  }

  async executeChainOfThought(userQuery) {
    console.log('🚀 Starting Chain-of-Thought Reasoning');
    console.log(`📝 User Query: "${userQuery}"`);
    console.log('=' .repeat(60));

    try {
      // Initial START step
      console.log('\n🟢 Step 1: Generating START...');
      const startStep = await this.llmClient.generateWithSystemPrompt(
        `User query: "${userQuery}"`,
        SYSTEM_PROMPT,
        'main',
        MAIN_MODEL_TEMPERATURE
      );
      this.conversation.addStep(startStep.step, startStep.content, 'GPT-4.1-mini');
      this.logStep(startStep, this.conversation.stepCounter);

      // Main reasoning loop
      while (this.conversation.steps.length < MAX_STEPS) {
        const lastMessage = this.conversation.getLastStep();

        if (lastMessage.step === 'START' || lastMessage.step === 'EVALUATE') {
          // Generate THINK step
          const stepNumber = this.conversation.steps.length + 1;
          console.log(`\n🧠 Step ${stepNumber}: Generating THINK...`);
          const thinkStep = await this.generateNextThinkStep();
          this.conversation.addStep(thinkStep.step, thinkStep.content, 'GPT-4.1-mini');
          this.logStep(thinkStep, this.conversation.stepCounter);

        } 
        else if (lastMessage.step === 'THINK') {
          // Evaluate the THINK step
          const stepNumber = this.conversation.steps.length + 1;
          console.log(`\n⚖️ Step ${stepNumber}: Requesting EVALUATION...`);
          const evaluation = await this.evaluateCurrentThinking();
          this.conversation.addStep(evaluation.step, evaluation.content, 'Gemini-2.5-flash');
          this.logStep(evaluation, this.conversation.stepCounter);

          // Check if we should proceed to OUTPUT
          if (this.shouldProceedToOutput(evaluation)) {
            const stepNumber = this.conversation.steps.length + 1;
            console.log(`\n🎯 Step ${stepNumber}: Generating OUTPUT...`);
            const outputStep = await this.generateOutputStep();
            this.conversation.addStep(outputStep.step, outputStep.content, 'GPT-4.1-mini');
            this.logStep(outputStep, this.conversation.stepCounter);
            break;
          }
        }

        await this.delay(THINKING_DELAY_MS);
      }

      // Ensure we have an OUTPUT step if loop ended by max steps
      if (this.conversation.getLastStep().step !== 'OUTPUT') {
        const stepNumber = this.conversation.steps.length + 1;
        console.log(`\n⏰ Step ${stepNumber}: Max steps reached, generating OUTPUT...`);
        const outputStep = await this.generateOutputStep();
        this.conversation.addStep(outputStep.step, outputStep.content, 'GPT-4.1-mini');
        this.logStep(outputStep, this.conversation.stepCounter);
      }

      console.log('\n' + '=' .repeat(60));
      console.log('✅ Reasoning completed successfully!');
      console.log(`📊 Total steps: ${this.conversation.steps.length}`);
      
      return this.conversation.getAllSteps();

    } catch (error) {
      console.error('\n❌ Chain execution failed:', error.message);
      throw error;
    }
  }

  async generateNextThinkStep() {
    const lastMessage = this.conversation.getLastStep();
    const completeContext = this.conversation.getRecentContext(IMPROVER_CONTEXT_SIZE);
    
    if (lastMessage.step === 'EVALUATE' && 
        this.evaluationService.hasSpecificSuggestions(lastMessage.content)) {
      console.log('   ↳ Generating improved thinking based on feedback');
      return this.generateImprovedThinkStep();
    }
    
    // Regular THINK step
    const prompt = `Based on the recent conversation, provide your next thinking step:\n\n${completeContext}`;
    
    return this.llmClient.generateWithSystemPrompt(
      prompt,
      SYSTEM_PROMPT,
      'main',
      MAIN_MODEL_TEMPERATURE
    );
  }

  async generateImprovedThinkStep() {
    const lastEvaluation = this.conversation.getLastStep();
    const previousThinkStep = this.findPreviousThinkStep();
    
    if (!previousThinkStep) {
    throw new Error('Cannot generate improved thinking: No previous THINK step found for evaluation');
  }

    const completeContext = this.conversation.getRecentContext(IMPROVER_CONTEXT_SIZE);

    return this.llmClient.generateImprovedThinking(
      previousThinkStep.content,
      lastEvaluation.content,
      completeContext,
      MAIN_MODEL_TEMPERATURE
    );
  }

  // Helper method to reliably find the previous THINK step
  findPreviousThinkStep() {
    // Search backwards through conversation to find the most recent THINK step
    for (let i = this.conversation.steps.length - 2; i >= 0; i--) {
      if (this.conversation.steps[i].step === 'THINK') {
        return this.conversation.steps[i];
      }
    }
    return null;
  }

  async evaluateCurrentThinking() {
    const lastThinkStep = this.conversation.getLastStep();
    const completeContext = this.conversation.getRecentContext(EVALUATOR_CONTEXT_SIZE);
    
    return this.evaluationService.evaluateThinkingStep(
      lastThinkStep.content,
      completeContext,
      lastThinkStep.stepNumber,
      lastThinkStep.id
    );
  }

  async generateOutputStep() {
    const completeConversation = this.conversation.getConversationContext();
    return this.llmClient.generateOutputStep(completeConversation, MAIN_MODEL_TEMPERATURE);
  }

  shouldProceedToOutput(evaluation) {
    const evaluationContent = evaluation.content.toLowerCase();

    // Single positive evaluation is enough to proceed
    if (this.evaluationService.isPositiveEvaluation(evaluationContent)) {
      console.log('   ✅ Positive evaluation - proceeding to OUTPUT');
      return true;
    }

    // Check if we're approaching max steps with no specific suggestions
    if (this.conversation.steps.length >= MAX_STEPS - 2 && 
        !this.evaluationService.hasSpecificSuggestions(evaluationContent)) {
      console.log('   ⏰ Proceeding to OUTPUT - max steps approaching');
      return true;
    }

    return false;
  }

  logStep(step, stepNumber) {
    const stepEmoji = {
      'START': '🚀',
      'THINK': '🧠', 
      'EVALUATE': '⚖️',
      'OUTPUT': '🎯'
    }[step.step] || '📝';

    console.log(`${stepEmoji} Step ${stepNumber}: ${step.step}`);
    console.log(`   Content: ${step.content.substring(0, 100)}${step.content.length > 100 ? '...' : ''}`);
    
    if (step.step === 'EVALUATE') {
      const isPositive = this.evaluationService.isPositiveEvaluation(step.content);
      console.log(`   Evaluation: ${isPositive ? '✅ Positive' : '💡 Suggestions provided'}`);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConversation() {
    return this.conversation;
  }

  clearConversation() {
    this.conversation.clear();
  }
}