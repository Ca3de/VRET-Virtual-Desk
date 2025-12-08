# VRET-Virtual-Desk

IND8 Executive Operations Center - A comprehensive dashboard for Amazon Fulfillment Center operations management.

## Features

- **Multi-tab Navigation**: Overview, Operations, Quality, Solutions, Analytics, IOL Monitor, Workforce, Resources, and VRETS
- **Workforce Planning Calculator**: Calculate staffing requirements for various process paths
- **ALPS Data Import**: Manually input ALPS metrics for Vendor Returns (Night shift) with auto-fill functionality
- **Attendance Dashboard**: Track headcount, attendance rates, and forecast vs actual analysis
- **60+ Pre-configured Tool Links**: Quick access to TIMS, ALPS, Rodeo, FC Research, and more
- **Export Capabilities**: Excel, CSV, and PNG exports
- **Local Storage**: Data persists in browser storage

## Domain Hosting Options

Since this is a static HTML application, you can host it on any platform that serves static files.

### Option 1: GitHub Pages (Free)

1. **Create a GitHub repository** (if not already done)
2. **Push your code** to the repository
3. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Under "Source", select `main` branch
   - Choose `/ (root)` folder
   - Click Save
4. **Access your site** at: `https://yourusername.github.io/VRET-Virtual-Desk/`
5. **Rename the HTML file** to `index.html` for cleaner URLs:
   ```bash
   mv VRET-Virtual-Desk.html index.html
   ```

### Option 2: Netlify (Free)

1. **Sign up** at [netlify.com](https://www.netlify.com/)
2. **Deploy via drag-and-drop**:
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag your project folder into the browser
3. **Or connect to GitHub**:
   - Click "New site from Git"
   - Choose your repository
   - Deploy settings: Leave defaults
4. **Custom domain**: Settings > Domain management > Add custom domain

### Option 3: Vercel (Free)

1. **Sign up** at [vercel.com](https://vercel.com/)
2. **Import your GitHub repository**
3. **Configure**:
   - Framework Preset: Other
   - Build Command: Leave empty
   - Output Directory: `.`
4. **Custom domain**: Settings > Domains > Add

### Option 4: AWS S3 + CloudFront

1. **Create S3 bucket**:
   ```bash
   aws s3 mb s3://your-bucket-name
   ```

2. **Enable static website hosting**:
   ```bash
   aws s3 website s3://your-bucket-name --index-document index.html
   ```

3. **Upload files**:
   ```bash
   aws s3 sync . s3://your-bucket-name --exclude ".git/*"
   ```

4. **Set bucket policy** for public access (or use CloudFront for private + CDN)

5. **Optional: Create CloudFront distribution** for HTTPS and caching

### Option 5: Simple HTTP Server (Local/Internal)

For internal network access:

```bash
# Using Python
cd /path/to/VRET-Virtual-Desk
python3 -m http.server 8080

# Using Node.js
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

Access at: `http://localhost:8080/VRET-Virtual-Desk.html`

### Option 6: Nginx/Apache (Production Server)

**Nginx configuration**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/vret-virtual-desk;
    index index.html VRET-Virtual-Desk.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Apache configuration**:
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/vret-virtual-desk
    DirectoryIndex index.html VRET-Virtual-Desk.html
</VirtualHost>
```

## Quick Start

1. **Clone or download** this repository
2. **Rename file** (recommended):
   ```bash
   mv VRET-Virtual-Desk.html index.html
   ```
3. **Open directly** in browser, or serve via one of the hosting options above

## ALPS Data Import

The Attendance Dashboard includes an **Import ALPS Data** button for quick data entry:

1. Navigate to the **Workforce** tab
2. Scroll to the **Attendance Dashboard (VRETS)** section
3. Click the **"+ Import ALPS Data"** button in the header
4. In the modal dialog, enter metrics:
   - Volume Forecast, Scheduled HC, Absence Forecast, VTO
   - Amazon Ready (Flex), VET, Labor Share (hours)
5. **Option A**: Enter values manually in the fields
6. **Option B**: Paste JSON from ALPS Network tab (F12 > Network > XHR) and click "Parse JSON"
7. Click **"Apply to Dashboard"** to auto-fill all fields
8. Data is automatically saved to browser storage and persists across sessions

## Data Sources

Metrics should be obtained from:
- **ALPS**: `https://iad.alps-basecamp.lamps.amazon.dev/IND8/plan/daily`
- Navigate to **Vendor Returns** > **Night** > **Current Day**
- Volume Forecast: From "Forecast" row under Volume section
- Scheduled: From "Forecast" row under Assignments section

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies (CDN-loaded)

- Google Fonts (Playfair Display, Montserrat, Bebas Neue)
- XLSX.js v0.20.2 (Excel export)
- html2canvas v1.4.1 (PNG snapshots)

## License

Internal use only - Amazon Fulfillment Center Operations
