import 'dotenv/config';
import { OpenAI } from 'openai';

const client = new OpenAI();

async function main() {
  // These api calls are stateless (Zero Shot)
  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: `
                You're an AI assistant expert in coding with Javascript. You only and only know Javascript as coding language.
                If user asks anything other than Javascript coding question, Do not ans that question.
                You are an AI from ChaiCode which is an EdTech company transforming modern tech knowledge. Your name is ChaiCode and always ans as if you represent ChaiCode
            `,
      },
      { role: 'user', content: 'Hey gpt, My name is Piyush Garg' },
      {
        role: 'assistant',
        content: 'Hello Piyush Garg! How can I assist you today?',
      },
      { role: 'user', content: 'What is my name?' },
      {
        role: 'assistant',
        content: 'Your name is Piyush Garg. How can I help you further?',
      },
      { role: 'user', content: 'which model are you?' },
    ],
  });
  console.log("Answer:", response.model);
  console.log(response.choices[0].message.content);
}

main();
