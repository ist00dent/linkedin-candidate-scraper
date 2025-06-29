// background.js
let totalCandidatesCounter = 0;
let seen = new Set();

// Handle extension icon click - open interface in new tab
chrome.action.onClicked.addListener((tab) => {
    // Check if the interface is already open
    chrome.tabs.query({url: chrome.runtime.getURL('popup.html')}, (tabs) => {
        if (tabs.length > 0) {
            // If already open, focus the existing tab
            chrome.tabs.update(tabs[0].id, {active: true});
            chrome.windows.update(tabs[0].windowId, {focused: true});
        } else {
            // Open new tab with the interface
            chrome.tabs.create({
                url: 'popup.html',
                active: true
            });
        }
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openProfileAndScrapeExperience') {
        openProfileAndScrapeExperience(message.url).then(data => {
            sendResponse({ success: true, data });
        }).catch(error => {
            sendResponse({ success: false, error: error.message || error });
        });
        return true;
    }
    if (message.action === 'scrapingProgress') {
        const progress = (message.current / message.total) * 100;
        // progressBar.style.width = progress + '%'; // UI is handled in popup, not background
    }
    if (message.action === 'candidatesCountUpdate') {
        candidateCount.textContent = message.totalCandidates;
        updateUI();
        chrome.storage.local.set({scrapeProgress: message.totalCandidates});
    }
    if (message.action === 'scrapingCompleted') {
        // Show notification when scraping completes
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzQyZDM4NSIvPgo8cGF0aCBkPSJNMTggMjRMMjIgMjhMMzAgMjAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
            title: 'LinkedIn Scraper',
            message: `Scraping completed! Found ${message.candidateCount} candidates. Excel file automatically downloaded. Click to reopen the extension.`
        });
    }
});

// Handle notification click to reopen popup
chrome.notifications.onClicked.addListener(() => {
    // This will reopen the popup when notification is clicked
    chrome.action.openPopup();
});

async function openProfileAndScrapeExperience(url) {
    return new Promise((resolve, reject) => {
        chrome.tabs.create({ url, active: false }, async (tab) => {
            if (!tab || !tab.id) return reject('Failed to open tab');
            const tabId = tab.id;
            // Wait for tab to load
            const checkLoaded = setInterval(() => {
                chrome.tabs.get(tabId, t => {
                    if (!t) return;
                    if (t.status === 'complete') {
                        clearInterval(checkLoaded);
                        // Inject script to scrape details
                        chrome.scripting.executeScript({
                            target: { tabId },
                            func: () => {
                                // Scrape experience section
                                function getExperience() {
                                    const expSection = document.querySelector('section h3, h2, h1, .t-16, .t-20');
                                    let experiences = [];
                                    const expLists = document.querySelectorAll('section h3, h2, h1, .t-16, .t-20');
                                    // Try to find all <ul> under Experience
                                    document.querySelectorAll('section').forEach(section => {
                                        if (/experience/i.test(section.textContent)) {
                                            section.querySelectorAll('li.display-flex').forEach(li => {
                                                const jobTitle = li.querySelector('p.t-14.t-black')?.innerText?.trim() || '';
                                                const company = li.querySelector('p.t-14.t-black--light')?.innerText?.trim() || '';
                                                const duration = li.querySelector('p.t-12.t-black--light span[aria-hidden="true"]')?.innerText?.trim() || '';
                                                const companyLink = li.querySelector('a[href*="/company/"]')?.href || '';
                                                experiences.push({ jobTitle, company, duration, companyLink });
                                            });
                                        }
                                    });
                                    return experiences;
                                }
                                // Scrape must-have qualifications
                                function getMustHaveQualifications() {
                                    let mustHave = [];
                                    document.querySelectorAll('.hiring-screening-questions__content-wrapper ul li').forEach(li => {
                                        const question = li.querySelector('p.t-14')?.innerText?.trim() || '';
                                        const ideal = li.querySelector('p.t-12.t-black--light span:last-child')?.innerText?.trim() || '';
                                        const answer = li.querySelector('p.t-14.t-bold.mt1')?.innerText?.trim() || '';
                                        mustHave.push({ question, ideal, answer });
                                    });
                                    return mustHave;
                                }
                                // Scrape current company and duration
                                function getCurrentCompanyInfo() {
                                    const exp = getExperience();
                                    if (!exp.length) return { currentCompany: '', currentDuration: '' };
                                    // Assume first is current
                                    const current = exp.find(e => /present/i.test(e.duration));
                                    return {
                                        currentCompany: current?.company || '',
                                        currentDuration: current?.duration || ''
                                    };
                                }
                                return {
                                    experience: getExperience(),
                                    mustHaveQualifications: getMustHaveQualifications(),
                                    ...getCurrentCompanyInfo(),
                                    url: window.location.href
                                };
                            },
                        }, (results) => {
                            if (chrome.runtime.lastError) {
                                chrome.tabs.remove(tabId);
                                return reject(chrome.runtime.lastError.message);
                            }
                            try {
                                const [result] = results;
                                chrome.tabs.remove(tabId);
                                resolve(result.result);
                            } catch (err) {
                                chrome.tabs.remove(tabId);
                                reject(err);
                            }
                        });
                    }
                });
            }, 1000);
            // Timeout after 20s
            setTimeout(() => {
                clearInterval(checkLoaded);
                chrome.tabs.remove(tabId);
                reject('Timeout loading tab');
            }, 20000);
        });
    });
}

