// OpenAI service for email analysis
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export class OpenAIService {
    constructor(apiKey, model = 'gpt-4-turbo-preview') {
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.apiKey = apiKey;
        this.model = model;
        console.log('🔧 OpenAI Service initialized with model:', model);
    }

    async analyzeEmailBias(emailContent) {
        console.log('🔄 Starting OpenAI analysis for email length:', emailContent.length);
        
        if (!emailContent) {
            const error = new Error('No email content provided');
            console.error('❌ Analysis Error:', error);
            throw error;
        }

        const prompt = `
            Analyze the following email content for bias and provide a structured analysis. 
            Return ONLY a JSON object with no markdown formatting or additional text.
            The JSON should have these aspects:
            
            1. Credibility scores (0-1):
               - deceptive: likelihood of deceptive content
               - fakeNews: likelihood of fake news
               - trustworthy: overall trustworthiness
               - objective: level of objectivity
            
            2. Political bias scores (0-1):
               - conservative: degree of conservative bias
               - liberal: degree of liberal bias
            
            3. Structure analysis:
               - format: "Simple", "Standard", or "Complex"
               - paragraphs: number of paragraphs
               - readability: "Low", "Medium", or "High"
            
            Ensure all numerical scores are between 0 and 1.
            
            Email content:
            ${emailContent}
        `;

        console.log('📤 Preparing OpenAI API request...');
        
        try {
            const requestBody = {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at analyzing text for bias, credibility, and political leanings. Always respond with a raw JSON object containing numerical scores between 0 and 1. Do not include any markdown formatting or additional text in your response.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            };

            console.log('📋 Request configuration:', {
                endpoint: OPENAI_API_ENDPOINT,
                model: requestBody.model,
                messageCount: requestBody.messages.length,
                temperature: requestBody.temperature,
                maxTokens: requestBody.max_tokens,
                promptLength: prompt.length
            });

            console.log('🔑 Using API key starting with:', this.apiKey.substring(0, 7));

            console.log('🚀 Sending request to OpenAI API...');
            const startTime = performance.now();

            const response = await fetch(OPENAI_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            const endTime = performance.now();
            console.log(`⏱️ OpenAI API response time: ${(endTime - startTime).toFixed(2)}ms`);
            console.log('📥 Received response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ OpenAI API error response:', errorText);
                throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('🔍 Parsed API response:', data);

            if (!data.choices?.[0]?.message?.content) {
                console.error('❌ Invalid response format from OpenAI');
                throw new Error('Invalid response format from OpenAI');
            }

            console.log('🔍 Parsing OpenAI response content...');
            const content = data.choices[0].message.content;
            
            // Clean the response: remove markdown formatting if present
            const cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();
            console.log('🧹 Cleaned content:', cleanedContent);

            const rawAnalysis = JSON.parse(cleanedContent);
            console.log('📊 Raw analysis:', rawAnalysis);

            return rawAnalysis;

        } catch (error) {
            console.error('❌ OpenAI API Error:', error);
            console.error('📜 Error stack:', error.stack);
            throw error;
        }
    }
}

const openaiService = new OpenAIService('your-api-key-here');
