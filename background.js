// Background script for email bias analyzer
import { OpenAIService } from './services/openai-service.js';

// Background service worker
let openaiService = null;

// Initialize OpenAI service
async function initializeServices() {
    try {
        // Get API key from config first
        const configScript = await fetch(chrome.runtime.getURL('config.js'));
        const configText = await configScript.text();
        
        // Extract API key using regex
        const apiKeyMatch = configText.match(/OPENAI_API_KEY:\s*['"]([^'"]+)['"]/);
        const modelMatch = configText.match(/OPENAI_MODEL:\s*['"]([^'"]+)['"]/);
        
        if (!apiKeyMatch) {
            throw new Error('OpenAI API key not found in config.js');
        }

        const apiKey = apiKeyMatch[1];
        const model = modelMatch ? modelMatch[1] : 'gpt-4-turbo-preview';

        // Store in chrome.storage
        await chrome.storage.local.set({
            OPENAI_API_KEY: apiKey,
            OPENAI_MODEL: model
        });

        // Initialize service
        openaiService = new OpenAIService(apiKey, model);
        console.log('✅ Background services initialized');
        return true;
    } catch (error) {
        console.error('❌ Service initialization error:', error);
        return false;
    }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Received message:', request.type, request.data);
    
    switch (request.type) {
        case 'ANALYZE_EMAIL':
            handleEmailAnalysis(request.data, sendResponse);
            return true; // Keep channel open for async response
            
        case 'CHECK_CONNECTION':
            sendResponse({ status: 'ok' });
            return false;
            
        default:
            console.warn('⚠️ Unknown message type:', request.type);
            sendResponse({ error: 'Unknown message type' });
            return false;
    }
});

// Handle email analysis
async function handleEmailAnalysis(emailData, sendResponse) {
    try {
        if (!openaiService) {
            const initialized = await initializeServices();
            if (!initialized) {
                throw new Error('Failed to initialize OpenAI service');
            }
        }
        
        if (!emailData) {
            throw new Error('No email data provided');
        }

        if (!emailData.body || emailData.body.trim().length === 0) {
            throw new Error('No email content found in the current view');
        }

        console.log('📧 Analyzing email:', {
            subject: emailData.subject,
            bodyLength: emailData.body.length,
            sender: emailData.sender,
            id: emailData.id
        });

        const analysis = await openaiService.analyzeEmailBias(emailData.body);
        
        // Add metadata
        analysis.metadata = {
            timestamp: new Date().toISOString(),
            emailId: emailData.id,
            subject: emailData.subject
        };
        
        console.log('✅ Analysis complete:', analysis);
        sendResponse({ analysis });
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        sendResponse({ error: error.message });
    }
}

// Initialize on install/update
chrome.runtime.onInstalled.addListener(async () => {
    console.log('🔄 Extension installed/updated');
    await initializeServices();
});
