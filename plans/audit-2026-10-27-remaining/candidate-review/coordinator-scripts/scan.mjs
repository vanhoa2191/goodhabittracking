import fs from 'node:fs';
const m = JSON.parse(fs.readFileSync('content/thinking-games/candidates/365-v2/candidate-manifest-v2.json'));
const by = (a, f) => a.reduce((o, x) => { const k = f(x); o[k] = (o[k] || 0) + 1; return o; }, {});
const out = {};
out.total = m.items.length;
out.perTrack = by(m.items, i => i.ageTrack);
out.kinds = Object.fromEntries(Object.entries(by(m.items, i => `${i.ageTrack}|${i.boardData?.kind}`)).sort());
const cjk = /[　-鿿가-힯Ѐ-ӿ؀-ۿ฀-๿]/;
out.nonVi = m.items.filter(i => cjk.test(JSON.stringify(i))).map(i => i.id);
// answer position for option-based boards
const pos = {};
for (const i of m.items) { const o = i.boardData?.options; if (!Array.isArray(o) || !o.length) continue; const idx = o.findIndex(x => JSON.stringify(x) === JSON.stringify(i.solution) || x?.id === i.solution); const k = `${i.boardData.kind}|n${o.length}`; (pos[k] ||= {})[idx] = (pos[k][idx] || 0) + 1; }
out.answerPosition = pos;
// textual duplicates
const text = i => [i.title, i.invitation, i.tutorial, i.explanation, JSON.stringify(i.hints)].join('¦');
const g = {}; for (const i of m.items) (g[text(i)] ||= []).push(i.id);
out.exactTextDupGroups = Object.values(g).filter(a => a.length > 1).length;
out.exactTextDupItems = Object.values(g).filter(a => a.length > 1).reduce((s, a) => s + a.length, 0);
for (const f of ['title', 'invitation', 'tutorial', 'explanation']) out['unique_' + f] = new Set(m.items.map(i => i[f])).size;
const fp = by(m.items, i => i.fingerprint); out.fingerprintDupGroups = Object.values(fp).filter(n => n > 1).length;
out.explanationNumbers = m.items.filter(i => /Bạn số \d/.test(i.explanation)).length;
out.targetSeconds = by(m.items, i => `${i.ageTrack}|${i.targetSeconds}`);
const sol = m.items.filter(i => i.solution === undefined || i.solution === null || i.solution === '').map(i => i.id); out.noSolution = sol.length;
out.topRepeatedExplanations = Object.entries(by(m.items, i => i.explanation)).sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log(JSON.stringify(out, null, 1));
