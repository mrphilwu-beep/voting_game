// ============================================================
// 牛肉麵節投票遊戲 — Google Apps Script 後端
// 版本：v6  (2026-05-17)
// 更新：submitVote 也檢查 votingEnded，防止進入投票畫面後仍能提交
// 從 Google Sheets「擴充功能 → Apps Script」貼上並部署
// 部署設定：執行身分「我」、存取「任何人（含匿名）」
// ============================================================

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'validateId') return respond(validateId(e.parameter.id));
  if (action === 'getResults') return respond(getResults(Number(e.parameter.level)));
  if (action === 'resetVotes') return respond(resetVotesRemote(e.parameter.password));
  if (action === 'getVoters') return respond(getVoters());
  if (action === 'endVoting') return respond(setVotingEnded(true));
  if (action === 'getStatus') return respond(getStatus());
  return respond({ error: 'unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'submitVote') return respond(submitVote(body.id, body.choice, body.level));
    if (body.action === 'resetVotes') return respond(resetVotesRemote(body.password));
    if (body.action === 'recordWinner') return respond(recordWinner(body.id, body.choice));
    return respond({ error: 'unknown action' });
  } catch (err) {
    return respond({ error: err.message });
  }
}

// ── voting status ─────────────────────────────────────────────
function getSettingsSheet(ss) {
  let sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    sheet.appendRow(['Key', 'Value']);
    sheet.appendRow(['voting_ended', 'false']);
  }
  return sheet;
}

function getStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSettingsSheet(ss);
  const rows = sheet.getDataRange().getValues();
  for (const [key, value] of rows) {
    if (key === 'voting_ended') return { votingEnded: value === 'true' };
  }
  return { votingEnded: false };
}

function setVotingEnded(ended) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSettingsSheet(ss);
  const rows = sheet.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'voting_ended') {
      sheet.getRange(i + 1, 2).setValue(ended ? 'true' : 'false');
      return { success: true };
    }
  }
  sheet.appendRow(['voting_ended', ended ? 'true' : 'false']);
  return { success: true };
}

// ── validateId ────────────────────────────────────────────────
function validateId(id) {
  if (!id) return { valid: false };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (getStatus().votingEnded) return { valid: false, reason: 'voting ended' };
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
  if (getStatus().votingEnded) return { success: false, reason: 'voting ended' };
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

// ── resetVotesRemote（HTTP 呼叫，需密碼）─────────────────────
const RESET_PASSWORD = 'noodle2025';

function resetVotesRemote(password) {
  if (password !== RESET_PASSWORD) return { success: false, reason: 'wrong password' };
  resetVotes();
  return { success: true };
}

// ── resetVotes（手動執行，清除所有投票記錄並重置 ID 標示）───────
function resetVotes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 清除 Votes 分頁（保留標題列）
  const voteSheet = getOrCreateVoteSheet(ss);
  if (voteSheet.getLastRow() > 1) {
    voteSheet.getRange(2, 1, voteSheet.getLastRow() - 1, voteSheet.getLastColumn()).clearContent();
  }

  // 清除 ID 分頁 B 欄的 ✓ 標記與背景色
  const idSheet = ss.getSheetByName('ID');
  if (idSheet && idSheet.getLastRow() > 1) {
    const range = idSheet.getRange(2, 2, idSheet.getLastRow() - 1, 1);
    range.clearContent();
    range.setBackground(null);
  }
  // 重置投票結束旗標
  setVotingEnded(false);
}

// ── recordWinner ──────────────────────────────────────────────
function recordWinner(id, choice) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Winners');
  if (!sheet) {
    sheet = ss.insertSheet('Winners');
    sheet.appendRow(['ID', 'Choice', 'Timestamp']);
  }
  sheet.appendRow([id.toUpperCase(), choice, new Date().toISOString()]);
  sheet.getRange(sheet.getLastRow(), 1, 1, 2).setBackground('#fff2cc');
  return { success: true };
}

// ── getVoters ─────────────────────────────────────────────────
function getVoters() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const voteSheet = getOrCreateVoteSheet(ss);
  if (voteSheet.getLastRow() < 2) return { voters: [] };
  const rows = voteSheet.getRange(2, 1, voteSheet.getLastRow() - 1, 2).getValues();
  const voters = rows.map(([id, choice]) => ({ id: String(id).toUpperCase(), choice }));
  return { voters };
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
