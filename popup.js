// Popup script to display analysis results

// Debug logging functionality
const debugLogs = [];
const MAX_LOGS = 100;

// Initialize debug panel
let debugVisible = false;

// Add debug log
function addDebugLog(message, type = 'info') {
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
        const time = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `${time} ${message}`;
        debugPanel.appendChild(logEntry);
        debugPanel.scrollTop = debugPanel.scrollHeight;
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Show loading state
function showLoading() {
    clearLoading(); // Clear any existing loading states first
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.className = 'loading-state';
        resultsDiv.innerHTML = `
            <div class="loading">Analyzing email</div>
            <div class="progress-bar-container">
                <div class="progress-bar"></div>
            </div>
        `;
        resultsDiv.style.display = 'block';
    }
}

// Clear loading state
function clearLoading() {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.className = '';
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'none';
    }
}

// Display error message
function showError(message) {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        clearLoading();
        resultsDiv.className = 'error-state';
        resultsDiv.innerHTML = `
            <div class="error">
                ❌<br>
                ${message}
            </div>
        `;
        resultsDiv.style.display = 'block';
    }
    addDebugLog(`Error: ${message}`, 'error');
}

// Display analysis results
function displayAnalysis(data) {
    console.log('Displaying analysis data:', data);
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) {
        console.error('Results div not found');
        return;
    }

    try {
        clearLoading();
        resultsDiv.className = 'analysis-complete';
        
        // Convert credibility scores to percentages
        const trustworthyScore = Math.round(data.credibility.trustworthy * 100);
        const objectiveScore = Math.round(data.credibility.objective * 100);
        
        resultsDiv.innerHTML = `
            <div class="section">
                <h3>Credibility Scores</h3>
                <div class="meter-container">
                    <label>Trustworthy Source</label>
                    <div class="meter" style="width: ${trustworthyScore}%"></div>
                    <span>${trustworthyScore}%</span>
                    <div class="reason">${data.credibility.trustworthyReason}</div>
                </div>
                <div class="meter-container">
                    <label>Objectivity</label>
                    <div class="meter" style="width: ${objectiveScore}%"></div>
                    <span>${objectiveScore}%</span>
                    <div class="reason">${data.credibility.objectiveReason}</div>
                </div>
            </div>
            
            <div class="section">
                <h3>Political Leaning</h3>
                <div class="political-gauge">
                    <div class="political-marker" style="left: ${((data.politicalBias + 1) * 50)}%"></div>
                </div>
                <div class="political-labels">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                </div>
            </div>

            <div class="section">
                <h3>Structure Analysis</h3>
                <p>Format: ${data.structureAnalysis.format}</p>
                <p>Paragraphs: ${data.structureAnalysis.paragraphs}</p>
                <p>Readability: ${data.structureAnalysis.readability}</p>
            </div>
        `;
        resultsDiv.style.display = 'block';
        addDebugLog('Analysis display complete');
    } catch (error) {
        console.error('Error displaying analysis:', error);
        addDebugLog('Error displaying analysis: ' + error.message, 'error');
        showError('Error displaying analysis results');
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    addDebugLog('🚀 Popup opened, initializing...');
    
    // Setup debug panel toggle
    const toggleDebug = document.getElementById('toggleDebug');
    if (toggleDebug) {
        toggleDebug.addEventListener('click', () => {
            const debugPanel = document.getElementById('debugPanel');
            if (debugPanel) {
                debugVisible = !debugVisible;
                debugPanel.style.display = debugVisible ? 'block' : 'none';
                addDebugLog('Debug panel visibility toggled');
            }
        });
    }
    
    // Show initial loading state
    showLoading();
    
    // Get active tab
    addDebugLog('Getting active tab...');
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        
        if (!activeTab) {
            throw new Error('No active tab found');
        }

        // Request email content from content script
        addDebugLog('Requesting email content from content script...');
        chrome.tabs.sendMessage(activeTab.id, { type: 'GET_EMAIL_CONTENT' }, async (response) => {
            try {
                if (chrome.runtime.lastError) {
                    throw new Error(chrome.runtime.lastError.message);
                }

                if (!response) {
                    throw new Error('No response from content script');
                }

                addDebugLog('Got email content: ' + (response.body ? '...' : 'none'));
                
                // Send to background for analysis
                addDebugLog('Sending to background for analysis...');
                chrome.runtime.sendMessage({ type: 'ANALYZE_EMAIL', data: response }, (analysisResponse) => {
                    try {
                        if (chrome.runtime.lastError) {
                            throw new Error(chrome.runtime.lastError.message);
                        }

                        if (!analysisResponse) {
                            throw new Error('No analysis response received');
                        }

                        if (analysisResponse.error) {
                            throw new Error(analysisResponse.error);
                        }

                        addDebugLog('Got analysis response');
                        console.log('Analysis response:', analysisResponse);
                        
                        // Display the analysis
                        displayAnalysis(analysisResponse.analysis);

                    } catch (error) {
                        addDebugLog('Analysis error: ' + error.message, 'error');
                        showError(error.message);
                    }
                });
            } catch (error) {
                addDebugLog('Content script error: ' + error.message, 'error');
                showError(error.message);
            }
        });
    } catch (error) {
        addDebugLog('Initialization error: ' + error.message, 'error');
        showError(error.message);
    }
});
