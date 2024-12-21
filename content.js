// Content script for Gmail integration
console.log('🚀 Email Bias Analyzer loaded');

// Extract email content when requested
function getEmailContent() {
    // Find the email container
    const emailContainer = document.querySelector('div[role="main"] div[data-message-id]');
    if (!emailContainer) {
        console.log('No email container found');
        return null;
    }

    // Try different selectors for email body
    const bodySelectors = [
        'div[dir="ltr"]',
        'div[data-message-id] div[class*="message-content"]',
        'div[data-message-id] div[aria-label*="Message Body"]',
        'div[data-message-id] div[role="textbox"]'
    ];

    let emailBody = '';
    for (const selector of bodySelectors) {
        const bodyElement = emailContainer.querySelector(selector);
        if (bodyElement?.textContent) {
            emailBody = bodyElement.textContent.trim();
            console.log(`Found email body with selector: ${selector}`);
            break;
        }
    }

    if (!emailBody) {
        console.log('No email body found with any selector');
        return null;
    }

    const emailData = {
        body: emailBody,
        subject: document.querySelector('h2[data-thread-perm-id]')?.textContent?.trim() || '',
        sender: emailContainer.querySelector('span[email]')?.getAttribute('email') || '',
        name: emailContainer.querySelector('span[email]')?.textContent?.trim() || '',
        id: emailContainer.getAttribute('data-message-id')
    };

    console.log('Email data extracted:', {
        bodyLength: emailData.body.length,
        subject: emailData.subject,
        sender: emailData.sender,
        id: emailData.id
    });

    return emailData;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request.type);
    
    if (request.type === 'GET_EMAIL_CONTENT') {
        const content = getEmailContent();
        console.log('Sending email content:', content ? 'found' : 'not found');
        sendResponse(content);
    }
    return true;
});
