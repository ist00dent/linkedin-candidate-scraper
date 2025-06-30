// LinkedIn Candidate Scraper Content Script

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('LinkedIn Candidate Scraper initialized');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startScraping') {
        scrapeCandidates().then(result => {
            sendResponse(result);
        }).catch(error => {
            console.error('Scraping error:', error);
            sendResponse({success: false, error: error.message});
        });
        return true; // Keep message channel open for async response
    }
    
    if (message.action === 'exportToExcel') {
        exportToExcel(message.candidates);
        sendResponse({success: true});
    }

    if (message.action === 'scrapeAllAndExport') {
        scrapeAllPagesAndExport().then(result => {
            sendResponse(result);
        }).catch(error => {
            console.error('Scraping all pages error:', error);
            sendResponse({success: false, error: error.message});
        });
        return true;
    }

    if (message.action === 'scrapeAllCandidatesWithDetailsAndExport') {
        console.log('[Scraper] Received scrapeAllCandidatesWithDetailsAndExport message');
        scrapeAllCandidatesWithDetailsAndPaginate().then(candidates => {
            console.log('[Scraper] Scraping completed successfully');
            console.log('[Scraper] Total candidates found:', candidates ? candidates.length : 0);
            
            // Automatically export to Excel when scraping completes
            if (candidates && candidates.length > 0) {
                console.log(`[Scraper] Scraping completed. Found ${candidates.length} candidates. Auto-exporting to Excel...`);
                try {
                    exportToExcel(candidates);
                    console.log('[Scraper] Auto-export initiated successfully');
                } catch (exportError) {
                    console.error('[Scraper] Auto-export failed:', exportError);
                }
            } else {
                console.log('[Scraper] No candidates found, skipping auto-export');
            }
            sendResponse({ success: true, candidates });
        }).catch(error => {
            console.error('[Scraper] Scraping failed:', error);
            sendResponse({ success: false, error: error.message || error });
        });
        return true;
    }
});

// Listen for messages in the content script (profile page)
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'scrapeProfileLocationAndConnection') {
            const data = extractProfileLocationAndConnection();
            sendResponse(data);
        }
    });
}

async function scrapeAllPages() {
    let allCandidates = [];
    let page = 1;
    while (true) {
        // Scrape current page
        const { candidates } = await scrapeCandidates();
        allCandidates = allCandidates.concat(candidates);

        // Try to find and click the next page button
        const nextBtn = document.querySelector('.artdeco-pagination__button--next:not([disabled]):not([aria-disabled="true"])');
        if (!nextBtn || nextBtn.disabled || nextBtn.getAttribute('disabled')) {
            break; // No more pages
        }
        nextBtn.click();
        await sleep(2000); // Wait for next page to load (adjust as needed)
        page++;
    }
    return allCandidates;
}

async function scrapeCandidates() {
    try {
        const candidates = [];
        await waitForElement('.hiring-applicants__list-item', 10000);
        let applicantCards = Array.from(document.querySelectorAll('.hiring-applicants__list-item'));
        if (applicantCards.length === 0) {
            const selectors = [
                '[data-view-name="applicant-list"] .application-outlet',
                '.applications-list .application-outlet',
                '[data-view-name="applicant-list"] .artdeco-entity-lockup',
                '.job-details-jobs-unified-top-card__content .application-outlet',
                '.application-outlet',
                '.artdeco-entity-lockup'
            ];
            for (const selector of selectors) {
                applicantCards = document.querySelectorAll(selector);
                if (applicantCards.length > 0) {
                    console.log(`Found ${applicantCards.length} candidates using selector: ${selector}`);
                    break;
                }
            }
        }
        if (applicantCards.length === 0) {
            const alternativeSelectors = [
                '[data-test-id*="applicant"]',
                '[aria-label*="applicant" i]',
                '.application-card',
                '.candidate-card'
            ];
            for (const selector of alternativeSelectors) {
                applicantCards = document.querySelectorAll(selector);
                if (applicantCards.length > 0) {
                    console.log(`Found ${applicantCards.length} candidates using alternative selector: ${selector}`);
                    break;
                }
            }
        }
        if (applicantCards.length === 0) {
            const errorMsg = 'No candidate cards found. Make sure you are on the job applicants page.';
            alert(errorMsg);
            console.error(errorMsg);
            return {success: false, error: errorMsg};
        }
        for (let i = 0; i < applicantCards.length; i++) {
            try {
                const card = applicantCards[i];
                const candidate = await extractCandidateInfo(card, i);
                if (candidate.name) {
                    candidates.push(candidate);
                }
                chrome.runtime.sendMessage({
                    action: 'scrapingProgress',
                    current: i + 1,
                    total: applicantCards.length
                });
                await sleep(100);
            } catch (error) {
                const errorMsg = `Error processing candidate ${i}: ${error.message}`;
                alert(errorMsg);
                console.error(errorMsg, error);
            }
        }
        console.log(`Successfully scraped ${candidates.length} candidates`);
        return {success: true, candidates: candidates};
    } catch (error) {
        const errorMsg = `Scraping failed: ${error.message}`;
        alert(errorMsg);
        console.error(errorMsg, error);
        return {success: false, error: errorMsg};
    }
}

