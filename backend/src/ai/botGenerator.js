const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

// AI Bot Generator - generates bot responses using AI
class BotGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.configuration = new Configuration({
      apiKey: apiKey
    });
    this.openai = new OpenAIApi(this.configuration);
  }

  // Generate bot response based on context
  async generateResponse(prompt, context = {}) {
    try {
      const messages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(context)
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const completion = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: context.temperature || 0.7,
        max_tokens: context.maxTokens || 1000
      });

      return completion.data.choices[0].message.content;
    } catch (error) {
      console.error('AI Generation Error:', error.message);
      throw error;
    }
  }

  // Build system prompt from bot configuration
  buildSystemPrompt(context) {
    let prompt = context.systemPrompt || 'You are a helpful Telegram bot assistant.';
    
    if (context.personality) {
      prompt += `\n\nPersonality: ${context.personality}`;
    }
    
    if (context.instructions) {
      prompt += `\n\nInstructions: ${context.instructions}`;
    }
    
    return prompt;
  }

  // Generate bot configuration
  async generateBotConfig(userRequirements) {
    const prompt = `Based on the following requirements, generate a Telegram bot configuration:\n\n${userRequirements}\n\nProvide a JSON object with:
- name: bot name
- description: bot description  
- systemPrompt: system prompt for AI
- personality: bot personality
- responseStyle: response style (formal/casual/friendly)`;

    const response = await this.generateResponse(prompt, {
      maxTokens: 500
    });

    try {
      return JSON.parse(response);
    } catch {
      return { error: 'Failed to parse AI response' };
    }
  }
}

module.exports = BotGenerator;
