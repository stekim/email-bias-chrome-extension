// Content script for Gmail integration
console.log('🚀 Email Bias Analyzer loaded');

// Extract email content when requested
function getEmailContent() {
    console.log('🔍 Starting email content extraction...');

    // Find the email container
    const emailContainers = [
        'div[role="main"] div[data-message-id]',
        'div[role="main"] .h7',
        'div[role="main"] .gs',
        '.adn.ads'
    ];

    let emailContainer = null;
    for (const selector of emailContainers) {
        emailContainer = document.querySelector(selector);
        if (emailContainer) {
            console.log(`📧 Found email container with selector: ${selector}`);
            break;
        }
    }

    if (!emailContainer) {
        console.log('❌ No email container found');
        // Try to find content in iframes
        const iframes = document.querySelectorAll('iframe');
        console.log(`🔍 Checking ${iframes.length} iframes...`);
        
        for (const iframe of iframes) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                for (const selector of emailContainers) {
                    emailContainer = iframeDoc.querySelector(selector);
                    if (emailContainer) {
                        console.log(`📧 Found email container in iframe with selector: ${selector}`);
                        break;
                    }
                }
                if (emailContainer) break;
            } catch (e) {
                console.log('⚠️ Cannot access iframe content:', e.message);
            }
        }
        
        if (!emailContainer) {
            console.log('❌ No email container found in main document or iframes');
            return null;
        }
    }

    // Try different selectors for email body
    const bodySelectors = [
        'div[dir="ltr"]',
        'div[data-message-id] div[class*="message-content"]',
        'div[data-message-id] div[aria-label*="Message Body"]',
        'div[data-message-id] div[role="textbox"]',
        '.a3s.aiL .ii.gt',
        '.a3s.aiL',
        '.adP.adO',
        '[role="textbox"]',
        '.gmail_quote',
        '.message-content'
    ];

    let emailBody = '';
    let usedSelector = '';
    for (const selector of bodySelectors) {
        const bodyElements = emailContainer.querySelectorAll(selector);
        for (const element of bodyElements) {
            const text = element.textContent?.trim();
            if (text && text.length > emailBody.length) {
                emailBody = text;
                usedSelector = selector;
                console.log(`📝 Found longer email body with selector: ${selector} (length: ${text.length})`);
            }
        }
    }

    if (!emailBody) {
        console.log('❌ No email body found with any selector');
        console.log('Available content:', emailContainer.textContent?.trim().substring(0, 100) + '...');
        return null;
    }

    // Get metadata
    const subjectSelectors = [
        'h2[data-thread-perm-id]',
        '.hP',
        '[data-thread-id]',
        '.thread-subject'
    ];
    
    const senderSelectors = [
        'span[email]',
        '.gD',
        '.sender',
        '[data-hovercard-id]'
    ];

    let subject = '';
    for (const selector of subjectSelectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
            subject = element.textContent.trim();
            console.log(`📌 Found subject with selector: ${selector}`);
            break;
        }
    }

    let sender = '';
    let name = '';
    for (const selector of senderSelectors) {
        const element = emailContainer.querySelector(selector);
        if (element) {
            sender = element.getAttribute('email') || element.getAttribute('data-hovercard-id') || '';
            name = element.textContent?.trim() || '';
            console.log(`👤 Found sender with selector: ${selector}`);
            break;
        }
    }

    const emailData = {
        body: emailBody,
        subject: subject,
        sender: sender,
        name: name,
        id: emailContainer.getAttribute('data-message-id') || Date.now().toString()
    };

    console.log('📊 Email data extracted:', {
        bodyLength: emailData.body.length,
        subject: emailData.subject,
        sender: emailData.sender,
        id: emailData.id,
        usedBodySelector: usedSelector
    });

    return emailData;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📩 Received message:', request.type);
    
    if (request.type === 'GET_EMAIL_CONTENT') {
        const content = getEmailContent();
        console.log('📤 Sending email content:', content ? `found (${content.body.length} chars)` : 'not found');
        sendResponse(content);
    }
    return true;
});
