document.addEventListener('DOMContentLoaded', function() {
    const scrapeBtn = document.getElementById('scrapeBtn');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const closeBtn = document.getElementById('closeBtn');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const candidateCount = document.getElementById('candidateCount');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const candidatesList = document.getElementById('candidatesList');
    
    let candidates = [];
    let isScrapingInProgress = false;
    
    const logArea = document.createElement('div');
    logArea.id = 'logArea';
    logArea.style.background = 'rgba(0,0,0,0.2)';
    logArea.style.color = '#fff';
    logArea.style.fontSize = '12px';
    logArea.style.padding = '8px';
    logArea.style.marginTop = '10px';
    logArea.style.borderRadius = '6px';
    logArea.style.maxHeight = '120px';
    logArea.style.overflowY = 'auto';
    document.body.appendChild(logArea);

    // Find and update the deepScrapeBtn
    let deepScrapeBtn = document.getElementById('deepScrapeBtn');
    if (!deepScrapeBtn) {
        // If not present, create it
        deepScrapeBtn = document.createElement('button');
        deepScrapeBtn.id = 'deepScrapeBtn';
        document.body.insertBefore(deepScrapeBtn, document.getElementById('logArea'));
    }
    deepScrapeBtn.textContent = 'Start Scraping';
    deepScrapeBtn.className = 'button primary';
    deepScrapeBtn.style.marginTop = '10px';

    // Remove old event listeners if any
    deepScrapeBtn.replaceWith(deepScrapeBtn.cloneNode(true));
    deepScrapeBtn = document.getElementById('deepScrapeBtn');

    // Attach the deep scrape handler to the new main button
    deepScrapeBtn.addEventListener('click', startDeepScraping);

    // Add close button event listener
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            // Save data before closing
            saveData().then(() => {
                window.close();
            });
        });
    }

    // Add minimize button event listener
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', function() {
            // Save data and close popup (scraping will continue in background)
            saveData().then(() => {
                logStep('Minimized to background. Scraping will continue...');
                window.close();
            });
        });
    }

    function logStep(msg) {
        const time = new Date().toLocaleTimeString();
        logArea.innerHTML += `[${time}] ${msg}<br/>`;
        logArea.scrollTop = logArea.scrollHeight;
    }
    
    // Load existing data
    loadStoredData();
    
    exportBtn.addEventListener('click', exportToExcel);
    clearBtn.addEventListener('click', clearData);
    
    // Save data periodically to ensure persistence
    setInterval(() => {
        if (candidates.length > 0) {
            saveData();
        }
    }, 5000); // Save every 5 seconds if there's data
    
    // Save data when popup is about to unload
    window.addEventListener('beforeunload', function() {
        if (candidates.length > 0) {
            saveData();
        }
    });
    
    async function startScraping() {
        if (isScrapingInProgress) return;
        logStep('Scrape button clicked.');
        try {
            isScrapingInProgress = true;
            if (scrapeBtn) scrapeBtn.disabled = true;
            if (scrapeBtn) scrapeBtn.textContent = 'Scraping...';
            progressContainer.style.display = 'block';
            logStep('Getting current tab...');
            // Get current tab
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            logStep('Tab URL: ' + (tab && tab.url));
            // Check if we're on LinkedIn
            if (!tab.url.includes('linkedin.com')) {
                logStep('Not on LinkedIn.');
                alert('Please navigate to a LinkedIn job post applicant page first.');
                return;
            }
            logStep('Sending scrape message to content script...');
            // Execute scraping script
            const results = await chrome.tabs.sendMessage(tab.id, {action: 'startScraping'});
            logStep('Received response from content script.');
            if (results.success) {
                logStep('Scraping successful. Candidates found: ' + results.candidates.length);
                candidates = results.candidates;
                await saveData();
                updateUI();
                
                if (candidates.length > 0) {
                    if (exportBtn) exportBtn.disabled = false;
                    displayCandidates();
                }
            } else {
                logStep('Scraping failed: ' + (results.error || 'Unknown error'));
                alert(results.error || 'Failed to scrape candidates. Make sure you are on the applicants page.');
            }
            
        } catch (error) {
            logStep('Exception: ' + error.message);
            console.error('Scraping error:', error);
            alert('Error occurred while scraping. Please try again.');
        } finally {
            isScrapingInProgress = false;
            if (scrapeBtn) scrapeBtn.disabled = false;
            if (scrapeBtn) scrapeBtn.textContent = 'Start Scraping';
            progressContainer.style.display = 'none';
        }
    }
    
    async function exportToExcel() {
        if (candidates.length === 0) {
            logStep('No candidates to export.');
            alert('No candidates to export.');
            return;
        }
        
        try {
            if (exportBtn) exportBtn.disabled = true;
            if (exportBtn) exportBtn.textContent = 'Exporting...';
            logStep('Sending exportToExcel message to content script...');
            // Send export request to content script
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            await chrome.tabs.sendMessage(tab.id, {
                action: 'exportToExcel',
                candidates: candidates
            });
            logStep('Export message sent.');
            
        } catch (error) {
            logStep('Export error: ' + error.message);
            console.error('Export error:', error);
            alert('Error exporting to Excel. Please try again.');
        } finally {
            if (exportBtn) exportBtn.disabled = false;
            if (exportBtn) exportBtn.textContent = 'Export to Excel';
        }
    }
    
    async function clearData() {
        candidates = [];
        await chrome.storage.local.clear();
        updateUI();
        candidatesList.style.display = 'none';
        if (exportBtn) exportBtn.disabled = true;
        logStep('Data cleared.');
    }
    
    async function loadStoredData() {
        try {
            logStep('Loading stored data...');
            const result = await chrome.storage.local.get(['candidates']);
            if (result.candidates && Array.isArray(result.candidates)) {
                candidates = result.candidates;
                logStep(`Loaded ${candidates.length} candidates from storage`);
                updateUI();
                if (candidates.length > 0) {
                    if (exportBtn) exportBtn.disabled = false;
                    displayCandidates();
                }
            } else {
                logStep('No stored data found');
            }
        } catch (error) {
            logStep('Error loading stored data: ' + error.message);
            console.error('Error loading stored data:', error);
        }
    }
    
    async function saveData() {
        try {
            await chrome.storage.local.set({candidates: candidates});
            logStep(`Saved ${candidates.length} candidates to storage`);
        } catch (error) {
            logStep('Error saving data: ' + error.message);
            console.error('Error saving data:', error);
        }
    }
    
    function updateUI() {
        candidateCount.textContent = candidates.length;
    }
    
    function displayCandidates() {
        if (candidates.length === 0) {
            candidatesList.style.display = 'none';
            return;
        }
        
        candidatesList.style.display = 'block';
        candidatesList.innerHTML = '';
        
        candidates.slice(0, 10).forEach(candidate => {
            const item = document.createElement('div');
            item.className = 'candidate-item';
            item.innerHTML = `
                <strong>${candidate.name || 'N/A'}</strong><br>
                <small>${candidate.title || 'N/A'}</small><br>
                <small>${candidate.company || 'N/A'}</small>
            `;
            candidatesList.appendChild(item);
        });
        
        if (candidates.length > 10) {
            const moreItem = document.createElement('div');
            moreItem.className = 'candidate-item';
            moreItem.innerHTML = `<em>... and ${candidates.length - 10} more candidates</em>`;
            candidatesList.appendChild(moreItem);
        }
    }
    
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'scrapingProgress') {
            const progress = (message.current / message.total) * 100;
            progressBar.style.width = progress + '%';
        }
        if (message.action === 'candidatesCountUpdate') {
            candidateCount.textContent = message.totalCandidates;
            updateUI();
        }
    });

    // Poll for scrapeProgress in storage every second while scraping is in progress
    let progressPoller = null;
    function startProgressPolling() {
        if (progressPoller) return;
        progressPoller = setInterval(() => {
            chrome.storage.local.get(['scrapeProgress'], function(result) {
                if (typeof result.scrapeProgress === 'number') {
                    candidateCount.textContent = result.scrapeProgress;
                    updateUI();
                }
            });
        }, 1000);
    }
    function stopProgressPolling() {
        if (progressPoller) {
            clearInterval(progressPoller);
            progressPoller = null;
        }
    }

    // Start polling when deep scraping starts
    async function startDeepScraping() {
        if (isScrapingInProgress) return;
        logStep('Deep scrape button clicked.');
        try {
            isScrapingInProgress = true;
            if (deepScrapeBtn) deepScrapeBtn.disabled = true;
            if (scrapeBtn) scrapeBtn.disabled = true;
            if (exportBtn) exportBtn.disabled = true;
            if (clearBtn) clearBtn.disabled = true;
            if (deepScrapeBtn) deepScrapeBtn.textContent = 'Scraping...';
            progressContainer.style.display = 'block';
            logStep('Getting current tab for deep scrape...');
            startProgressPolling();
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            logStep('Tab URL: ' + (tab && tab.url));
            if (!tab.url.includes('linkedin.com')) {
                logStep('Not on LinkedIn.');
                alert('Please navigate to a LinkedIn applicants page.');
                resetDeepScrapeBtn();
                stopProgressPolling();
                return;
            }
            logStep('Sending scrapeAllCandidatesWithDetailsAndExport message to content script...');
            chrome.tabs.sendMessage(tab.id, {action: 'scrapeAllCandidatesWithDetailsAndExport'}, async (results) => {
                logStep('Deep scrape message sent.');
                stopProgressPolling();
                if (results && results.success) {
                    candidates = results.candidates;
                    logStep(`Deep scrape completed. Found ${candidates.length} candidates.`);
                    await saveData(); // Save immediately
                    updateUI();
                    if (candidates.length > 0) {
                        if (exportBtn) exportBtn.disabled = false;
                        displayCandidates();
                        logStep('Excel file automatically downloaded!');
                    }
                    
                    // Send notification to background script
                    chrome.runtime.sendMessage({
                        action: 'scrapingCompleted',
                        candidateCount: candidates.length
                    });
                    
                    alert('Deep scrape completed and Excel file downloaded!');
                } else {
                    logStep('Deep scrape failed: ' + (results && results.error));
                    alert('Deep scrape failed: ' + (results && results.error));
                }
                resetDeepScrapeBtn();
            });
        } catch (err) {
            logStep('Exception during deep scrape: ' + err);
            alert('Exception during deep scrape: ' + err);
            stopProgressPolling();
            resetDeepScrapeBtn();
        }
    }

    function resetDeepScrapeBtn() {
        isScrapingInProgress = false;
        if (deepScrapeBtn) deepScrapeBtn.disabled = false;
        if (scrapeBtn) scrapeBtn.disabled = false;
        if (exportBtn) exportBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
        if (deepScrapeBtn) deepScrapeBtn.textContent = 'Start Scraping';
        progressContainer.style.display = 'none';
    }
}); 