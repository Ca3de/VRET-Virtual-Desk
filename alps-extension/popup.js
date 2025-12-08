// ALPS Data Fetcher - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const fetchBtn = document.getElementById('fetchBtn');
  const openAlpsBtn = document.getElementById('openAlpsBtn');
  const dataPreview = document.getElementById('dataPreview');
  const targetDateEl = document.getElementById('targetDate');

  // Set today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  targetDateEl.textContent = dateStr;

  // Check ALPS authentication status
  async function checkAuth() {
    statusEl.className = 'status checking';
    statusEl.textContent = 'Checking ALPS connection...';

    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkAlpsAuth' });

      if (response.authenticated) {
        statusEl.className = 'status connected';
        statusEl.textContent = 'Connected to ALPS (Midway authenticated)';
        fetchBtn.disabled = false;
      } else {
        statusEl.className = 'status disconnected';
        statusEl.textContent = 'Not connected - Open ALPS to authenticate';
        fetchBtn.disabled = true;
      }
    } catch (error) {
      statusEl.className = 'status disconnected';
      statusEl.textContent = 'Extension error: ' + error.message;
      fetchBtn.disabled = true;
    }
  }

  // Fetch ALPS data
  async function fetchData() {
    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Fetching...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'fetchAlpsData',
        date: today.toISOString().split('T')[0]
      });

      if (response.success && response.data) {
        // Show preview
        dataPreview.classList.add('show');
        dataPreview.innerHTML = `
          <strong>Data Retrieved:</strong><br>
          Volume Forecast: ${response.data.volumeForecast || 'N/A'}<br>
          Scheduled: ${response.data.scheduled || 'N/A'}<br>
          Absence Forecast: ${response.data.absenceForecast || 'N/A'}<br>
          VTO: ${response.data.vto || '0'}<br>
          VET: ${response.data.vet || '0'}<br>
          Amazon Ready: ${response.data.amazonReady || 'N/A'}<br>
          Labor Share: ${response.data.laborShare || 'N/A'}<br>
          <br>
          <em style="color: #50c878;">Data copied to clipboard!</em>
        `;

        // Copy to clipboard
        const jsonStr = JSON.stringify(response.data);
        await navigator.clipboard.writeText(jsonStr);

        // Store for Virtual Desk to access
        await chrome.storage.local.set({ latestAlpsData: response.data });

        fetchBtn.textContent = 'Copied! Paste in Virtual Desk';
        fetchBtn.style.background = '#50c878';

        setTimeout(() => {
          fetchBtn.textContent = 'Fetch ALPS Data';
          fetchBtn.style.background = '';
          fetchBtn.disabled = false;
        }, 3000);

      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (error) {
      dataPreview.classList.add('show');
      dataPreview.innerHTML = `<span style="color: #e0115f;">Error: ${error.message}</span>`;
      fetchBtn.textContent = 'Fetch ALPS Data';
      fetchBtn.disabled = false;
    }
  }

  // Open ALPS Daily View
  function openAlps() {
    chrome.tabs.create({
      url: 'https://iad.alps-basecamp.lamps.amazon.dev/IND8/plan/daily'
    });
  }

  // Event listeners
  fetchBtn.addEventListener('click', fetchData);
  openAlpsBtn.addEventListener('click', openAlps);

  // Initial auth check
  await checkAuth();

  // Re-check auth periodically
  setInterval(checkAuth, 30000);
});
