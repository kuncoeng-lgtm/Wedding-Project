// Google Apps Script — RSVP backend for Dini & Rendi wedding invitation.
//
// Setup:
// 1. Open your Google Sheet for RSVPs.
// 2. Top row, in this exact order:
//      timestamp | name | attending | guests | message
// 3. Extensions → Apps Script → paste this file → save.
// 4. Set SHARED_SECRET below to a random string (e.g. a UUID).
//    Use the same value in index.html for RSVP_SECRET.
// 5. Deploy → New deployment → type: Web app
//      Description: RSVP
//      Execute as: Me
//      Who has access: Anyone
//    Copy the deployment URL ending in /exec.
// 6. Paste that URL into RSVP_ENDPOINT in index.html.
//
// Re-deploy any time you change this file (Deploy → Manage deployments → edit → New version).

const SHARED_SECRET = 'dr-2026-7f3a9c1e84b2d05f';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SHARED_SECRET) {
      return jsonOut({ ok: false, error: 'forbidden' });
    }
    const name = String(body.name || '').slice(0, 120).trim();
    const attending = body.attending === 'yes' || body.attending === 'no' ? body.attending : '';
    const guests = Math.max(1, Math.min(10, parseInt(body.guests, 10) || 1));
    const message = String(body.message || '').slice(0, 1000).trim();
    if (!name || !attending) return jsonOut({ ok: false, error: 'missing_fields' });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([new Date().toISOString(), name, attending, guests, message]);
    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  const wishes = rows.slice(1)
    .filter(r => r[1])
    .map(r => ({
      ts: new Date(r[0]).getTime(),
      name: String(r[1]),
      attending: String(r[2] || ''),
      guests: Number(r[3]) || 1,
      message: String(r[4] || '')
    }))
    .sort((a, b) => b.ts - a.ts);
  return jsonOut({ wishes });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
