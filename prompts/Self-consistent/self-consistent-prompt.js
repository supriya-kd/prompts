import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI();

class SelfConsistentCOT {
  constructor() {
    this.responses = [];
  }

  createCOTPrompt(question) {
    return `Think step by step about this question. Provide a well-reasoned answer.

Question: ${question}

Reasoning process:
1. Analyze what is being asked
2. Consider the most logical approach
3. Work through the solution carefully
4. Arrive at a reasonable conclusion

Final Answer: [Provide the direct answer here]`;
  }

  async generateResponses(question, numAttempts = 5) {
    this.responses = [];
    
    for (let i = 0; i < numAttempts; i++) {
      try {
        // ✅ Tweaking parameters for diversity
        const temperature = 0.3 + (i * 0.15);  // 0.3, 0.45, 0.6, 0.75, 0.9
        const topP = 0.8 + (i * 0.04);         // 0.8, 0.84, 0.88, 0.92, 0.96
        const frequencyPenalty = i * 0.1;       // 0, 0.1, 0.2, 0.3, 0.4
        
        console.log(`\n--- Attempt ${i + 1} (Temp: ${temperature.toFixed(2)}) ---`);
        
        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [{
            role: "user",
            content: this.createCOTPrompt(question) // ✅ SAME QUESTION
          }],
          temperature: temperature,        // ✅ VARIED
          top_p: topP,                     // ✅ VARIED  
          frequency_penalty: frequencyPenalty, // ✅ VARIED
          max_tokens: 800,
        });

        const content = response.choices[0].message.content;
        console.log(content);
        
        const finalAnswer = this.extractFinalAnswer(content);
        this.responses.push({
          attempt: i + 1,
          temperature,
          topP,
          frequencyPenalty,
          finalAnswer
        });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`Error in attempt ${i + 1}:`, error.message);
      }
    }
    
    return this.responses;
  }

  extractFinalAnswer(content) {
    // Look for "Final Answer:" followed by any text until end of line
    const finalAnswerMatch = content.match(/Final Answer:\s*([^\n]+)/i);
    if (!finalAnswerMatch) return "Unknown";
    // Clean up the extracted answer
    let answer = finalAnswerMatch[1].trim();
    // Remove any markdown formatting (asterisks) and brackets
    answer = answer.replace(/\*\*/g, '').replace(/^\[|\]$/g, '').trim();
    return answer || "Unknown";
  }

  getMajorityVote() {
    const answerCounts = {};
    
    this.responses.forEach(response => {
      const answer = response.finalAnswer;
      answerCounts[answer] = (answerCounts[answer] || 0) + 1;
    });
    
    console.log('\n--- Answer Distribution ---');
    Object.entries(answerCounts).forEach(([answer, count]) => {
      console.log(`${answer}: ${count} votes`);
    });
    
    let majorityAnswer = null;
    let maxCount = 0;
    
    for (const [answer, count] of Object.entries(answerCounts)) {
      if (count > maxCount) {
        maxCount = count;
        majorityAnswer = answer;
      }
    }
    
    return {
      answer: majorityAnswer,
      confidence: maxCount / this.responses.length,
      totalVotes: this.responses.length,
      distribution: answerCounts
    };
  }

  // ✅ MAIN METHOD: Single question, multiple attempts
  async solveWithSelfConsistency(question, numAttempts = 5) {
    console.log(`❓ QUESTION: ${question}`);
    console.log(`🔄 Running ${numAttempts} attempts with varied parameters...\n`);
    
    await this.generateResponses(question, numAttempts);
    const result = this.getMajorityVote();
    
    console.log('\n🎯 SELF-CONSISTENCY RESULT:');
    console.log(`Majority Answer: ${result.answer}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Based on ${result.totalVotes} reasoning paths`);
    
    // Show parameter variations used
    console.log('\n🔧 Parameters varied across attempts:');
    this.responses.forEach(resp => {
      console.log(`Attempt ${resp.attempt}: Temp=${resp.temperature.toFixed(2)}, TopP=${resp.topP.toFixed(2)}`);
    });
    
    return result;
  }
}

// ✅ DEMO: Single question with self-consistency
async function demo() {
  const solver = new SelfConsistentCOT();
  
  // ✅ ONE QUESTION, MULTIPLE TIMES
  const singleQuestion = "Suggest a good name for a coffee shop";
  
  const result = await solver.solveWithSelfConsistency(singleQuestion, 5);
  
  console.log('\n📊 SUMMARY:');
  console.log(`Question: "${singleQuestion}"`);
  console.log(`Final Answer: ${result.answer} (${result.confidence * 100}% confidence)`);
}

demo().catch(console.error);