/**
 * REFERENCE ONLY on this site. Huston Logic writes the Sheet as a Google service account (worker/sheets.ts), so this script
 * is not deployed and worker/apps-script.ts does not exist here. It is kept so the docs match the site template.
 *
 * Contact form -> Google Sheet writer (a Google Apps Script web app).
 *
 * The site's contact Worker (worker/apps-script.ts in the template) POSTs JSON { secret, tab, row } to this script's web-app URL. The
 * script checks the shared secret, accepts only the four configured tab names, and writes the row as plain text.
 * Setup steps: README, "Contact form", "Apps Script setup". Secret names: docs/SECRETS.md.
 *
 * Script Properties (Project Settings > Script properties). No value lives in this file.
 *   SHEET_SECRET    required  The shared secret. Must equal the Worker secret SHEET_WEBHOOK_SECRET.
 *   TAB_PRODUCTION  optional  Tab for live submissions. Default "Submissions" (contact.sheetTabs.production).
 *   TAB_PREVIEW     optional  Tab for branch previews. Default "Preview" (contact.sheetTabs.preview).
 *   TAB_FORMS         optional  Tab for live submissions of every other form. Default "Forms" (contact.sheetTabs.forms).
 *   TAB_FORMS_PREVIEW optional  Tab for branch previews of the other forms. Default "Forms preview" (contact.sheetTabs.formsPreview).
 *
 * Header row of each tab (row 1), the same order the Worker sends (worker/messages.ts, sheetRow):
 *   Received (UTC) | Need | Topic | Name | Email | Business | Message | Tools | Website | Source | Mode
 * Header row of the two forms tabs (worker/messages.ts, formSheetRow), one header for every form:
 *   Received (UTC) | Form | Name | Email | Answers | Mode
 *
 * Deploy as: Web app, Execute as "Me", Who has access "Anyone". The secret is what keeps the URL private.
 * Every failure returns {"ok":false} with no details.
 */

var MAX_COLUMNS = 20;
var MAX_CELL_LENGTH = 6000;

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty("SHEET_SECRET");
    var production = props.getProperty("TAB_PRODUCTION") || "Submissions";
    var preview = props.getProperty("TAB_PREVIEW") || "Preview";
    var forms = props.getProperty("TAB_FORMS") || "Forms";
    var formsPreview = props.getProperty("TAB_FORMS_PREVIEW") || "Forms preview";

    var data = JSON.parse(e.postData.contents);
    // Refuse everything while the secret is unset, so a half-finished setup never accepts rows.
    if (!expected || typeof data.secret !== "string" || !sameText(data.secret, expected)) return reply(false);
    if (data.tab !== production && data.tab !== preview && data.tab !== forms && data.tab !== formsPreview) return reply(false);

    var row = data.row;
    if (!Array.isArray(row) || row.length === 0 || row.length > MAX_COLUMNS) return reply(false);
    for (var i = 0; i < row.length; i++) {
      if (typeof row[i] !== "string" || row[i].length > MAX_CELL_LENGTH) return reply(false);
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(data.tab);
      if (!sheet) return reply(false);
      var target = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
      // Plain text first ("@"), then the values: nothing the visitor typed can turn into a formula or a date.
      target.setNumberFormat("@");
      target.setValues([row]);
    } finally {
      lock.releaseLock();
    }
    return reply(true);
  } catch (err) {
    return reply(false);
  }
}

/** Compares two strings without stopping at the first difference. */
function sameText(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function reply(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok })).setMimeType(ContentService.MimeType.JSON);
}
