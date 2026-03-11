const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const TRUST_UPI_ID = process.env.TRUST_UPI_ID || 'ashtavinayaktrust@upi';
const rootDir = __dirname;
const donationsPath = path.join(rootDir, 'donations.json');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function buildUpiLink(appName, amount, receiptId) {
  const baseParams = new URLSearchParams({
    pa: TRUST_UPI_ID,
    pn: 'Ashtavinayak Mahannadan Trust',
    am: amount.toString(),
    cu: 'INR',
    tn: `Annadan Donation ${receiptId}`,
  });

  if (appName === 'gpay') {
    return `tez://upi/pay?${baseParams.toString()}`;
  }

  return `upi://pay?${baseParams.toString()}`;
}

function saveDonation(record) {
  let existingDonations = [];

  if (fs.existsSync(donationsPath)) {
    existingDonations = JSON.parse(fs.readFileSync(donationsPath, 'utf8'));
  }

  existingDonations.push(record);
  fs.writeFileSync(donationsPath, JSON.stringify(existingDonations, null, 2));
}

function handleDonation(req, res) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    let payload;

    try {
      payload = JSON.parse(body || '{}');
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid JSON payload.' });
      return;
    }

    const { name, phone, email, amount, message } = payload;

    if (!name || !phone || !amount || Number(amount) < 101) {
      sendJson(res, 400, {
        error: 'Name, valid phone, and minimum donation amount ₹101 are required.',
      });
      return;
    }

    const receiptId = `ANN-${Date.now()}`;
    const donationRecord = {
      receiptId,
      name,
      phone,
      email: email || null,
      amount: Number(amount),
      message: message || null,
      status: 'payment_pending',
      createdAt: new Date().toISOString(),
    };

    saveDonation(donationRecord);

    sendJson(res, 201, {
      receiptId,
      amount: Number(amount),
      upiId: TRUST_UPI_ID,
      upiLinks: {
        gpay: buildUpiLink('gpay', amount, receiptId),
        phonePe: buildUpiLink('phonePe', amount, receiptId),
        paytm: buildUpiLink('paytm', amount, receiptId),
      },
    });
  });
}

function serveStaticFile(req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(rootDir, reqPath);

  if (!filePath.startsWith(rootDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const data = fs.readFileSync(filePath);

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(data);
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/donate') {
    handleDonation(req, res);
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { status: 'ok', service: 'donation-api' });
    return;
  }

  if (req.method === 'GET') {
    serveStaticFile(req, res);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`Trust website running on http://localhost:${PORT}`);
});
