import { ChainOrchestrator } from './chain-orchestrator.js';
import './config.js';

async function main() {
  const orchestrator = new ChainOrchestrator();

  const userQuery = "Write code in JS to find a prime number";

  try {
    const allSteps = await orchestrator.executeChainOfThought(userQuery);
    
    // Display complete conversation to user
    console.log('\n📊 COMPLETE CONVERSATION HISTORY:');
    console.log('=' .repeat(60));
    
    allSteps.forEach((step, index) => {
      const modelUsed = step.model ? ` [${step.model}]` : '';
      console.log(`\n${step.stepNumber}. ${step.step}${modelUsed}:`);
      console.log(step.content);
      console.log(`   Time: ${new Date(step.timestamp).toLocaleTimeString()}`);
      console.log('-' .repeat(50));
    });
    
    // Extract final answer
    const finalOutput = allSteps.find(msg => msg.step === 'OUTPUT');
    if (finalOutput) {
      console.log('\n✨ FINAL ANSWER:');
      console.log('⭐ ' + finalOutput.content);
    }
    
    // Statistics
    const stepCounts = allSteps.reduce((acc, step) => {
      acc[step.step] = (acc[step.step] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 STATISTICS:');
    console.log(`Total steps: ${allSteps.length}`);
    Object.entries(stepCounts).forEach(([step, count]) => {
      console.log(`${step}: ${count}`);
    });
    
    console.log(`\n⏱️  Total time: ${new Date(allSteps[allSteps.length - 1].timestamp) - new Date(allSteps[0].timestamp)}ms`);
    
  } catch (error) {
    console.error('❌ Error in main execution:', error.message);
    process.exit(1);
  }
}

main();

export { main };