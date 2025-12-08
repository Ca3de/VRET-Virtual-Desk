// ALPS Data Fetcher - Content Script
// This script runs on web pages and handles communication between the page and extension

(function() {
  'use strict';

  // Check if we're on the ALPS page
  const isAlpsPage = window.location.hostname.includes('alps-basecamp.lamps.amazon.dev');

  // Check if we're on a page with Virtual Desk
  const isVirtualDeskPage = document.querySelector('.attendance-dashboard') !== null ||
                            document.querySelector('#alps-import-modal') !== null ||
                            document.title.includes('Virtual Desk') ||
                            document.title.includes('VRET');

  // Listen for messages from the background script (for ALPS page scraping)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeAlpsData' && isAlpsPage) {
      const data = scrapeAlpsPageData(request.date, request.department, request.shift);
      sendResponse({ data });
      return false;
    }
  });

  // Listen for messages from the webpage (Virtual Desk)
  window.addEventListener('message', async (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    if (event.data.type === 'ALPS_FETCH_REQUEST') {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'fetchAlpsData',
          date: event.data.date
        });

        window.postMessage({
          type: 'ALPS_FETCH_RESPONSE',
          success: response.success,
          data: response.data,
          error: response.error
        }, '*');
      } catch (error) {
        window.postMessage({
          type: 'ALPS_FETCH_RESPONSE',
          success: false,
          error: error.message
        }, '*');
      }
    }

    if (event.data.type === 'ALPS_AUTH_CHECK') {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'checkAlpsAuth'
        });

        window.postMessage({
          type: 'ALPS_AUTH_RESPONSE',
          authenticated: response.authenticated
        }, '*');
      } catch (error) {
        window.postMessage({
          type: 'ALPS_AUTH_RESPONSE',
          authenticated: false
        }, '*');
      }
    }
  });

  // Scrape data from the ALPS Daily View page
  function scrapeAlpsPageData(targetDate, department, shift) {
    const result = {
      volumeForecast: '',
      scheduled: '',
      absenceForecast: '',
      vto: '0',
      vet: '0',
      amazonReady: '',
      laborShare: '',
      date: targetDate,
      fetchedAt: new Date().toISOString()
    };

    try {
      // Find the correct date column
      const headerCells = document.querySelectorAll('th');
      let dateColumnIndex = -1;

      // Look for today's date or the target date in headers
      const targetDateObj = new Date(targetDate);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const targetMonthDay = `${monthNames[targetDateObj.getMonth()]} ${targetDateObj.getDate()}`;
      const targetDayName = dayNames[targetDateObj.getDay()];

      headerCells.forEach((cell, index) => {
        const cellText = cell.textContent.trim();
        if (cellText.includes(targetMonthDay) ||
            (cellText.includes(targetDayName) && cellText.includes(targetDateObj.getDate().toString()))) {
          dateColumnIndex = index;
        }
        // Also check for highlighted/current column
        if (cell.classList.contains('current') || cell.classList.contains('today') ||
            cell.closest('th[class*="current"]') || cell.closest('th[class*="today"]')) {
          dateColumnIndex = index;
        }
      });

      // If we couldn't find the date, try to find a highlighted column
      if (dateColumnIndex === -1) {
        const currentCell = document.querySelector('th.current, th.today, th[class*="highlight"]');
        if (currentCell) {
          const parent = currentCell.parentElement;
          if (parent) {
            dateColumnIndex = Array.from(parent.children).indexOf(currentCell);
          }
        }
      }

      // Default to column 8 if nothing found (typical position for current date)
      if (dateColumnIndex === -1) {
        dateColumnIndex = 8;
      }

      console.log('Using column index:', dateColumnIndex);

      // Find the rows and extract data
      const allRows = document.querySelectorAll('tr');

      allRows.forEach(row => {
        const firstCell = row.querySelector('td:first-child, th:first-child');
        if (!firstCell) return;

        const rowLabel = firstCell.textContent.trim();
        const cells = row.querySelectorAll('td, th');
        const valueCell = cells[dateColumnIndex];

        if (!valueCell) return;

        let value = valueCell.textContent.trim().replace(/,/g, '').replace(/[^\d.-]/g, '');

        // Map row labels to our data structure
        switch (rowLabel) {
          case 'Forecast':
            // Check if this is under Volume section
            const volumeParent = row.closest('[class*="volume"]') ||
                                  isInSection(row, 'Volume');
            if (volumeParent || isPreviousSiblingSection(row, 'Volume')) {
              result.volumeForecast = value;
            }
            break;
          case 'Scheduled':
            result.scheduled = value;
            break;
          case 'Absence Forecast':
            result.absenceForecast = value;
            break;
          case 'VTO':
            result.vto = value || '0';
            break;
          case 'VET':
            result.vet = value || '0';
            break;
          case 'Amazon Ready':
            result.amazonReady = value;
            break;
          case 'Labor Share':
            result.laborShare = value;
            break;
        }
      });

    } catch (error) {
      console.error('Error scraping ALPS page:', error);
    }

    return result;
  }

  // Helper function to check if row is in a specific section
  function isInSection(row, sectionName) {
    let prevSibling = row.previousElementSibling;
    while (prevSibling) {
      const text = prevSibling.textContent.trim();
      if (text.startsWith(sectionName) || text === sectionName) {
        return true;
      }
      // If we hit another section header, stop
      if (['Volume', 'Assignments', 'Hours', 'Rate', 'Backlog'].some(s => text === s)) {
        return text === sectionName;
      }
      prevSibling = prevSibling.previousElementSibling;
    }
    return false;
  }

  // Helper function to check previous sibling sections
  function isPreviousSiblingSection(row, sectionName) {
    let current = row;
    for (let i = 0; i < 10; i++) {
      current = current.previousElementSibling;
      if (!current) break;
      if (current.textContent.trim().includes(sectionName)) {
        return true;
      }
    }
    return false;
  }

  // Inject a marker so Virtual Desk knows the extension is installed
  if (isVirtualDeskPage || document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectExtensionMarker);
  } else {
    injectExtensionMarker();
  }

  function injectExtensionMarker() {
    // Add a hidden element that Virtual Desk can detect
    const marker = document.createElement('div');
    marker.id = 'alps-extension-installed';
    marker.style.display = 'none';
    marker.dataset.version = '1.0.0';
    document.body.appendChild(marker);

    // Also set a global variable
    window.ALPS_EXTENSION_INSTALLED = true;
    window.ALPS_EXTENSION_VERSION = '1.0.0';

    console.log('ALPS Data Fetcher extension is active on this page');
  }

})();