async function extractCandidateInfo(card, index, page = 1) {
    const candidate = {
        id: index + 1,
        page: page,
        name: '',
        title: '',
        company: '',
        location: '',
        connection: '',
        profileUrl: '',
        education: '',
        experience: '',
        skills: '',
        applicationDate: '',
        summary: '',
        image: '',
        mustHaveQualifications: ''
    };
    try {
        // New selectors for the latest LinkedIn UI
        // Name
        let nameElem = card.querySelector('.artdeco-entity-lockup__title, .hiring-people-card__title');
        if (nameElem) candidate.name = nameElem.textContent.trim();
        // Profile URL
        let seeProfileBtn = card.querySelector('.hiring-profile-highlights__see-full-profile a[href*="/in/"]');
        if (seeProfileBtn) {
            candidate.profileUrl = seeProfileBtn.href.startsWith('http') ? seeProfileBtn.href : (window.location.origin + seeProfileBtn.getAttribute('href'));
        }
        // Robust: Try to get the profile URL from the main card link if not already set
        if (!candidate.profileUrl) {
            let mainProfileLink = card.querySelector('a[href*="/in/"]');
            if (mainProfileLink) {
                candidate.profileUrl = mainProfileLink.href.startsWith('http') ? mainProfileLink.href : (window.location.origin + mainProfileLink.getAttribute('href'));
            }
        }
        // Image
        let imgElem = card.querySelector('img');
        if (imgElem) candidate.image = imgElem.src;
        // Title (headline)
        let titleElem = card.querySelector('.artdeco-entity-lockup__metadata, .hiring-applicants__list-item .artdeco-entity-lockup__metadata');
        if (titleElem) candidate.title = titleElem.textContent.trim();
        // Experience (list)
        let expList = card.querySelectorAll('.artdeco-entity-lockup__caption ul li, .artdeco-entity-lockup__caption li');
        if (expList.length > 0) {
            candidate.experience = Array.from(expList).map(li => li.textContent.trim()).join(' | ');
        } else {
            // fallback: try to get from .artdeco-entity-lockup__caption
            let expElem = card.querySelector('.artdeco-entity-lockup__caption');
            if (expElem) candidate.experience = expElem.textContent.trim();
        }
        // Education (try to find university/college lines)
        let eduElem = Array.from(card.querySelectorAll('.artdeco-entity-lockup__caption li, .artdeco-entity-lockup__caption')).find(el => /university|college|bachelor|master/i.test(el.textContent));
        if (eduElem) candidate.education = eduElem.textContent.trim();
        // Application date
        let dateElem = card.querySelector('.hiring-applicant-insights__separator');
        if (dateElem) candidate.applicationDate = dateElem.textContent.trim();
        // Must-have qualifications rate
        let qualElem = card.querySelector('span');
        if (qualElem && /must-have qualifications/i.test(qualElem.textContent)) {
            candidate.mustHaveQualifications = qualElem.textContent.trim();
        } else {
            // Try to find in any span in the card
            let spans = card.querySelectorAll('span');
            for (let span of spans) {
                if (/must-have qualifications/i.test(span.textContent)) {
                    candidate.mustHaveQualifications = span.textContent.trim();
                    break;
                }
            }
        }
        // Fallbacks for old selectors (keep existing logic)
        if (!candidate.name) {
            const nameOnlySelectors = [
                '.application-outlet__name',
                '.artdeco-entity-lockup__title',
                'h3',
                'h4',
                '.name'
            ];
            for (const selector of nameOnlySelectors) {
                const nameElement = card.querySelector(selector);
                if (nameElement) {
                    candidate.name = nameElement.textContent?.trim() || '';
                    break;
                }
            }
        }
        // Clean up
        candidate.name = cleanText(candidate.name);
        candidate.title = cleanText(candidate.title);
        candidate.company = cleanText(candidate.company);
        candidate.location = cleanText(candidate.location);
        candidate.education = cleanText(candidate.education);
        candidate.experience = cleanText(candidate.experience);
        candidate.applicationDate = cleanText(candidate.applicationDate);
        candidate.mustHaveQualifications = cleanText(candidate.mustHaveQualifications);
    } catch (error) {
        console.error('Error extracting candidate info:', error);
    }
    // Extract location from the card DOM (second .artdeco-entity-lockup__metadata)
    let metadataElems = card.querySelectorAll('.artdeco-entity-lockup__metadata');
    if (metadataElems.length > 1) {
        candidate.location = metadataElems[1].textContent.trim();
    } else if (metadataElems.length === 1) {
        candidate.location = metadataElems[0].textContent.trim();
    }
    
    // New location extraction logic based on the actual DOM structure
    if (!candidate.location || candidate.location === '') {
        // Try the specific selector for location
        let locationElem = card.querySelector('.XmoKNQbeEZDnMurvyayVmxYNBFuWiY .text-body-small.inline.t-black--light.break-words');
        if (locationElem) {
            candidate.location = locationElem.textContent.trim();
        } else {
            // Fallback: try alternative selectors for location
            const locationSelectors = [
                '.text-body-small.inline.t-black--light.break-words',
                '.t-black--light.break-words',
                '.text-body-small.t-black--light',
                '[class*="text-body-small"][class*="t-black--light"]',
                '.artdeco-entity-lockup__metadata .t-black--light',
                '.hiring-applicants__list-item .t-black--light'
            ];
            
            for (const selector of locationSelectors) {
                const elem = card.querySelector(selector);
                if (elem && elem.textContent.trim()) {
                    candidate.location = elem.textContent.trim();
                    break;
                }
            }
        }
    }
    // Extract profile URL from the card's <a> tag
    let profileLink = card.closest('li.hiring-applicants__list-item')?.querySelector('a.hiring-applicants-list-item__link, a.ember-view');
    if (profileLink) {
        candidate.profileUrl = profileLink.href;
    }
    return candidate;
}

