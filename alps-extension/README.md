# ALPS Data Fetcher - Browser Extension

Browser extension that fetches ALPS workforce data and auto-fills Virtual Desk Attendance Dashboard.

## Features

- One-click fetch from ALPS without opening ALPS manually
- Uses your existing Amazon Midway authentication
- Auto-fills Volume Forecast, Scheduled, Absence Forecast, VTO, VET, Amazon Ready, Labor Share
- Works with Vendor Returns Night shift (IND8)

## Installation

### Chrome (Temporary - Development Mode)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `alps-extension` folder
5. The extension icon should appear in your toolbar

**Note:** This method requires reloading after browser restart.

### Chrome (Permanent - Packed Extension)

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Pack extension**
4. Select the `alps-extension` folder
5. This creates a `.crx` file
6. Drag the `.crx` file onto the extensions page to install

### Firefox (Temporary)

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select the `manifest.json` file from the `alps-extension` folder

### Firefox (Permanent - Recommended)

**Option 1: Firefox Developer Edition**
1. Install Firefox Developer Edition
2. Go to `about:config`
3. Set `xpinstall.signatures.required` to `false`
4. Go to `about:addons`
5. Click gear icon → Install Add-on From File
6. Select the extension folder zipped as `.xpi`

**Option 2: Sign via Mozilla (Free)**
1. Create a Mozilla Add-ons account at https://addons.mozilla.org/
2. Go to Developer Hub → Submit a New Add-on
3. Choose "On your own" distribution
4. Upload the extension as a ZIP file
5. Mozilla signs it automatically
6. Download the signed `.xpi` and install in any Firefox

## Usage

### Method 1: Via Virtual Desk Modal
1. Open Virtual Desk in your browser
2. Go to **Workforce** tab → **Attendance Dashboard**
3. Click **"+ Import ALPS Data"**
4. Click **"Auto-Fetch from ALPS"** button
5. Data populates automatically
6. Click **"Apply to Dashboard"**

### Method 2: Via Extension Popup
1. Click the extension icon in your browser toolbar
2. Ensure it shows "Connected to ALPS"
3. Click **"Fetch ALPS Data"**
4. Data is copied to clipboard
5. Paste into Virtual Desk's JSON input field

## Requirements

- You must be authenticated to Amazon Midway
- First-time use: Open ALPS once to establish your session
- After that: Extension fetches data without needing ALPS tab open

## Troubleshooting

**"Not connected to ALPS"**
- Open https://iad.alps-basecamp.lamps.amazon.dev/ in a browser tab
- Log in via Midway if prompted
- Try the extension again

**"Extension not installed"**
- Reload Virtual Desk page after installing extension
- Check that extension is enabled in browser extensions page

**Data not populating**
- Ensure you have an active ALPS session
- Check browser console for errors (F12 → Console)
- Try opening ALPS Daily View with Vendor Returns selected

## Configuration

Default settings (can be modified in `background.js`):
- Site: IND8
- Department: Vendor Returns
- Shift: Night

## Files

- `manifest.json` - Extension configuration
- `background.js` - Handles ALPS API calls
- `content.js` - Page integration script
- `popup.html` - Extension popup UI
- `popup.js` - Popup functionality
- `icon*.png` - Extension icons

## Privacy

This extension:
- Only communicates with ALPS servers (alps-basecamp.lamps.amazon.dev)
- Uses your existing browser cookies (no passwords stored)
- Does not send data to any third parties
- Stores fetched data locally in browser storage only
