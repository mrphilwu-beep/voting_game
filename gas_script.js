// ============================================================
// 牛肉麵節投票遊戲 — Google Apps Script 後端
// 從 Google Sheets「擴充功能 → Apps Script」貼上並部署
// 部署設定：執行身分「我」、存取「任何人（含匿名）」
// ============================================================

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'validateId') return respond(validateId(e.parameter.id));
  if (action === 'getResults') return respond(getResults(Number(e.parameter.level)));
  return respond({ error: 'unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'submitVote') return respond(submitVote(body.id, body.choice, body.level));
    return respond({ error: 'unknown action' });
  } catch (err) {
    return respond({ error: err.message });
  }
}

// ── validateId ────────────────────────────────────────────────
function validateId(id) {
  if (!id) return { valid: false };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const idSheet = ss.getSheetByName('ID');
  if (!idSheet) return { valid: false, reason: 'ID sheet not found' };

  const lastRow = idSheet.getLastRow();
  if (lastRow < 2) return { valid: false };
  const ids = idSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat()
    .map(v => String(v).trim().toUpperCase());

  if (!ids.includes(id.toUpperCase())) return { valid: false, reason: 'ID not found' };

  // 檢查是否已投過票
  const voteSheet = getOrCreateVoteSheet(ss);
  if (voteSheet.getLastRow() > 1) {
    const usedIds = voteSheet.getRange(2, 1, voteSheet.getLastRow() - 1, 1).getValues()
      .flat().map(v => String(v).toUpperCase());
    if (usedIds.includes(id.toUpperCase())) return { valid: false, reason: 'already voted' };
  }

  return { valid: true };
}

// ── submitVote ────────────────────────────────────────────────
function submitVote(id, choice, level) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const voteSheet = getOrCreateVoteSheet(ss);
  voteSheet.appendRow([
    id.toUpperCase(),
    choice,
    level,
    new Date().toISOString()
  ]);
  markIdAsVoted(ss, id);
  return { success: true };
}

// ── markIdAsVoted ─────────────────────────────────────────────
function markIdAsVoted(ss, id) {
  const idSheet = ss.getSheetByName('ID');
  if (!idSheet) return;
  const lastRow = idSheet.getLastRow();
  if (lastRow < 2) return;
  const ids = idSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat()
    .map(v => String(v).trim().toUpperCase());
  const rowIndex = ids.indexOf(id.toUpperCase());
  if (rowIndex === -1) return;
  const targetRow = rowIndex + 2; // +1 for header, +1 for 0-based
  idSheet.getRange(targetRow, 2).setValue('✓');
  idSheet.getRange(targetRow, 2).setBackground('#b7e1cd');
}

// ── backfillVotedIds（手動執行一次，補標已投票的舊資料）────────
function backfillVotedIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const voteSheet = getOrCreateVoteSheet(ss);
  if (voteSheet.getLastRow() < 2) return;
  const votedIds = voteSheet.getRange(2, 1, voteSheet.getLastRow() - 1, 1).getValues()
    .flat().map(v => String(v).toUpperCase());
  for (const id of votedIds) {
    markIdAsVoted(ss, id);
  }
}

// ── getResults ────────────────────────────────────────────────
function getResults(level) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const voteSheet = getOrCreateVoteSheet(ss);
  if (voteSheet.getLastRow() < 2) return { red: 0, white: 0, total: 0 };

  const rows = voteSheet.getRange(2, 1, voteSheet.getLastRow() - 1, 3).getValues();
  let red = 0, white = 0;
  for (const [, choice, lv] of rows) {
    if (Number(lv) !== level) continue;
    if (choice === 'red') red++;
    else if (choice === 'white') white++;
  }
  return { red, white, total: red + white };
}

// ── Helper ────────────────────────────────────────────────────
function getOrCreateVoteSheet(ss) {
  let sheet = ss.getSheetByName('Votes');
  if (!sheet) {
    sheet = ss.insertSheet('Votes');
    sheet.appendRow(['ID', 'Choice', 'Level', 'Timestamp']);
  }
  return sheet;
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
