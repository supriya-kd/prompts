export class Conversation {
  constructor() {
    this.steps = [];
    this.stepCounter = 0;
  }

  addStep(stepType, content, modelUsed = null) {
    this.stepCounter++;
    const step = {
      step: stepType,
      content: content,
      stepNumber: this.stepCounter,
      timestamp: new Date().toISOString(),
      model: modelUsed,
      id: `${stepType.toLowerCase()}-${this.stepCounter}-${Date.now()}`
    };
    this.steps.push(step);
    return step;
  }

  getAllSteps() {
    return this.steps;
  }

  getRecentSteps(count = 3) {
    return this.steps.slice(-count);
  }

  getStepsByType(stepType) {
    return this.steps.filter(step => step.step === stepType);
  }

  getLastStep() {
    return this.steps.length > 0 ? this.steps[this.steps.length - 1] : null;
  }

  getStepById(stepId) {
    return this.steps.find(step => step.id === stepId);
  }

  getConversationContext() {
    return this.steps.map(step => 
      `${step.step} ${step.stepNumber}: ${step.content}`
    ).join('\n');
  }

  getRecentContext(maxSteps = 5) {
    const recentSteps = this.getRecentSteps(maxSteps);
    return recentSteps.map(step => 
      `${step.step}: ${step.content}`
    ).join('\n');
  }

  clear() {
    this.steps = [];
    this.stepCounter = 0;
  }
}