function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

async function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function exportToExcel(candidates) {
    console.log('[Excel Export] Starting export process...');
    console.log('[Excel Export] Number of candidates:', candidates.length);
    
    // Check if XLSX is loaded
    if (typeof XLSX === 'undefined') {
        console.error('[Excel Export] XLSX library is not loaded!');
        alert('XLSX library is not loaded. Please check your extension installation.');
        return;
    }
    console.log('[Excel Export] XLSX library is loaded successfully');
    performExport(candidates);
}

function performExport(candidates) {
    console.log('[Excel Export] performExport called with', candidates.length, 'candidates');
    try {
        // Prepare data for Excel
        console.log('[Excel Export] Preparing worksheet data...');
        const worksheetData = candidates.map(candidate => ({
            'ID': candidate.id,
            'Page': candidate.page,
            'Name': candidate.name,
            'Location': candidate.location,
            'Connection': candidate.connection,
            'Title': candidate.title,
            'Company': candidate.company,
            'Education': candidate.education,
            'Experience': candidate.experience,
            'Application Date': candidate.applicationDate,
            'Must-Have Qualifications': candidate.mustHaveQualifications,
            'Full Profile URL': candidate.fullProfileUrl,
            'Email': candidate.email,
            'Phone': candidate.phone,
            'Scraped Date': candidate.scrapedDate,
            'Scraped Time': candidate.scrapedTime
        }));
        console.log('[Excel Export] Worksheet data prepared. Sample entry:', worksheetData[0]);
        
        // Create workbook and worksheet
        console.log('[Excel Export] Creating workbook and worksheet...');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(worksheetData);
        console.log('[Excel Export] Workbook and worksheet created successfully');
        
        // Set column widths
        const colWidths = [
            {wch: 5},   // ID
            {wch: 5},   // Page
            {wch: 25},  // Name
            {wch: 25},  // Location
            {wch: 10},  // Connection
            {wch: 30},  // Title
            {wch: 25},  // Company
            {wch: 30},  // Education
            {wch: 30},  // Experience
            {wch: 15},  // Application Date
            {wch: 40},  // Must-Have Qualifications
            {wch: 50},  // Full Profile URL
            {wch: 30},  // Email
            {wch: 20},  // Phone
            {wch: 15},  // Scraped Date
            {wch: 10}   // Scraped Time
        ];
        ws['!cols'] = colWidths;
        console.log('[Excel Export] Column widths set');
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'LinkedIn Candidates');
        console.log('[Excel Export] Worksheet added to workbook');
        
        // Extract job title for filename
        let jobTitle = '';
        const jobTitleElem = document.querySelector('.artdeco-entity-lockup__title, .hiring-people-card__title, .t-16.t-bold.t-black.mr2');
        if (jobTitleElem) {
            // If it's a <p> with a <span> for a11y, get the text after the span
            if (jobTitleElem.tagName === 'P' && jobTitleElem.querySelector('span.a11y-text')) {
                jobTitle = jobTitleElem.textContent.replace(jobTitleElem.querySelector('span.a11y-text').textContent, '').trim();
            } else {
                jobTitle = jobTitleElem.textContent.trim();
            }
        }
        // Fallback: try to find a <p> with class t-16 t-bold t-black
        if (!jobTitle) {
            const altTitleElem = document.querySelector('p.t-16.t-bold.t-black');
            if (altTitleElem) {
                jobTitle = altTitleElem.textContent.trim();
            }
        }
        // Sanitize for filename
        if (jobTitle) {
            jobTitle = jobTitle.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '_');
        }
        console.log('[Excel Export] Job title for filename:', jobTitle);
        
        // Generate Excel file
        const filename = jobTitle
            ? `${jobTitle}_linkedin_candidates_${new Date().toISOString().split('T')[0]}.xlsx`
            : `linkedin_candidates_${new Date().toISOString().split('T')[0]}.xlsx`;
        console.log('[Excel Export] Generated filename:', filename);
        
        console.log('[Excel Export] About to write file...');
        XLSX.writeFile(wb, filename);
        console.log('[Excel Export] File written successfully!');
        
        console.log(`[Excel Export] Excel file exported: ${filename}`);
        
    } catch (error) {
        console.error('[Excel Export] Excel export error:', error);
        console.error('[Excel Export] Error stack:', error.stack);
        alert('Error exporting to Excel: ' + error.message);
    }
}

