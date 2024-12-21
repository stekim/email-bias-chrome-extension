// Popup script to display analysis results

// Debug logging functionality
const debugLogs = [];
const MAX_LOGS = 100;

function addDebugLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    debugLogs.unshift({ timestamp, message, type });
    
    if (debugLogs.length > MAX_LOGS) {
        debugLogs.pop();
    }
    
    updateDebugDisplay();
    console.log(`${type.toUpperCase()}: ${message}`);
}

function updateDebugDisplay() {
    const debugPanel = document.getElementById('debugPanel');
    if (!debugPanel) return;

    debugPanel.innerHTML = debugLogs.map(log => `
        <div class="log-entry ${log.type}">
            <span class="timestamp">${log.timestamp}</span>
            ${log.message}
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    addDebugLog('🚀 Popup opened, initializing...');
    
    // Create initial UI with debug panel
    document.body.innerHTML = `
        <div class="container">
            <div class="analysis-container">
                <div class="loading">Analyzing email...</div>
            </div>
            <div class="debug-controls">
                <button id="toggleDebug">Show/Hide Debug Info</button>
                <button id="clearLogs">Clear Logs</button>
            </div>
            <div id="debugPanel" class="debug-panel"></div>
        </div>
    `;

    // Set up debug panel controls
    document.getElementById('toggleDebug')?.addEventListener('click', () => {
        const debugPanel = document.getElementById('debugPanel');
        if (debugPanel) {
            debugPanel.classList.toggle('visible');
            addDebugLog('Debug panel visibility toggled');
        }
    });

    document.getElementById('clearLogs')?.addEventListener('click', () => {
        debugLogs.length = 0;
        updateDebugDisplay();
        addDebugLog('Debug logs cleared');
    });
    
    try {
        // Get active tab
        addDebugLog('Getting active tab...');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Get email content from content script
        addDebugLog('Requesting email content from content script...');
        chrome.tabs.sendMessage(tab.id, { type: 'GET_EMAIL_CONTENT' }, async (emailContent) => {
            if (chrome.runtime.lastError) {
                const error = chrome.runtime.lastError;
                addDebugLog(`Error getting email content: ${error.message}`, 'error');
                showError('Please open an email to analyze.');
                return;
            }

            if (!emailContent) {
                addDebugLog('No email content found', 'warning');
                showError('No email content found. Please open an email to analyze.');
                return;
            }

            addDebugLog(`Got email content: ${emailContent.body.substring(0, 50)}...`);

            // Send to background script for analysis
            addDebugLog('Sending to background for analysis...');
            chrome.runtime.sendMessage({ 
                type: 'ANALYZE_EMAIL',
                data: emailContent 
            }, (response) => {
                if (chrome.runtime.lastError) {
                    const error = chrome.runtime.lastError;
                    addDebugLog(`Analysis error: ${error.message}`, 'error');
                    showError('Analysis failed. Please try again.');
                    return;
                }

                if (!response) {
                    addDebugLog('No response received from background', 'error');
                    showError('No response received from analysis.');
                    return;
                }

                if (response.error) {
                    addDebugLog(`Analysis error: ${response.error}`, 'error');
                    showError(response.error);
                    return;
                }

                addDebugLog(`Raw response: ${JSON.stringify(response)}`);

                if (!response.analysis) {
                    addDebugLog('No analysis data in response', 'error');
                    showError('No analysis results available.');
                    return;
                }

                const analysis = response.analysis;
                
                // Validate analysis structure with correct property names
                if (!analysis.credibility || !analysis.politicalBias || !analysis.structureAnalysis) {
                    addDebugLog('Invalid analysis structure', 'error');
                    showError('Invalid analysis data structure.');
                    return;
                }

                addDebugLog('Analysis complete, displaying results...');
                displayAnalysis(analysis);
            });
        });
    } catch (error) {
        addDebugLog(`Error: ${error.message}`, 'error');
        showError('Failed to initialize. Please try again.');
    }
});

function showError(message) {
    addDebugLog(`Error: ${message}`, 'error');
    const container = document.querySelector('.analysis-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <div class="error-text">${message}</div>
            </div>
        `;
    }
}

function displayAnalysis(analysis) {
    addDebugLog('Displaying analysis results');
    
    const container = document.querySelector('.analysis-container');
    if (!container) {
        addDebugLog('Could not find analysis container', 'error');
        return;
    }

    // Map the data structure to match our UI
    const data = {
        credibility: {
            trustworthy: analysis.credibility?.trustworthy || 0,
            objective: analysis.credibility?.objective || 0
        },
        political: {
            conservative: analysis.politicalBias?.conservative || 0,
            liberal: analysis.politicalBias?.liberal || 0
        },
        structure: {
            format: analysis.structureAnalysis?.format || 'Unknown',
            paragraphs: analysis.structureAnalysis?.paragraphs || 0,
            readability: analysis.structureAnalysis?.readability || 'Unknown'
        },
        metadata: {
            timestamp: analysis.metadata?.timestamp || Date.now()
        }
    };

    addDebugLog(`Processed analysis data: ${JSON.stringify(data)}`);
    
    container.innerHTML = `
        <div class="results">
            <h2>Email Bias Analysis</h2>
            
            <div class="section">
                <h3>Credibility Scores</h3>
                <div class="meter-container">
                    <label>Trustworthy</label>
                    <div class="meter" style="width: ${data.credibility.trustworthy * 100}%"></div>
                    <span>${(data.credibility.trustworthy * 100).toFixed(1)}%</span>
                </div>
                <div class="meter-container">
                    <label>Objective</label>
                    <div class="meter" style="width: ${data.credibility.objective * 100}%"></div>
                    <span>${(data.credibility.objective * 100).toFixed(1)}%</span>
                </div>
            </div>

            <div class="section">
                <h3>Political Bias</h3>
                <div class="meter-container">
                    <label>Conservative</label>
                    <div class="meter" style="width: ${data.political.conservative * 100}%"></div>
                    <span>${(data.political.conservative * 100).toFixed(1)}%</span>
                </div>
                <div class="meter-container">
                    <label>Liberal</label>
                    <div class="meter" style="width: ${data.political.liberal * 100}%"></div>
                    <span>${(data.political.liberal * 100).toFixed(1)}%</span>
                </div>
            </div>

            <div class="section">
                <h3>Structure Analysis</h3>
                <p>Format: ${data.structure.format}</p>
                <p>Paragraphs: ${data.structure.paragraphs}</p>
                <p>Readability: ${data.structure.readability}</p>
            </div>

            <div class="footer">
                <small>Analysis time: ${new Date(data.metadata.timestamp).toLocaleString()}</small>
            </div>
        </div>
    `;
    addDebugLog('Analysis display complete');
}
