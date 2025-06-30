// Dedicated content script for scraping LinkedIn profile connection number and location
(function() {
    console.log('[ProfileScraper] Content script loaded');
    const maxWait = 40000; // 40 seconds
    const pollInterval = 500;
    let start = Date.now();
    let logs = []; // Array to collect all logs

    function addLog(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        console.log(logEntry);
        logs.push(logEntry);
    }

    function extractConnection() {
        addLog('[ProfileScraper] ===== STARTING CONNECTION EXTRACTION =====');
        
        // Strategy -2: Direct targeting of the specific ul element with known classes
        const targetUl = document.querySelector('ul.SphwcEixfrGNowmlLIVCKpoTiOINwVPnRDM.RhVMdBYrxZODWmXAHqeyAggQBXKsGzdkxRvY');
        if (targetUl) {
            addLog('[ProfileScraper] Strategy -2: Found target ul element');
            addLog('[ProfileScraper] Strategy -2: Target ul text content: ' + targetUl.textContent);
            addLog('[ProfileScraper] Strategy -2: Target ul innerHTML: ' + targetUl.innerHTML.substring(0, 200) + '...');
            
            // Check if the content is loaded (should contain "connections" text)
            if (!targetUl.textContent.includes('connections')) {
                addLog('[ProfileScraper] Strategy -2: Connections not loaded yet, waiting...');
                return ''; // Return empty to trigger polling again
            }
            
            // Look for li.text-body-small within this ul
            const liElement = targetUl.querySelector('li.text-body-small');
            if (liElement) {
                addLog('[ProfileScraper] Strategy -2: Found li.text-body-small');
                addLog('[ProfileScraper] Strategy -2: li text content: ' + liElement.textContent);
                
                // Look for span.t-black--light within the li
                const blackLightSpan = liElement.querySelector('span.t-black--light');
                if (blackLightSpan && blackLightSpan.textContent.includes(' connections')) {
                    addLog('[ProfileScraper] Strategy -2: Found span with connections text: ' + blackLightSpan.textContent);
                    addLog('[ProfileScraper] Strategy -2: span.t-black--light HTML: ' + blackLightSpan.outerHTML);
                    
                    // Look for span.t-bold containing the number
                    const boldSpan = blackLightSpan.querySelector('span.t-bold');
                    if (boldSpan) {
                        const connection = boldSpan.textContent.trim();
                        addLog('[ProfileScraper] Strategy -2: Found connection in bold span: ' + connection);
                        addLog('[ProfileScraper] Strategy -2: span.t-bold HTML: ' + boldSpan.outerHTML);
                        
                        // Validate the connection count
                        const num = parseInt(connection);
                        if (num > 0 && num < 100000) {
                            addLog('[ProfileScraper] Strategy -2: Connection count validated: ' + connection);
                            return connection;
                        } else {
                            addLog('[ProfileScraper] Strategy -2: Connection count seems invalid: ' + connection);
                        }
                    } else {
                        addLog('[ProfileScraper] Strategy -2: No span.t-bold found in connections element');
                        const allSpans = blackLightSpan.querySelectorAll('span');
                        addLog('[ProfileScraper] Strategy -2: All spans in blackLightSpan: ' + allSpans.length);
                        allSpans.forEach((span, index) => {
                            addLog('[ProfileScraper] Strategy -2: Span ' + (index + 1) + ': ' + span.textContent.trim() + ' (classes: ' + span.className + ')');
                        });
                    }
                } else {
                    addLog('[ProfileScraper] Strategy -2: No span with connections text found in li');
                    const allSpans = liElement.querySelectorAll('span');
                    addLog('[ProfileScraper] Strategy -2: All spans in li: ' + allSpans.length);
                    allSpans.forEach((span, index) => {
                        addLog('[ProfileScraper] Strategy -2: Span ' + (index + 1) + ': ' + span.textContent.trim() + ' (classes: ' + span.className + ')');
                    });
                }
            } else {
                addLog('[ProfileScraper] Strategy -2: No li.text-body-small found in target ul');
                const allLis = targetUl.querySelectorAll('li');
                addLog('[ProfileScraper] Strategy -2: All li elements in target ul: ' + allLis.length);
                allLis.forEach((li, index) => {
                    addLog('[ProfileScraper] Strategy -2: li ' + (index + 1) + ': ' + li.textContent.trim() + ' (classes: ' + li.className + ')');
                });
            }
        } else {
            addLog('[ProfileScraper] Strategy -2: Target ul element not found');
            // Let's also check if there are any ul elements with similar class patterns
            const allUls = document.querySelectorAll('ul');
            addLog('[ProfileScraper] Strategy -2: All ul elements on page: ' + allUls.length);
            for (let i = 0; i < Math.min(allUls.length, 5); i++) {
                const ul = allUls[i];
                addLog('[ProfileScraper] Strategy -2: ul #' + (i + 1) + ' classes: ' + ul.className + ' text: ' + ul.textContent.substring(0, 100));
            }
        }
        
        addLog('[ProfileScraper] Strategy -2: No valid connection found, trying Strategy -1...');
        
        // Strategy -1: Most specific - target the exact structure we know works
        // Look for li.text-body-small > span.t-black--light > span.t-bold
        // Get the 4th occurrence of connections
        const specificLis = document.querySelectorAll('li.text-body-small');
        addLog('[ProfileScraper] Strategy -1: Found li.text-body-small elements: ' + specificLis.length);
        
        let connectionCount = 0;
        for (const li of specificLis) {
            const blackLightSpan = li.querySelector('span.t-black--light');
            if (blackLightSpan && blackLightSpan.textContent.includes(' connections')) {
                connectionCount++;
                addLog('[ProfileScraper] Strategy -1: Found connections element #' + connectionCount);
                addLog('[ProfileScraper] Strategy -1: Full li HTML: ' + li.outerHTML);
                addLog('[ProfileScraper] Strategy -1: span.t-black--light text: ' + blackLightSpan.textContent);
                
                // Get the 4th occurrence
                if (connectionCount === 4) {
                    const boldSpan = blackLightSpan.querySelector('span.t-bold');
                    if (boldSpan) {
                        const connection = boldSpan.textContent.trim();
                        addLog('[ProfileScraper] Strategy -1: 4TH CONNECTIONS - Found connection: ' + connection);
                        addLog('[ProfileScraper] Strategy -1: Bold span HTML: ' + boldSpan.outerHTML);
                        
                        // Validate that this looks like a reasonable connection count
                        const num = parseInt(connection);
                        if (num > 0 && num < 100000) { // Reasonable range for connections
                            addLog('[ProfileScraper] Strategy -1: Connection count validated: ' + connection);
                            return connection;
                        } else {
                            addLog('[ProfileScraper] Strategy -1: Connection count seems invalid: ' + connection);
                        }
                    } else {
                        addLog('[ProfileScraper] Strategy -1: No span.t-bold found in 4th connections element');
                    }
                }
            }
        }
        
        addLog('[ProfileScraper] Strategy -1: No valid connection found, trying Strategy 0...');
        
        // Strategy 0: Target the exact DOM structure from profile.txt
        // Look for span.t-black--light containing " connections" and get the span.t-bold inside it
        // Get the 4th occurrence
        const blackLightSpans = document.querySelectorAll('span.t-black--light');
        addLog('[ProfileScraper] Strategy 0: Found span.t-black--light elements: ' + blackLightSpans.length);
        
        connectionCount = 0;
        for (const span of blackLightSpans) {
            const text = span.textContent;
            if (text.includes(' connections') && !text.includes('degree')) {
                connectionCount++;
                addLog('[ProfileScraper] Strategy 0: Found span with " connections" text #' + connectionCount);
                addLog('[ProfileScraper] Strategy 0: Text content: ' + text);
                addLog('[ProfileScraper] Strategy 0: Full HTML of this span: ' + span.outerHTML);
                
                // Get the 4th occurrence
                if (connectionCount === 4) {
                    // Look for the bold span containing the number
                    const boldSpan = span.querySelector('span.t-bold');
                    if (boldSpan) {
                        const connection = boldSpan.textContent.trim();
                        addLog('[ProfileScraper] Strategy 0: 4TH CONNECTIONS - Found connection in bold span: ' + connection);
                        addLog('[ProfileScraper] Strategy 0: Bold span HTML: ' + boldSpan.outerHTML);
                        
                        // Validate the connection count - exclude JSON-like identifiers
                        const num = parseInt(connection);
                        if (num > 0 && num < 100000 && !connection.includes('Anon') && !connection.includes('com.linkedin')) {
                            addLog('[ProfileScraper] Strategy 0: Connection count validated: ' + connection);
                            return connection;
                        } else {
                            addLog('[ProfileScraper] Strategy 0: Connection count seems invalid or is an identifier: ' + connection);
                        }
                    } else {
                        addLog('[ProfileScraper] Strategy 0: No span.t-bold found within this span');
                    }
                }
            }
        }
        
        addLog('[ProfileScraper] Strategy 0: No valid connection found, trying Strategy 0.5...');
        
        // Strategy 0.5: Look for any element containing " connections" and find span.t-bold within it
        // But exclude JSON-like content
        const allElementsForConnections = document.querySelectorAll('*');
        addLog('[ProfileScraper] Strategy 0.5: Searching all elements for " connections" text...');
        addLog('[ProfileScraper] Strategy 0.5: Total elements to check: ' + allElementsForConnections.length);
        
        connectionCount = 0;
        let skippedElements = 0;
        for (const elem of allElementsForConnections) {
            const text = elem.textContent;
            // Skip elements that contain JSON-like content or type identifiers
            if (text.includes('"type":') || text.includes('Anon') || text.includes('com.linkedin')) {
                skippedElements++;
                if (skippedElements <= 5) { // Log first 5 skipped elements
                    addLog('[ProfileScraper] Strategy 0.5: Skipping element with JSON content: ' + text.substring(0, 100));
                }
                continue;
            }
            
            if (text.includes(' connections') && !text.includes('degree')) {
                connectionCount++;
                addLog('[ProfileScraper] Strategy 0.5: Found element with " connections" text #' + connectionCount);
                addLog('[ProfileScraper] Strategy 0.5: Element tag name: ' + elem.tagName + ' Classes: ' + elem.className);
                addLog('[ProfileScraper] Strategy 0.5: Text content: ' + text);
                addLog('[ProfileScraper] Strategy 0.5: Full HTML: ' + elem.outerHTML);
                
                // Look for the bold span containing the number
                const boldSpan = elem.querySelector('span.t-bold');
                if (boldSpan) {
                    const connection = boldSpan.textContent.trim();
                    addLog('[ProfileScraper] Strategy 0.5: Found connection in bold span: ' + connection);
                    addLog('[ProfileScraper] Strategy 0.5: Bold span HTML: ' + boldSpan.outerHTML);
                    
                    // Validate - exclude identifiers
                    const num = parseInt(connection);
                    if (num > 0 && num < 100000 && !connection.includes('Anon') && !connection.includes('com.linkedin')) {
                        addLog('[ProfileScraper] Strategy 0.5: Connection count validated: ' + connection);
                        return connection;
                    } else {
                        addLog('[ProfileScraper] Strategy 0.5: Connection count seems invalid or is an identifier: ' + connection);
                    }
                } else {
                    addLog('[ProfileScraper] Strategy 0.5: No span.t-bold found in this element');
                }
            }
        }
        
        addLog('[ProfileScraper] Strategy 0.5: Skipped ' + skippedElements + ' elements with JSON content');
        addLog('[ProfileScraper] Strategy 0.5: Found ' + connectionCount + ' elements with " connections" text');
        addLog('[ProfileScraper] ===== NO VALID CONNECTION FOUND =====');
        
        // Let's also log all span.t-bold elements to see what numbers are available
        addLog('[ProfileScraper] DEBUG: All span.t-bold elements on page:');
        const allBoldSpans = document.querySelectorAll('span.t-bold');
        for (let i = 0; i < Math.min(allBoldSpans.length, 10); i++) {
            const span = allBoldSpans[i];
            addLog('[ProfileScraper] DEBUG: span.t-bold #' + (i + 1) + ': ' + span.textContent.trim() + ' Parent: ' + span.parentElement?.tagName + ' ' + span.parentElement?.className);
        }
        
        return '';
    }

    function extractLocation() {
        addLog('[ProfileScraper] Extracting location...');
        
        // Try the specific selector for location from the profile page
        let locationElem = document.querySelector('.XmoKNQbeEZDnMurvyayVmxYNBFuWiY .text-body-small.inline.t-black--light.break-words');
        if (locationElem) {
            const location = locationElem.textContent.trim();
            addLog('[ProfileScraper] Found location with primary selector: ' + location);
            return location;
        }
        
        // Fallback: try alternative selectors for location
        const locationSelectors = [
            '.text-body-small.inline.t-black--light.break-words',
            '.t-black--light.break-words',
            '.text-body-small.t-black--light',
            '[class*="text-body-small"][class*="t-black--light"]',
            '.pv-text-details__left-panel .text-body-small',
            '.pv-top-card__non-self-picture-wrapper + div .text-body-small',
            '.pv-top-card__location',
            '.pv-top-card__location .text-body-small',
            '.pv-top-card__location .t-black--light',
            '.pv-top-card__location span',
            '.pv-top-card__location .break-words',
            '.pv-top-card__location .inline',
            '.pv-top-card__location .text-body-small.inline.t-black--light.break-words'
        ];
        
        for (const selector of locationSelectors) {
            const elem = document.querySelector(selector);
            if (elem && elem.textContent.trim()) {
                const location = elem.textContent.trim();
                addLog('[ProfileScraper] Found location with selector ' + selector + ': ' + location);
                return location;
            }
        }
        
        // Additional fallback: look for location in the top card area
        const topCardArea = document.querySelector('.pv-top-card__non-self-picture-wrapper, .pv-top-card__photo-wrapper');
        if (topCardArea) {
            const locationInTopCard = topCardArea.nextElementSibling?.querySelector('.text-body-small, .t-black--light');
            if (locationInTopCard && locationInTopCard.textContent.trim()) {
                const location = locationInTopCard.textContent.trim();
                addLog('[ProfileScraper] Found location in top card area: ' + location);
                return location;
            }
        }
        
        addLog('[ProfileScraper] No location found');
        return '';
    }

    function pollForData() {
        // Prioritize connection extraction first
        const connection = extractConnection();
        addLog('[ProfileScraper] Connection extraction result: ' + (connection || 'NOT FOUND'));
        
        // Only extract location if connection is found or we've timed out
        let location = '';
        if (connection || (Date.now() - start > maxWait)) {
            location = extractLocation();
            addLog('[ProfileScraper] Location extraction result: ' + (location || 'NOT FOUND'));
        }
        
        addLog('[ProfileScraper] Poll attempt - Connection: ' + connection + ' Location: ' + location);
        
        // If we have either connection or location, or if we've timed out, send the data
        if (connection || location || (Date.now() - start > maxWait)) {
            const data = {
                action: 'profileDataScraped',
                connection: connection || '',
                location: location || '',
                logs: logs // Include all logs in the response
            };
            
            addLog('[ProfileScraper] Sending final data to background: ' + JSON.stringify(data));
            
            // Send result to background
            chrome.runtime.sendMessage(data, function(response) {
                addLog('[ProfileScraper] Sent data to background: ' + JSON.stringify(data) + ' Response: ' + JSON.stringify(response));
            });
            return;
        }
        
        // Continue polling if we haven't found data and haven't timed out
        addLog('[ProfileScraper] No data found yet, continuing to poll...');
        setTimeout(pollForData, pollInterval);
    }

    pollForData();
})(); 