// Helper to robustly find the next page button
function getNextPageButton() {
    // Try button
    let btn = document.querySelector('.artdeco-pagination__button--next:not([disabled]):not([aria-disabled="true"])');
    if (btn && btn.offsetParent !== null) return btn;
    // Try <li> with button inside
    let liBtn = document.querySelector('li.artdeco-pagination__indicator--next button:not([disabled]):not([aria-disabled="true"])');
    if (liBtn && liBtn.offsetParent !== null) return liBtn;
    // Try any visible next button
    let allNexts = Array.from(document.querySelectorAll('button,li')).filter(el =>
        /next/i.test(el.textContent) && !el.disabled && el.getAttribute('aria-disabled') !== 'true' && el.offsetParent !== null
    );
    return allNexts[0] || null;
}

// Scrape all pages and export
async function scrapeAllPagesAndExport() {
    try {
        let allCandidates = [];
        let page = 1;
        while (true) {
            const { candidates } = await scrapeCandidates();
            allCandidates = allCandidates.concat(candidates);
            // Try to find and click the next page button
            const nextBtn = getNextPageButton();
            if (!nextBtn) {
                console.log('No next page button found. Stopping pagination.');
                break;
            }
            console.log('Clicking next page button for page', page + 1);
            nextBtn.scrollIntoView();
            nextBtn.click();
            await sleep(2000); // Wait for next page to load
            page++;
        }
        exportToExcel(allCandidates);
        return { success: true, candidates: allCandidates };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Helper to click the next pagination button (numbered)
function clickNextPaginationButton() {
    // Find the active page indicator
    const activeLi = document.querySelector('.artdeco-pagination__indicator.active.selected');
    if (!activeLi) return false;
    // Find the next sibling that is a page button (not ellipsis)
    let nextLi = activeLi.nextElementSibling;
    while (nextLi && !nextLi.querySelector('button')) {
        nextLi = nextLi.nextElementSibling;
    }
    if (nextLi && nextLi.querySelector('button')) {
        nextLi.querySelector('button').click();
        return true;
    }
    return false; // No next page
}

// Scrape all candidates with detail info and auto-pagination
async function scrapeAllCandidatesWithDetailsAndPaginate() {
    let allCandidates = [];
    let page = 1;
    let hasNext = true;
    let lastName = '';
    while (hasNext) {
        console.log(`[Scraper] Scraping page ${page}...`);
        // Wait for candidates to load
        await waitForElement('.hiring-applicants__list-item', 10000);
        // Wait for candidate cards to stabilize and try to get all (e.g., 25)
        let maxCandidatesPerPage = 25;
        let stableTries = 0;
        let lastCount = 0;
        let maxWait = 10000; // 10 seconds max
        let waited = 0;
        let container = document.querySelector('.hiring-applicants__list');
        let hasNextPage = !!document.querySelector('.artdeco-pagination__button--next:not([disabled]):not([aria-disabled="true"])');
        while (waited < maxWait) {
            let itemsNow = Array.from(document.querySelectorAll('.hiring-applicants__list-item a[href*="/detail/"]'));
            if (hasNextPage) {
                // If there is a next page, require 25 candidates before proceeding
                if (itemsNow.length >= maxCandidatesPerPage) break;
            } else {
                // If no next page, break if stable
                if (itemsNow.length > 0 && itemsNow.length === lastCount) {
                    stableTries++;
                } else {
                    stableTries = 0;
                }
                if (stableTries >= 2) break;
            }
            lastCount = itemsNow.length;
            if (container) container.scrollTop = container.scrollHeight;
            await sleep(500);
            waited += 500;
        }
        // After waiting, check if we should proceed
        const items = Array.from(document.querySelectorAll('.hiring-applicants__list-item a[href*="/detail/"]'));
        if (hasNextPage && items.length < maxCandidatesPerPage) {
            console.warn(`[Scraper] Only ${items.length} candidates loaded but next page exists. Not proceeding to next page until 25 are loaded or timeout.`);
            break;
        }
        if (!items.length) throw new Error('No candidate links found on page ' + page);
        for (let idx = 0; idx < items.length; idx++) {
            const a = items[idx];
            let candidate = null;
            let attempts = 0;
            let success = false;
            while (attempts < 3 && !success) {
                try {
                    a.scrollIntoView({behavior: 'smooth', block: 'center'});
                    a.click();
                    await waitForElement('#hiring-detail-root', 10000);
                    let detailRoot = document.querySelector('.artdeco-modal__content') || document.body;
                    candidate = await scrapeCandidateDetailFromModal(`page ${page} id ${idx + 1}`, lastName, true);
                    if (candidate.email) {
                        const emailMatch = candidate.email.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                        if (emailMatch) candidate.email = emailMatch[0];
                    }
                    candidate = await scrapeCandidateDetailFromModal(`page ${page} id ${idx + 1}`, lastName, false, candidate);
                    if (candidate.email) {
                        const emailMatch = candidate.email.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                        if (emailMatch) candidate.email = emailMatch[0];
                    }
                    lastName = candidate.name;
                    // Retry if any required field is empty, up to 3 times
                    if ((!candidate.email || !candidate.phone || !candidate.mustHaveQualifications) && attempts < 2) {
                        console.warn(`[Scraper] Retrying candidate page ${page} id ${idx + 1} due to missing fields. Attempt ${attempts + 1}`);
                        let closeBtn = document.querySelector('.artdeco-modal__dismiss, button[aria-label="Dismiss"], .artdeco-modal__actionbar button, .scaffold-layout__detail button[aria-label="Back"]');
                        if (closeBtn) {
                            closeBtn.click();
                        } else {
                            document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', keyCode: 27, which: 27}));
                        }
                        await sleep(1000);
                        attempts++;
                        continue;
                    }
                    allCandidates.push(candidate);
                    console.log(`[Scraper] Candidate page ${page} id ${idx + 1}:`, candidate);
                    success = true;
                } catch (err) {
                    attempts++;
                    if (attempts < 3) {
                        console.warn(`[Scraper] Retry ${attempts} for candidate at index ${idx} due to error:`, err);
                        let closeBtn = document.querySelector('.artdeco-modal__dismiss, button[aria-label="Dismiss"], .artdeco-modal__actionbar button, .scaffold-layout__detail button[aria-label="Back"]');
                        if (closeBtn) {
                            closeBtn.click();
                        } else {
                            document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', keyCode: 27, which: 27}));
                        }
                        await sleep(1000);
                        continue;
                    } else {
                        console.error(`[Scraper] Error scraping candidate at index ${idx} after 3 attempts:`, err);
                        allCandidates.push({ id: `page ${page} id ${idx + 1}`, error: String(err) });
                        let closeBtn = document.querySelector('.artdeco-modal__dismiss, button[aria-label="Dismiss"], .artdeco-modal__actionbar button, .scaffold-layout__detail button[aria-label="Back"]');
                        if (closeBtn) {
                            closeBtn.click();
                        } else {
                            document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', keyCode: 27, which: 27}));
                        }
                        await sleep(1000);
                    }
                }
            }
        }
        chrome.storage.local.set({scrapeProgress: allCandidates.length});
        hasNextPage = clickNextPaginationButton();
        if (hasNextPage) {
            console.log(`[Scraper] Clicking next page button for page ${page + 1}`);
            await new Promise(res => setTimeout(res, 3000));
            page++;
        } else {
            console.log('[Scraper] No next page button found. Stopping pagination.');
            hasNext = false;
        }
    }
    return allCandidates;
}

// Helper function to parse education into "schoolname, course, year" format
function parseEducation(educationText) {
    if (!educationText) return '';
    // Only use the first entry
    const entry = educationText.split('|').map(e => e.trim()).filter(e => e)[0] || '';
    // (Pattern matching logic remains the same)
    const patterns = [
        /^([^,]+?)\s+(Bachelor's|Master's|PhD|Diploma|Certificate|Associate's|High School|MBA|BSc|MSc|BA|MA|PhD|Ph\.D\.|Doctorate|Postgraduate|Undergraduate|Honours degree|degree|Education|Academy|Institute|College|University|School)[^,]*,\s*([^,]+?)\s+Years attended from (\d{4}) to (\d{4})/i,
        /^([^,]+?)\s+([^,]+?)\s+Years attended from (\d{4}) to (\d{4})/i,
        /^([^,]+?)\s+([^,]+?)\s+(\d{4})\s*–\s*(\d{4})/i,
        /^([^,]+?)\s+([^,]+?)\s+(\d{4})\s+to\s+(\d{4})/i
    ];
    for (const pattern of patterns) {
        const match = entry.match(pattern);
        if (match) {
            const schoolName = match[1].trim();
            const course = match[2].trim();
            const startYear = match[3];
            const endYear = match[4];
            return `${schoolName}, ${course}, ${startYear} – ${endYear}`;
        }
    }
    return entry;
}

// Helper function to parse experience into "title, company, year" format
function parseExperience(experienceText) {
    if (!experienceText) return '';
    // Only use the first entry
    const entry = experienceText.split('|').map(e => e.trim()).filter(e => e)[0] || '';
    const patterns = [
        /^([^,]+?)\s+([^,]+?)\s+Years employed from (\d{4}) to (\d{4}|Present)/i,
        /^([^,]+?)\s+([^,]+?)\s+(\d{4})\s*–\s*(\d{4}|Present)/i,
        /^([^,]+?)\s+([^,]+?)\s+(\d{4})\s+to\s+(\d{4}|Present)/i,
        /^([^,]+?)\s+at\s+([^,]+?)\s+(\d{4})\s*–\s*(\d{4}|Present)/i
    ];
    for (const pattern of patterns) {
        const match = entry.match(pattern);
        if (match) {
            const title = match[1].trim();
            const company = match[2].trim();
            const startYear = match[3];
            const endYear = match[4];
            return `${title}, ${company}, ${startYear} – ${endYear}`;
        }
    }
    return entry;
}

// Helper function to clean phone numbers - extract only digits and remove duplicate country codes
function cleanPhoneNumber(phoneText) {
    if (!phoneText) return '';
    
    // Remove all non-digit characters except +
    let cleaned = phoneText.replace(/[^\d+]/g, '');
    
    // Remove duplicate country codes (e.g., +63+63 becomes +63)
    cleaned = cleaned.replace(/(\+\d+)\1+/g, '$1');
    
    // If it starts with multiple + signs, keep only the first one
    cleaned = cleaned.replace(/^\++/, '+');
    
    return cleaned;
}

// Update scrapeCandidateDetailFromModal for latest 2 educations/experiences, clean Application Date, and Must-Have Qualifications
async function scrapeCandidateDetailFromModal(id, lastName = '', onlyProfileAndContact = false, candidateObj = null) {
    // Define detailRoot as the modal/profile root element
    let detailRoot = document.querySelector('.artdeco-modal__content') || document.body;
    // Parse id and page from id string
    let pageNum = 1, idNum = 1;
    const idMatch = /page (\d+) id (\d+)/i.exec(id);
    if (idMatch) {
        pageNum = parseInt(idMatch[1], 10);
        idNum = parseInt(idMatch[2], 10);
    }
    let candidate = candidateObj || {
        id: idNum,
        page: pageNum,
        name: '',
        title: '',
        company: '',
        location: '',
        connection: '',
        education: '',
        experience: '',
        applicationDate: '',
        mustHaveQualifications: '',
        fullProfileUrl: '',
        email: '',
        phone: '',
        scrapedDate: '',
        scrapedTime: ''
    };
    
    // Add timestamp when scraping this candidate
    function getCurrentDateTime() {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        return { date, time };
    }
    const { date, time } = getCurrentDateTime();
    candidate.scrapedDate = date;
    candidate.scrapedTime = time;
    
    try {
        let moreBtn = Array.from(detailRoot.querySelectorAll('button.artdeco-dropdown__trigger')).find(btn => /more…/i.test(btn.textContent));
        if (moreBtn) {
            moreBtn.click();
            await sleep(500);
        }
        let dropdown = null;
        for (let i = 0; i < 10; i++) {
            dropdown = detailRoot.querySelector('.artdeco-dropdown__content-inner ul');
            if (dropdown) break;
            await sleep(200);
        }
        if (dropdown) {
            let profileA = dropdown.querySelector('a[href*="/in/"]');
            if (profileA) candidate.fullProfileUrl = profileA.href;
            let emailSpan = Array.from(dropdown.querySelectorAll('span')).find(span => /@/.test(span.textContent));
            if (emailSpan) candidate.email = emailSpan.textContent.trim();
            let phoneSpan = Array.from(dropdown.querySelectorAll('span')).find(span => /\+\d{6,}/.test(span.textContent));
            if (phoneSpan) {
                const match = phoneSpan.textContent.match(/\+\d{6,}/);
                candidate.phone = match ? match[0] : phoneSpan.textContent.trim();
            }
        }
        if (onlyProfileAndContact) {
            candidate.fullProfileUrl = cleanText(candidate.fullProfileUrl);
            candidate.email = cleanText(candidate.email);
            candidate.phone = cleanText(candidate.phone);
            return candidate;
        }
        Array.from(detailRoot.querySelectorAll('button, a')).forEach(btn => {
            if (/show \d+ more experiences?/i.test(btn.textContent) || /show \d+ more education/i.test(btn.textContent)) {
                btn.click();
            }
        });
        await sleep(500);
        let nameElem = detailRoot.querySelector('h1');
        if (nameElem) {
            let rawName = nameElem.childNodes[0]?.textContent.trim() || nameElem.textContent.trim();
            // Remove anything after '’' or 'application' or 'degree connection'
            let cleanName = rawName.split('’')[0].split('application')[0].split('degree connection')[0].trim();
            candidate.name = cleanText(cleanName);
        }
        let titleElem = detailRoot.querySelector('h1 + div .t-16');
        if (titleElem) candidate.title = titleElem.textContent.trim();
        // Application Date: remove 'Applied' word
        let appDateElem = detailRoot.querySelector('.hiring-applicant-header__tidbit');
        if (appDateElem) {
            let dateText = appDateElem.textContent.trim();
            candidate.applicationDate = cleanText(dateText.replace(/^Applied\s*/i, ''));
        }
        // Experience: only 2 latest
        let expSection = Array.from(detailRoot.querySelectorAll('section')).find(sec => /experience/i.test(sec.textContent));
        let companyNamesArr = [];
        if (expSection) {
            const expLis = Array.from(expSection.querySelectorAll('li')).filter(li => !li.classList.contains('visually-hidden'));
            const latestExpLis = expLis.slice(0, 2); // Only 2 latest
            candidate.experience = latestExpLis.map(li => li.textContent.trim()).join(' | ');
            latestExpLis.forEach(li => {
                let companyElems = li.querySelectorAll('p.t-14.t-black--light');
                let companyName = '';
                if (companyElems.length > 1) {
                    companyName = companyElems[1].textContent.trim();
                } else if (companyElems.length === 1) {
                    companyName = companyElems[0].textContent.trim();
                }
                if (companyName) {
                    companyNamesArr.push(companyName);
                }
            });
        }
        candidate.company = companyNamesArr.join(', ');
        // Education: only 2 latest
        let eduSection = Array.from(detailRoot.querySelectorAll('section')).find(sec => /education/i.test(sec.textContent));
        if (eduSection) {
            const eduLis = Array.from(eduSection.querySelectorAll('li')).filter(li => !li.classList.contains('visually-hidden'));
            const latestEduLis = eduLis.slice(0, 2); // Only 2 latest
            candidate.education = latestEduLis.map(li => li.textContent.trim()).join(' | ');
        }
        // Must-have qualifications: only keep ideal and applicant answer, not the question
        let qualSection = Array.from(detailRoot.querySelectorAll('h3')).find(h3 => /must-have qualifications/i.test(h3.textContent));
        if (qualSection) {
            let qualList = qualSection.parentElement.querySelectorAll('ul li, div');
            let seen = new Set();
            let qualText = Array.from(qualList).map(li => {
                let ideal = li.querySelector('p.t-12.t-black--light span:last-child')?.innerText?.trim() || '';
                let applicant = li.querySelector('p.t-14.t-bold.mt1')?.innerText?.replace(/Applicant answer/i, '').trim() || '';
                if (ideal && applicant) {
                    let entry = `Ideal answer: ${ideal} | Applicant answer: ${applicant}`;
                    if (!seen.has(entry)) {
                        seen.add(entry);
                        return entry;
                    }
                    return null;
                }
                // fallback: previous logic
                let match = li.textContent.match(/Ideal answer:[^\n]*Applicant answer[^\n]*/i);
                if (match && match[0].trim()) {
                    let entry = match[0].trim();
                    if (!seen.has(entry)) {
                        seen.add(entry);
                        return entry;
                    }
                }
                return null;
            }).filter(Boolean).join(' | ');
            candidate.mustHaveQualifications = qualText;
        }
        
        // Format education and experience according to requirements
        candidate.education = parseEducation(candidate.education);
        candidate.experience = parseExperience(candidate.experience);
        
        candidate.title = cleanText(candidate.title);
        candidate.company = cleanText(candidate.company);
        candidate.education = cleanText(candidate.education);
        candidate.experience = cleanText(candidate.experience);
        candidate.applicationDate = cleanText(candidate.applicationDate);
        candidate.mustHaveQualifications = cleanText(candidate.mustHaveQualifications);
        candidate.fullProfileUrl = cleanText(candidate.fullProfileUrl);
        candidate.email = cleanText(candidate.email);
        candidate.phone = cleanPhoneNumber(candidate.phone);
        
        console.log(`[Scraper] Candidate ${candidate.id} scraped at ${candidate.scrapedDate} ${candidate.scrapedTime}:`, candidate.name);
        
        // After scraping all main info, only open profile tab if location or connection is missing
        if ((candidate.location === '' || candidate.connection === '') && candidate.fullProfileUrl && typeof chrome !== 'undefined' && chrome.runtime) {
            console.log('[Scraper] Location or connection missing, requesting background to open fullProfileUrl tab for:', candidate.fullProfileUrl);
            // Ask background to open the profile and scrape location/connection
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    action: 'scrapeProfileLocationAndConnectionFromTab',
                    url: candidate.fullProfileUrl
                }, function(response) {
                    if (response && response.success && response.data) {
                        console.log('[Scraper] Received profile data:', response.data);
                        if (candidate.location === '') candidate.location = response.data.location;
                        if (candidate.connection === '') candidate.connection = response.data.connection;
                    } else {
                        console.warn('[Scraper] Failed to get profile data for', candidate.fullProfileUrl, response);
                    }
                    resolve(candidate);
                });
            });
        } else {
            if (candidate.location && candidate.connection) {
                console.log('[Scraper] Location and connection already present, no need to open profile tab.');
            } else {
                console.warn('[Scraper] No fullProfileUrl or chrome.runtime not available for', candidate);
            }
        }
        
    } catch (error) {
        console.error('Error extracting candidate detail info:', error);
    }
    return candidate;
}

