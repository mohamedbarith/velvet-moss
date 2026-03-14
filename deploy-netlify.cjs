const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createHash } = require('crypto');

const DIST_DIR = path.join(__dirname, 'dist');
const ZIP_PATH = path.join(__dirname, 'dist.zip');

// Create zip of dist folder using PowerShell
console.log('📦 Zipping dist folder...');
try {
    // Remove old zip if exists
    if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
    execSync(`powershell Compress-Archive -Path "${DIST_DIR}\\*" -DestinationPath "${ZIP_PATH}" -Force`, { stdio: 'inherit' });
    console.log(`✅ Created dist.zip (${(fs.statSync(ZIP_PATH).size / 1024).toFixed(1)} KB)\n`);
} catch (e) {
    console.error('❌ Failed to create zip:', e.message);
    process.exit(1);
}

// Upload zip to Netlify Drop via API
function uploadZip() {
    return new Promise((resolve, reject) => {
        const zipContent = fs.readFileSync(ZIP_PATH);
        const options = {
            hostname: 'api.netlify.com',
            path: '/api/v1/sites',
            method: 'POST',
            headers: {
                'Content-Type': 'application/zip',
                'Content-Length': zipContent.length,
            },
        };

        console.log('🚀 Uploading to Netlify...');
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        req.write(zipContent);
        req.end();
    });
}

async function deploy() {
    const result = await uploadZip();

    if (result.status === 200 || result.status === 201) {
        const site = result.data;
        const url = site.ssl_url || site.url || site.deploy_url;
        console.log('\n🎉 DEPLOYMENT SUCCESSFUL!\n');
        console.log('='.repeat(55));
        console.log(`🌐 LIVE URL: ${url}`);
        console.log('='.repeat(55));
        console.log(`\nSite ID: ${site.id}`);
        console.log(`Site Name: ${site.name}`);
        if (site.admin_url) console.log(`Admin: ${site.admin_url}`);
    } else {
        console.log('❌ Deploy response:', result.status, JSON.stringify(result.data, null, 2));
    }

    // Cleanup zip
    if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
}

deploy().catch(err => {
    console.error('Error:', err.message);
    if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
    process.exit(1);
});
