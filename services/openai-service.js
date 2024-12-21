// OpenAI service for email bias analysis
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
            throw new Error('No email content provided');
        }

        const prompt = `
            Analyze the following email content for bias and provide a structured analysis. 
            Return ONLY a JSON object with no markdown formatting or additional text.
            The JSON should have these aspects:
            
            1. credibility:
               - deceptive: likelihood of deceptive content (0-1)
               - fakeNews: likelihood of misinformation (0-1)
               - trustworthy: reliability of the source (0-1)
               - objective: degree of objectivity in presentation (0-1)
            
            2. politicalBias: a single score from -1 to 1 where:
               * -1.0 means strongly left/liberal
               * -0.5 means moderately left/liberal
               * 0.0 means centrist/neutral
               * 0.5 means moderately right/conservative
               * 1.0 means strongly right/conservative
            
            3. structureAnalysis:
               - format: "Simple", "Standard", or "Complex"
               - paragraphs: number of paragraphs
               - readability: "Low", "Medium", or "High"
            
            Example response format:
            {
                "credibility": {
                    "deceptive": 0.2,
                    "fakeNews": 0.1,
                    "trustworthy": 0.8,
                    "objective": 0.7
                },
                "politicalBias": -0.3,
                "structureAnalysis": {
                    "format": "Standard",
                    "paragraphs": 4,
                    "readability": "High"
                }
            }
            
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
                        content: 'You are an expert at analyzing text for bias, credibility, and political leanings. Focus on evaluating source reliability and content objectivity. For political analysis, focus on providing a single score that accurately represents where the content falls on the political spectrum from left to right. Always respond with a raw JSON object matching the exact format requested. Do not include any markdown formatting or additional text in your response.'
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

            const analysis = JSON.parse(cleanedContent);
            console.log('📊 Analysis:', analysis);

            return analysis;

        } catch (error) {
            console.error('❌ OpenAI API Error:', error);
            console.error('📜 Error stack:', error.stack);
            throw error;
        }
    }
}

const openaiService = new OpenAIService('your-api-key-here');