// Update extractConnectionFromProfileDOM to use the correct selector
function extractConnectionFromProfileDOM() {
    // Try to find the connection badge in the profile modal
    let badge = document.querySelector('.artdeco-entity-lockup__badge .a11y-text');
    if (badge && /([0-9]+)[a-z]{2} degree connection/i.test(badge.textContent)) {
        let match = badge.textContent.match(/([0-9]+)[a-z]{2} degree connection/i);
        return match ? match[1] : '';
    }
    // Fallback: try to find the degree in the .artdeco-entity-lockup__degree
    let degree = document.querySelector('.artdeco-entity-lockup__degree');
    if (degree && /([0-9]+)[a-z]{2}/i.test(degree.textContent)) {
        let match = degree.textContent.match(/([0-9]+)[a-z]{2}/i);
        return match ? match[1] : '';
    }
    return '';
}

// In the content script for the profile page, robustly extract location and connection
function extractProfileLocationAndConnection() {
    // Location
    let location = '';
    const locationSpans = Array.from(document.querySelectorAll('span.text-body-small.inline.t-black--light.break-words'));
    for (const span of locationSpans) {
        const text = span.textContent.trim();
        // Heuristic: location is usually not empty, not an email, not a phone, not a button
        if (text && text.length > 2 && !text.match(/@|\d{3,}/)) {
            location = text;
            break;
        }
    }

    // Connection
    let connection = '';
    const connectionLis = Array.from(document.querySelectorAll('li.text-body-small'));
    for (const li of connectionLis) {
        if (li.textContent.toLowerCase().includes('connections')) {
            const bold = li.querySelector('span.t-bold');
            if (bold) {
                connection = bold.textContent.trim().replace('+', '');
            }
            break;
        }
    }

    return { location, connection };
} 