// This function runs in the context of the profile page
function scrapeExperienceFromProfilePage() {
    // Try to find the experience section (works for both classic and new LinkedIn UI)
    let experiences = [];
    let currentCompany = '';
    let currentCompanyDuration = '';
    // Look for experience section by heading or aria-label
    let expSection = document.querySelector('[id*=experience], section[aria-label*="Experience" i]');
    if (expSection) {
        let expItems = expSection.querySelectorAll('li, .pvs-entity__path-node');
        expItems.forEach(item => {
            let jobTitle = '';
            let company = '';
            let duration = '';
            // Try to extract job title
            let titleElem = item.querySelector('span[aria-hidden="true"], .t-14.t-bold, .mr1.t-bold');
            if (titleElem) jobTitle = titleElem.textContent.trim();
            // Try to extract company
            let companyElem = item.querySelector('span.t-14.t-normal, .t-14.t-normal, .t-14.t-black.t-normal');
            if (companyElem) company = companyElem.textContent.trim();
            // Try to extract duration
            let durationElem = item.querySelector('.t-14.t-normal.t-black--light, .pvs-entity__caption');
            if (durationElem) duration = durationElem.textContent.trim();
            experiences.push({ jobTitle, company, duration });
        });
        // Try to find current company (usually the first experience)
        if (experiences.length > 0) {
            currentCompany = experiences[0].company;
            currentCompanyDuration = experiences[0].duration;
        }
    }
    return { experiences, currentCompany, currentCompanyDuration };
}

chrome.storage.local.get(['scrapeProgress'], function(result) {
    if (typeof result.scrapeProgress === 'number') {
        candidateCount.textContent = result.scrapeProgress;
        updateUI();
    }
});

async function scrapeAllCandidatesWithDetailsAndPaginate() {
    let maxCandidatesPerPage = 25;
    let stableTries = 0;
    let lastCount = 0;
    let maxWait = 15000; // 15 seconds max
    let waited = 0;
    let container = document.querySelector('.hiring-applicants__list');
    while (waited < maxWait) {
        let itemsNow = Array.from(document.querySelectorAll('.hiring-applicants__list-item a[href*=\"/detail/\"]'));
        if (itemsNow.length >= maxCandidatesPerPage) break;
        if (itemsNow.length > 0 && itemsNow.length === lastCount) {
            stableTries++;
        } else {
            stableTries = 0;
        }
        lastCount = itemsNow.length;
        if (container) container.scrollTop = container.scrollHeight;
        if (stableTries >= 2 && itemsNow.length > 0) break;
        await sleep(500);
        waited += 500;
    }
} 