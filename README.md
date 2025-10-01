# AI Prompt Applications

A collection of Node.js applications for AI prompt engineering and evaluation, featuring advanced techniques like Few-Shot Learning, Chain of Thought, LLM-as-Judge, and Self-Consistent prompting.

## 📋 Overview

This repository contains multiple Node.js applications demonstrating advanced prompt engineering techniques:

- **Few-Shot Learning**: Example-based prompting for better task understanding
- **Chain of Thought (CoT)**: Step-by-step reasoning prompts for complex problem solving
- **LLM-as-Judge**: Automated evaluation system using AI models to judge responses. 
  This code uses Iterative Refinement & Critique technique mentioned in the blog.
  It shows a mixture of CoT prompt with LLM as Judge, where the judge evaluates the Thinking step of COT.
- **Self-Consistent**: Implementation of self-consistent prompting for more reliable outputs
- **Basic Prompt Templates**: Various prompt templates for different use cases

## 🛠️ Installation

### Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (Node Package Manager)
- **OpenAI API token** ( this is a paid token, you can use a free model in the code, to work with a free token )

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/supriya-kd/prompts.git
   cd /prompts
   create .env file, add the key in this file like OPENAI_API_KEY=key1
   For LLM as judge you need 2 models. So include another model's key also in the .env file like GEMINI_API_KEY=key2

2. To run Chain of Thought Prompt example run => **node chain-of-thought.js**
3. To run a Few Shot Prompt example run => **node few_shot.js**
4. To run LLM as judge example follow steps:
   i) cd /LLM-as-judge
   ii) run => **node main.js**
6. To run a Self-consistent example follow steps:
   i) cd /Self-consistent 
   ii) run => **node self-consistent-prompt.js**
7. Hard coded questions are present in each of these files. You can change those questions to experiment the output with different types of questions.
