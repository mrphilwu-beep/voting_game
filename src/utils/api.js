const GAS_URL = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;
const USE_MOCK = !GAS_URL || GAS_URL.includes('YOUR_SCRIPT_ID');

// ── Mock state for local development ──────────────────────────────────────────
const mockVotes = {};
const mockResults = { 1: { red: 42, white: 38 }, 2: { red: 0, white: 0 }, 3: { red: 0, white: 0 }, 4: { red: 0, white: 0 } };
const mockIds = new Set([
  "A3K7","B9MQ","C4NP","D2RV","E8TW","F5XY","G6ZJ","H7KL","J3MN","K9PQ",
  "TEST","DEMO","AAA1","BBB2","CCC3","DDD4","EEE5","FFF6","GGG7","HHH8",
]);

// Returns { valid: boolean, reason?: 'already voted' | 'ID not found' }
export async function validateId(id) {
  if (USE_MOCK) {
    await delay(400);
    if (!mockIds.has(id.toUpperCase())) return { valid: false, reason: 'ID not found' };
    if (mockVotes[id.toUpperCase()]) return { valid: false, reason: 'already voted' };
    return { valid: true };
  }
  const res = await fetch(`${GAS_URL}?action=validateId&id=${encodeURIComponent(id)}`);
  return res.json();
}

export async function submitVote(id, choice, level) {
  if (USE_MOCK) {
    await delay(500);
    if (!mockVotes[id]) mockVotes[id] = {};
    mockVotes[id][level] = choice;
    mockResults[level] = mockResults[level] || { red: 0, white: 0 };
    mockResults[level][choice] = (mockResults[level][choice] || 0) + 1;
    return { success: true };
  }
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'submitVote', id, choice, level }),
  });
  return res.json();
}

export async function getResults(level) {
  if (USE_MOCK) {
    await delay(200);
    const r = mockResults[level] || { red: 0, white: 0 };
    return { ...r, total: (r.red || 0) + (r.white || 0) };
  }
  const res = await fetch(`${GAS_URL}?action=getResults&level=${level}`);
  const data = await res.json();
  return data;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
