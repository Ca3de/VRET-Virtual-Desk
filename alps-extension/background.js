// ALPS Data Fetcher - Background Service Worker
// This script runs in the background and handles API calls to ALPS

const ALPS_CONFIG = {
  baseUrl: 'https://alps-iad.iad.proxy.amazon.com/api',
  siteId: 'IND8',
  siteType: 'FULFILLMENT_CENTER',
  department: 'Vendor Returns',
  shift: 'Night'
};

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchAlpsData') {
    fetchAlpsData(request.date || getTodayDate())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === 'checkAlpsAuth') {
    checkAlpsAuthentication()
      .then(isAuthenticated => sendResponse({ authenticated: isAuthenticated }))
      .catch(() => sendResponse({ authenticated: false }));
    return true;
  }

  if (request.action === 'getConfig') {
    sendResponse({ config: ALPS_CONFIG });
    return false;
  }
});

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Check if user is authenticated to ALPS
async function checkAlpsAuthentication() {
  try {
    const response = await fetch(`${ALPS_CONFIG.baseUrl}/upload/latest-file?warehouseId=${ALPS_CONFIG.siteId}&warehouseType=${ALPS_CONFIG.siteType}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('ALPS auth check failed:', error);
    return false;
  }
}

// Fetch the latest plan ID
async function getLatestPlanId() {
  try {
    const response = await fetch(`${ALPS_CONFIG.baseUrl}/site/${ALPS_CONFIG.siteId}/latest-completed-plan-by-tag?tagName=Live&siteType=${ALPS_CONFIG.siteType}&polling=false`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get plan ID: ${response.status}`);
    }

    const data = await response.json();
    return data.planId || data.id || data;
  } catch (error) {
    console.error('Failed to get latest plan ID:', error);
    throw error;
  }
}

// Fetch ALPS data for a specific date
async function fetchAlpsData(targetDate) {
  console.log('Fetching ALPS data for date:', targetDate);

  // First check authentication
  const isAuth = await checkAlpsAuthentication();
  if (!isAuth) {
    throw new Error('Not authenticated to ALPS. Please open ALPS in a browser tab first to authenticate.');
  }

  // Try to get plan data from the page or API
  // Method 1: Try the daily labor plan API
  try {
    const planId = await getLatestPlanId();
    console.log('Got plan ID:', planId);

    // Fetch the plan data
    const planDataUrl = `${ALPS_CONFIG.baseUrl}/plans/${planId}/data`;
    const planResponse = await fetch(planDataUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (planResponse.ok) {
      const planData = await planResponse.json();
      return extractVendorReturnsNightData(planData, targetDate);
    }
  } catch (error) {
    console.log('Plan API method failed, trying alternative...', error);
  }

  // Method 2: Try scraping from an open ALPS tab
  try {
    const tabs = await chrome.tabs.query({ url: 'https://iad.alps-basecamp.lamps.amazon.dev/*' });
    if (tabs.length > 0) {
      const result = await chrome.tabs.sendMessage(tabs[0].id, {
        action: 'scrapeAlpsData',
        date: targetDate,
        department: ALPS_CONFIG.department,
        shift: ALPS_CONFIG.shift
      });
      if (result && result.data) {
        return result.data;
      }
    }
  } catch (error) {
    console.log('Tab scraping method failed:', error);
  }

  // Method 3: Return cached data if available
  try {
    const cached = await chrome.storage.local.get('alpsDataCache');
    if (cached.alpsDataCache && cached.alpsDataCache.date === targetDate) {
      console.log('Returning cached data');
      return cached.alpsDataCache.data;
    }
  } catch (error) {
    console.log('Cache retrieval failed:', error);
  }

  throw new Error('Could not fetch ALPS data. Please ensure you have an ALPS tab open with Vendor Returns > Night shift visible, then try again.');
}

// Extract Vendor Returns Night shift data from plan data
function extractVendorReturnsNightData(planData, targetDate) {
  // This function parses the ALPS plan data structure
  // The exact structure depends on the API response format

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
    // Navigate the plan data structure to find Vendor Returns Night data
    // This may need adjustment based on actual API response structure
    if (planData.dimensions) {
      const vendorReturns = planData.dimensions.find(d =>
        d.name === 'Vendor Returns' || d.mainProcess === 'Vendor Returns'
      );

      if (vendorReturns && vendorReturns.shifts) {
        const nightShift = vendorReturns.shifts.find(s =>
          s.name === 'Night' || s.shift === 'Night'
        );

        if (nightShift && nightShift.dates) {
          const dateData = nightShift.dates[targetDate];
          if (dateData) {
            result.volumeForecast = dateData.volumeForecast || dateData.forecast || '';
            result.scheduled = dateData.scheduled || dateData.headcount || '';
            result.absenceForecast = dateData.absenceForecast || dateData.absence || '';
            result.vto = dateData.vto || '0';
            result.vet = dateData.vet || '0';
            result.amazonReady = dateData.amazonReady || dateData.flex || '';
            result.laborShare = dateData.laborShare || '';
          }
        }
      }
    }

    // Cache the result
    chrome.storage.local.set({
      alpsDataCache: { date: targetDate, data: result, timestamp: Date.now() }
    });

  } catch (error) {
    console.error('Error extracting data:', error);
  }

  return result;
}

// Log when extension is installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('ALPS Data Fetcher installed/updated:', details.reason);

  // Set default config
  chrome.storage.local.set({ alpsConfig: ALPS_CONFIG });
});
