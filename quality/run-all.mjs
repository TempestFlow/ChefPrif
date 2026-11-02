#!/usr/bin/env node
/**
 * ChefPrif – „Programų sistemų kokybė“, 1 namų darbas.
 * Viena komanda paleidžia visus kodo kokybės įrankius ir išsaugo jų rezultatus.
 *
 * Paruošimas (vieną kartą):
 *   npm ci
 *   pip install lizard==1.24.3
 *
 * Paleidimas iš projekto šaknies:
 *   node quality/run-all.mjs
 *
 * Rezultatai: quality/reports/
 *   summary.md                 – visų rezultatų suvestinė (šią rodyti per gynimą)
 *   summary.json               – tie patys duomenys mašininiu formatu
 *   lizard.csv, lizard.txt     – funkcijų dydis ir ciklomatinis sudėtingumas
 *   fta.json                   – Halstead metrikos, ciklomatinis sudėtingumas ir FTA įvertis failams
 *   jscpd-report.json          – kodo dubliavimas
 *   coverage-summary.json      – testų padengimas (visi src failai)
 *   coverage-default-summary.json – padengimas pagal numatytąją Jest konfigūraciją (kaip CI)
 *   eslint.json, tsc.txt       – statinė analizė
 *   npm-audit.json, npm-audit-prod.json – pažeidžiamos priklausomybės (visos / tik produkcinės)
 *   html/coverage/index.html, html/jscpd/html/index.html – ataskaitos naršyklei
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- nustatymai ----------
const HERE = dirname(fileURLToPath(import.meta.url));
const opts = parseArgs(process.argv.slice(2));
const ROOT = resolve(opts.root ?? join(HERE, '..'));
const OUT = resolve(opts.out ?? join(HERE, 'reports'));
const HTML = join(OUT, 'html');
const SRC = 'src';
const TESTS = '__tests__';
const CC_LIMIT = 10; // ciklomatinio sudėtingumo riba (McCabe rekomendacija)
const TOOLS = { lizard: '1.24.3', fta: 'fta-cli@3.1.0', jscpd: 'jscpd@4.3.0' };
const COVERAGE_FROM = ['src/**/*.{ts,tsx}', '!src/__tests__/**', '!src/types/**'];
// Verslo logika pagal projekto NFR (CLAUDE.md): API maršrutai ir duomenų sluoksnis
const BUSINESS_LOGIC = ['src/app/api/', 'src/data/'];

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') o.root = argv[++i];
    else if (argv[i] === '--out') o.out = argv[++i];
  }
  return o;
}

// ---------- pagalbinės funkcijos ----------
const posix = (p) => p.split('\\').join('/');
const rel = (p) => posix(relative(ROOT, resolve(ROOT, p)));
const outArg = (p) => { const r = relative(ROOT, p); return r.startsWith('..') ? p : posix(r); };
const isTest = (p) => posix(p).includes(`/${TESTS}/`);
const quote = (a) => (/[\s"*?{}!,;&|<>^()[\]]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
const round = (x, d = 1) => (x == null || Number.isNaN(x) ? null : Math.round(x * 10 ** d) / 10 ** d);
const fmt = (x, d = 1) => (x == null ? '–' : String(round(x, d)).replace('.', ','));
const pct = (x) => (x == null ? '–' : `${fmt(x)} %`);
// Lietuviškos daugiskaitos formos: lt(13, 'klaida', 'klaidos', 'klaidų') → '13 klaidų'
const lt = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  const w = m10 === 1 && m100 !== 11 ? one : m10 >= 2 && (m100 < 11 || m100 > 19) ? few : many;
  return `${n} ${w}`;
};
// Palaikomumo indekso lygiai pagal Microsoft Visual Studio ribas
const miLevel = (mi) => (mi == null ? '' : mi < 10 ? 'žemas' : mi < 20 ? 'vidutinis' : 'aukštas');

function run(label, cmd, args = [], { shell = false } = {}) {
  const shown = [cmd === process.execPath ? 'node' : cmd, ...args].map(quote).join(' ');
  console.log(`\n▶ ${label}\n  $ ${shown}`);
  const t0 = Date.now();
  const r = shell
    ? spawnSync([cmd, ...args].map(quote).join(' '), { cwd: ROOT, encoding: 'utf8', shell: true, maxBuffer: 1 << 28 })
    : spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.error) console.log(`  ✗ nepavyko paleisti: ${r.error.message}`);
  else console.log(`  ✓ baigta per ${secs} s (išėjimo kodas ${r.status})`);
  return { status: r.error ? -1 : r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function jsonFromText(text) {
  const i = text.search(/[[{]/);
  if (i < 0) return null;
  try { return JSON.parse(text.slice(i)); } catch { return null; }
}

function copyIfExists(from, to) {
  if (existsSync(from)) copyFileSync(from, to);
}

// CSV skaitytuvas: lizard laukuose (pvz., JSX funkcijų pavadinimuose) gali būti ir naujų eilučių
function parseCsv(text) {
  const rows = []; let row = []; let cur = ''; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.length >= 11);
}

function walk(dir) {
  const files = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.d.ts')) files.push(p);
  }
  return files;
}

function findPython() {
  const candidates = process.platform === 'win32' ? ['python', 'py', 'python3'] : ['python3', 'python'];
  for (const py of candidates) {
    const r = spawnSync(py, ['-m', 'lizard', '--version'], { encoding: 'utf8' });
    if (!r.error && r.status === 0) return { py, version: r.stdout.trim() };
  }
  return null;
}

function table(headers, rows) {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  return [line(headers), line(headers.map(() => '---')), ...rows.map(line)].join('\n');
}

// Padengimo suma failų grupei (pagal covered/total, ne procentų vidurkis)
function coverageOf(summaryJson, predicate) {
  const acc = { statements: [0, 0], branches: [0, 0], functions: [0, 0], lines: [0, 0] };
  let files = 0;
  for (const [k, v] of Object.entries(summaryJson ?? {})) {
    if (k === 'total' || !predicate(rel(k))) continue;
    files++;
    for (const m of Object.keys(acc)) { acc[m][0] += v[m].covered; acc[m][1] += v[m].total; }
  }
  const out = { files };
  for (const [m, [c, t]] of Object.entries(acc)) out[m] = t ? (100 * c) / t : null;
  return out;
}

// ---------- paleidimas ----------
if (!existsSync(join(ROOT, 'package.json')) || !existsSync(join(ROOT, SRC))) {
  console.error(`Nerastas projektas: ${ROOT}. Paleisk skriptą iš ChefPrif šaknies: node quality/run-all.mjs`);
  process.exit(1);
}
if (!existsSync(join(ROOT, 'node_modules'))) {
  console.error('Nėra node_modules. Pirmiausia paleisk: npm ci');
  process.exit(1);
}
mkdirSync(HTML, { recursive: true });
console.log(`ChefPrif kokybės analizė\n  projektas: ${ROOT}\n  rezultatai: ${OUT}`);

const summary = { generatedAt: new Date().toISOString(), tools: {}, steps: {} };

// 1. Projekto informacija
const git = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' }).stdout?.trim() || null;
summary.project = {
  commit: git(['rev-parse', 'HEAD']),
  commitDate: git(['log', '-1', '--format=%cd', '--date=short']),
  branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
};
summary.tools.node = process.version;
summary.tools.eslint = readJson(join(ROOT, 'node_modules/eslint/package.json'))?.version;
summary.tools.typescript = readJson(join(ROOT, 'node_modules/typescript/package.json'))?.version;
summary.tools.jest = readJson(join(ROOT, 'node_modules/jest/package.json'))?.version;
summary.tools.fta = TOOLS.fta.split('@')[1];
summary.tools.jscpd = TOOLS.jscpd.split('@')[1];

// Failų sąrašas ir fizinės eilutės
const srcFiles = walk(join(ROOT, SRC)).map((p) => {
  const text = readFileSync(p, 'utf8');
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  return { file: rel(p), test: isTest(rel(p)), lines: lines.length, blank: lines.filter((l) => !l.trim()).length };
});
const prodFiles = srcFiles.filter((f) => !f.test);
const testFiles = srcFiles.filter((f) => f.test);
const prodLines = prodFiles.reduce((s, f) => s + f.lines, 0);

// 2. lizard – funkcijų dydis ir ciklomatinis sudėtingumas
const python = findPython();
let functions = [];
let lizardTotals = null;
const lizardPerFile = {};
if (!python) {
  console.log(`\n✗ lizard nerastas. Įdiek: pip install lizard==${TOOLS.lizard}`);
  summary.steps.lizard = 'nepaleista';
} else {
  summary.tools.lizard = python.version;
  const exclude = ['-x', `*/${TESTS}/*`];
  const csv = run('lizard – funkcijų dydis ir ciklomatinis sudėtingumas (CSV)', python.py, ['-m', 'lizard', SRC, ...exclude, '--csv']);
  writeFileSync(join(OUT, 'lizard.csv'), 'NLOC,CCN,token,PARAM,length,location,file,function,long_name,start,end\n' + csv.stdout);
  functions = parseCsv(csv.stdout).map((c) => ({
    nloc: +c[0], ccn: +c[1], tokens: +c[2], params: +c[3], length: +c[4],
    file: posix(c[6]), name: c[7], start: +c[9], end: +c[10],
  }));
  const txt = run('lizard – failų ir viso projekto suvestinė', python.py, ['-m', 'lizard', SRC, ...exclude, '-C', String(CC_LIMIT)]);
  writeFileSync(join(OUT, 'lizard.txt'), txt.stdout);
  const lines = txt.stdout.split(/\r?\n/);
  for (const l of lines) {
    const m = l.match(/^\s*(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(\S.*\.(?:ts|tsx))\s*$/);
    if (m) lizardPerFile[posix(m[6])] = { nloc: +m[1], avgNloc: +m[2], avgCcn: +m[3], functions: +m[5] };
  }
  const ti = lines.findIndex((l) => l.trim().startsWith('Total nloc'));
  if (ti >= 0) {
    const m = (lines[ti + 2] || '').trim().split(/\s+/).map(Number);
    if (m.length >= 8) lizardTotals = { nloc: m[0], avgNloc: m[1], avgCcn: m[2], avgTokens: m[3], functions: m[4], warnings: m[5] };
  }
  summary.steps.lizard = 'ok';
}

// 3. FTA – Halstead metrikos ir palaikomumas
const fta = run('FTA – Halstead metrikos, ciklomatinis sudėtingumas, FTA įvertis', 'npx', ['-y', TOOLS.fta, SRC, '--json'], { shell: true });
const ftaData = (jsonFromText(fta.stdout) || []).map((f) => ({ ...f, file: posix(join(SRC, f.file_name)) }));
writeFileSync(join(OUT, 'fta.json'), JSON.stringify(ftaData, null, 2));
summary.steps.fta = ftaData.length ? 'ok' : 'klaida';

// Klasikinis palaikomumo indeksas (Microsoft variantas, 0–100) iš FTA duomenų
const maintainabilityIndex = (V, CC, LOC) =>
  V > 0 && LOC > 0 ? Math.max(0, ((171 - 5.2 * Math.log(V) - 0.23 * CC - 16.2 * Math.log(LOC)) * 100) / 171) : null;

// 4. jscpd – kodo dubliavimas
const jscpdDir = join(HTML, 'jscpd');
rmSync(jscpdDir, { recursive: true, force: true });
run('jscpd – kodo dubliavimas', 'npx', ['-y', TOOLS.jscpd, SRC, '--ignore', `**/${TESTS}/**`, '--format', 'typescript,tsx',
  '--min-lines', '5', '--min-tokens', '50', '--reporters', 'json,html', '--output', outArg(jscpdDir), '--silent'], { shell: true });
copyIfExists(join(jscpdDir, 'jscpd-report.json'), join(OUT, 'jscpd-report.json'));
const jscpd = readJson(join(OUT, 'jscpd-report.json'));
summary.steps.jscpd = jscpd ? 'ok' : 'klaida';

// 5. Jest – testai ir padengimas
//    a) visiems src failams (collectCoverageFrom), b) pagal numatytąją konfigūraciją, kaip CI
const covDir = join(HTML, 'coverage');
rmSync(covDir, { recursive: true, force: true });
const jest = run('Jest – testai ir padengimas (visi src failai)', process.execPath, ['node_modules/jest/bin/jest.js', '--ci', '--silent',
  '--coverage', '--coverageDirectory', outArg(covDir),
  '--coverageReporters', 'json-summary', '--coverageReporters', 'html', '--coverageReporters', 'text-summary',
  ...COVERAGE_FROM.flatMap((g) => ['--collectCoverageFrom', g]), '--json', '--outputFile', outArg(join(OUT, 'jest-results.json'))]);
writeFileSync(join(OUT, 'jest.txt'), jest.stdout + '\n' + jest.stderr);
copyIfExists(join(covDir, 'coverage-summary.json'), join(OUT, 'coverage-summary.json'));
const covDefaultDir = join(HTML, 'coverage-default');
rmSync(covDefaultDir, { recursive: true, force: true });
run('Jest – padengimas pagal numatytąją konfigūraciją (kaip CI)', process.execPath, ['node_modules/jest/bin/jest.js', '--ci', '--silent',
  '--coverage', '--coverageDirectory', outArg(covDefaultDir), '--coverageReporters', 'json-summary']);
copyIfExists(join(covDefaultDir, 'coverage-summary.json'), join(OUT, 'coverage-default-summary.json'));
const coverage = readJson(join(OUT, 'coverage-summary.json'));
const coverageDefault = readJson(join(OUT, 'coverage-default-summary.json'));
const jestResults = readJson(join(OUT, 'jest-results.json'));
summary.steps.jest = coverage ? 'ok' : 'klaida';

// 6. ESLint – visas projektas su projekto taisyklėmis (kaip `npm run lint`) + complexity riba
const eslintOut = join(OUT, 'eslint.json');
run('ESLint – projekto taisyklės (kaip npm run lint) + complexity riba', process.execPath,
  ['node_modules/eslint/bin/eslint.js', '.', '--ignore-pattern', 'quality/**',
    '--rule', `complexity: [warn, ${CC_LIMIT}]`, '-f', 'json', '-o', outArg(eslintOut)]);
const eslint = readJson(eslintOut) || [];
summary.steps.eslint = existsSync(eslintOut) ? 'ok' : 'klaida';

// 7. TypeScript – tipų tikrinimas
const tsc = run('TypeScript – tipų tikrinimas', process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '-p', 'tsconfig.json', '--pretty', 'false']);
writeFileSync(join(OUT, 'tsc.txt'), (tsc.stdout + tsc.stderr).trim() || 'Klaidų nerasta.');
const tscErrors = (tsc.stdout.match(/error TS\d+/g) || []).length;
summary.steps.tsc = tsc.status === -1 ? 'klaida' : 'ok';

// 8. npm audit – pažeidžiamos priklausomybės (visos ir tik produkcinės)
const audit = run('npm audit – visos priklausomybės', 'npm', ['audit', '--json'], { shell: true });
const auditData = jsonFromText(audit.stdout);
writeFileSync(join(OUT, 'npm-audit.json'), JSON.stringify(auditData, null, 2));
const auditProd = run('npm audit – tik produkcinės priklausomybės', 'npm', ['audit', '--omit=dev', '--json'], { shell: true });
const auditProdData = jsonFromText(auditProd.stdout);
writeFileSync(join(OUT, 'npm-audit-prod.json'), JSON.stringify(auditProdData, null, 2));
summary.steps.npmAudit = auditData ? 'ok' : 'klaida';

// ---------- suvestinė ----------
const covFor = (file) => {
  if (!coverage) return null;
  const key = Object.keys(coverage).find((k) => k !== 'total' && rel(k) === file);
  return key ? coverage[key] : null;
};

// ESLint radiniai
const eslintMsgs = eslint.flatMap((f) => f.messages.map((m) => {
  const file = rel(f.filePath);
  return {
    file, area: isTest(file) ? 'testai' : file.startsWith(`${SRC}/`) ? 'produkcinis' : 'kita',
    rule: m.ruleId ?? '(sintaksė)', severity: m.severity === 2 ? 'klaida' : 'įspėjimas',
    line: m.line, message: m.message.split('\n')[0].replace(/^Error: /, ''),
  };
}));
const ccMsgs = eslintMsgs.filter((m) => m.rule === 'complexity');
const ruleMsgs = eslintMsgs.filter((m) => m.rule !== 'complexity');
const eslintCcn = (file, line) => {
  const m = ccMsgs.find((x) => x.file === file && x.line === line);
  return m ? Number(m.message.match(/complexity of (\d+)/)?.[1]) : null;
};

// Failų lygmens metrikos (tik produkcinis kodas)
const fileMetrics = prodFiles.map((f) => {
  const ft = ftaData.find((x) => x.file === f.file);
  const fns = functions.filter((x) => x.file === f.file);
  const lz = lizardPerFile[f.file];
  const cov = covFor(f.file);
  const h = ft?.halstead;
  const eslintMaxCc = Math.max(0, ...ccMsgs.filter((m) => m.file === f.file).map((m) => Number(m.message.match(/complexity of (\d+)/)?.[1] ?? 0)));
  return {
    file: f.file, lines: f.lines, blank: f.blank,
    nloc: lz?.nloc ?? null, functions: fns.length,
    maxCcn: fns.length ? Math.max(...fns.map((x) => x.ccn)) : null,
    maxCcnEslint: eslintMaxCc || null,
    avgCcn: lz?.avgCcn ?? null,
    ftaLoc: ft?.line_count ?? null, cyclo: ft?.cyclo ?? null,
    halstead: h ? { n1: h.uniq_operators, n2: h.uniq_operands, N1: h.total_operators, N2: h.total_operands,
      length: h.program_length, vocabulary: h.vocabulary_size, volume: h.volume, difficulty: h.difficulty,
      effort: h.effort, time: h.time, bugs: h.bugs } : null,
    mi: ft ? maintainabilityIndex(h.volume, ft.cyclo, ft.line_count) : null,
    ftaScore: ft?.fta_score ?? null, ftaAssessment: ft?.assessment ?? null,
    coverage: cov ? { statements: cov.statements.pct, branches: cov.branches.pct, functions: cov.functions.pct, lines: cov.lines.pct } : null,
    eslintIssues: ruleMsgs.filter((m) => m.file === f.file).length,
  };
}).sort((a, b) => (b.nloc ?? 0) - (a.nloc ?? 0));

const complexFns = functions.filter((f) => f.ccn > CC_LIMIT).sort((a, b) => b.ccn - a.ccn);
const ccnBuckets = { '1–5': 0, '6–10': 0, '11–20': 0, '21+': 0 };
for (const f of functions) {
  if (f.ccn <= 5) ccnBuckets['1–5']++; else if (f.ccn <= 10) ccnBuckets['6–10']++; else if (f.ccn <= 20) ccnBuckets['11–20']++; else ccnBuckets['21+']++;
}
// Funkcijos, viršijančios ribą bent pagal vieną įrankį (lizard arba ESLint)
const overLimit = [];
for (const f of functions) {
  const e = eslintCcn(f.file, f.start);
  if (f.ccn > CC_LIMIT || (e ?? 0) > CC_LIMIT) overLimit.push({ name: f.name, file: f.file, line: f.start, nloc: f.nloc, length: f.length, lizard: f.ccn, eslint: e });
}
for (const m of ccMsgs) {
  if (!overLimit.some((o) => o.file === m.file && o.line === m.line)) {
    const name = m.message.match(/'([^']+)'/)?.[1] ?? '(anoniminė)';
    const lz = functions.find((f) => f.file === m.file && f.name === name);
    overLimit.push({ name, file: m.file, line: m.line, nloc: lz?.nloc ?? null, length: lz?.length ?? null,
      lizard: lz?.ccn ?? null, eslint: Number(m.message.match(/complexity of (\d+)/)?.[1]) });
  }
}
overLimit.sort((a, b) => Math.max(b.lizard ?? 0, b.eslint ?? 0) - Math.max(a.lizard ?? 0, a.eslint ?? 0));

const byRule = {};
for (const m of ruleMsgs) {
  byRule[m.rule] ??= { rule: m.rule, severity: m.severity, produkcinis: 0, testai: 0, kita: 0 };
  byRule[m.rule][m.area]++;
}

// Dubliavimas: jscpd statistika ir unikalios pasikartojančios eilutės (abiejose kopijose, kaip SonarQube)
let dup = null;
if (jscpd) {
  const ranges = {};
  const addRange = (f) => { (ranges[posix(f.name)] ??= []).push([f.start, f.end]); };
  for (const d of jscpd.duplicates) { addRange(d.firstFile); addRange(d.secondFile); }
  let uniqueLines = 0;
  const perFile = {};
  for (const [file, rs] of Object.entries(ranges)) {
    const covered = new Set();
    for (const [a, b] of rs) for (let i = a; i <= b; i++) covered.add(i);
    perFile[file] = covered.size; uniqueLines += covered.size;
  }
  dup = {
    clones: jscpd.statistics.total.clones,
    jscpdDuplicatedLines: jscpd.statistics.total.duplicatedLines,
    jscpdTotalLines: jscpd.statistics.total.lines,
    jscpdPercentage: jscpd.statistics.total.percentage,
    uniqueLines, prodLines, uniquePercentage: (100 * uniqueLines) / prodLines, perFile,
    list: jscpd.duplicates.map((d) => ({
      format: d.format, lines: d.lines, tokens: d.tokens,
      a: `${posix(d.firstFile.name)}:${d.firstFile.start}–${d.firstFile.end}`,
      b: `${posix(d.secondFile.name)}:${d.secondFile.start}–${d.secondFile.end}`,
    })),
  };
}

// npm audit
const SEVERITY_ORDER = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
const vulnRows = (data) => (data?.vulnerabilities
  ? Object.values(data.vulnerabilities).map((v) => {
    const titles = [...new Set(v.via.map((x) => (typeof x === 'string' ? `per ${x}` : x.title)))];
    return {
      name: v.name, severity: v.severity, direct: v.isDirect, advisories: titles.length,
      via: titles.slice(0, 2).join('; ') + (titles.length > 2 ? ` (+${titles.length - 2})` : ''),
      fix: v.fixAvailable === true ? 'taip'
        : v.fixAvailable ? `${v.fixAvailable.name}@${v.fixAvailable.version}${v.fixAvailable.isSemVerMajor ? ' (major)' : ''}` : 'ne',
    };
  }).sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.name.localeCompare(b.name))
  : []);
const vulns = auditData?.metadata?.vulnerabilities ?? null;
const vulnsProd = auditProdData?.metadata?.vulnerabilities ?? null;
const vulnList = vulnRows(auditData);
const vulnProdList = vulnRows(auditProdData);

const covTotals = (c) => (c ? { statements: c.total.statements.pct, branches: c.total.branches.pct, functions: c.total.functions.pct, lines: c.total.lines.pct, files: Object.keys(c).length - 1 } : null);
const zeroCoverage = coverage ? Object.keys(coverage).filter((k) => k !== 'total' && coverage[k].lines.pct === 0).map(rel) : [];

Object.assign(summary, {
  size: {
    prodFiles: prodFiles.length, testFiles: testFiles.length,
    prodLines, testLines: testFiles.reduce((s, f) => s + f.lines, 0),
    nloc: lizardTotals?.nloc ?? null, functions: functions.length, avgFunctionNloc: lizardTotals?.avgNloc ?? null,
  },
  complexity: {
    limit: CC_LIMIT, avgCcn: lizardTotals?.avgCcn ?? null,
    maxCcn: functions.length ? Math.max(...functions.map((f) => f.ccn)) : null,
    overLimitLizard: complexFns.length, overLimitEslint: ccMsgs.length, buckets: ccnBuckets, overLimit,
  },
  files: fileMetrics,
  duplication: dup,
  tests: jestResults ? {
    suites: jestResults.numTotalTestSuites, tests: jestResults.numTotalTests,
    passed: jestResults.numPassedTests, failed: jestResults.numFailedTests,
  } : null,
  coverage: {
    allFiles: covTotals(coverage), defaultConfig: covTotals(coverageDefault), collectFrom: COVERAGE_FROM,
    businessLogic: { scope: BUSINESS_LOGIC, ...coverageOf(coverage, (f) => BUSINESS_LOGIC.some((p) => f.startsWith(p))) },
    zeroCoverage,
  },
  eslint: {
    errors: ruleMsgs.filter((m) => m.severity === 'klaida').length,
    warnings: ruleMsgs.filter((m) => m.severity === 'įspėjimas').length,
    byArea: ['produkcinis', 'testai', 'kita'].map((a) => ({ area: a, count: ruleMsgs.filter((m) => m.area === a).length })),
    complexityWarnings: ccMsgs.length,
    byRule: Object.values(byRule).sort((a, b) => (b.produkcinis + b.testai + b.kita) - (a.produkcinis + a.testai + a.kita)),
    messages: ruleMsgs,
  },
  typescript: { errors: tscErrors },
  npmAudit: { counts: vulns, prodCounts: vulnsProd, packages: vulnList, prodPackages: vulnProdList },
});
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));

// ---------- summary.md ----------
const md = [];
const c = summary.coverage;
md.push('# ChefPrif – kodo kokybės suvestinė', '');
md.push(`Commit: \`${summary.project.commit?.slice(0, 7)}\` (${summary.project.commitDate}), šaka \`${summary.project.branch}\`. Sugeneruota: ${summary.generatedAt.slice(0, 16).replace('T', ' ')} UTC.`, '');
md.push('Įrankiai: ' + Object.entries(summary.tools).map(([k, v]) => `${k} ${v}`).join(', ') + '.', '');
md.push('## Dydis', '');
md.push(table(['Rodiklis', 'Reikšmė'], [
  ['Produkcinio kodo failai', summary.size.prodFiles], ['Fizinės eilutės (produkcinis kodas)', summary.size.prodLines],
  ['NLOC (lizard, be tuščių eilučių ir komentarų)', summary.size.nloc ?? '–'], ['Funkcijos', summary.size.functions],
  ['Vidutinis funkcijos NLOC', fmt(summary.size.avgFunctionNloc)],
  ['Testų failai / eilutės', `${summary.size.testFiles} / ${summary.size.testLines}`],
]), '');
md.push('## Ciklomatinis sudėtingumas', '');
md.push(`lizard: vidutinis CCN ${fmt(summary.complexity.avgCcn)}, didžiausias ${summary.complexity.maxCcn}; ribą ${CC_LIMIT} viršija ${lt(complexFns.length, 'funkcija', 'funkcijos', 'funkcijų')}. ESLint \`complexity\`: ribą viršija ${lt(ccMsgs.length, 'funkcija', 'funkcijos', 'funkcijų')}.`, '');
md.push(table(['CCN intervalas (lizard)', 'Funkcijų'], Object.entries(ccnBuckets).map(([k, v]) => [k, v])), '');
md.push(table(['Funkcija', 'Vieta', 'CCN (lizard)', 'CCN (ESLint)', 'NLOC', 'Ilgis (eil.)'],
  overLimit.map((f) => [`\`${f.name}\``, `${f.file}:${f.line}`, f.lizard ?? '–', f.eslint ?? '≤ 10', f.nloc ?? '–', f.length ?? '–'])), '');
md.push('## Failų metrikos (FTA, lizard, Jest)', '');
md.push('MI – palaikomumo indeksas (0–100, didesnis geriau): MI = max(0, (171 − 5,2·ln V − 0,23·CC − 16,2·ln LOC)·100/171); lygiai: < 10 žemas, 10–19 vidutinis, ≥ 20 aukštas. FTA įvertis – mažesnis geriau.', '');
md.push(table(['Failas', 'NLOC', 'Funkc.', 'Maks. CCN', 'Cyclo', 'Halstead V', 'D', 'E', 'B', 'MI', 'FTA', 'Padengimas'],
  fileMetrics.filter((f) => f.functions > 0 || (f.nloc ?? 0) > 20).map((f) => [
    f.file.replace(/^src\//, ''), f.nloc ?? '–', f.functions, Math.max(f.maxCcn ?? 0, f.maxCcnEslint ?? 0) || '–', f.cyclo ?? '–',
    fmt(f.halstead?.volume, 0), fmt(f.halstead?.difficulty), fmt(f.halstead?.effort, 0), fmt(f.halstead?.bugs, 2),
    f.mi != null ? `${fmt(f.mi)} (${miLevel(f.mi)})` : '–', f.ftaScore != null ? `${fmt(f.ftaScore)} (${f.ftaAssessment})` : '–', pct(f.coverage?.lines),
  ])), '');
md.push('## Dubliavimas (jscpd)', '');
if (dup) {
  md.push(`Pasikartojančių fragmentų: ${dup.clones}. Unikalių pasikartojančių eilučių (abiejose kopijose): ${dup.uniqueLines} iš ${dup.prodLines} (${fmt(dup.uniquePercentage)} %). jscpd paties suvestinė: ${dup.jscpdDuplicatedLines} iš ${dup.jscpdTotalLines} eil. (${fmt(dup.jscpdPercentage, 2)} %) – TSX failus jis skaičiuoja dviem formatais (tsx ir javascript), todėl vardiklis didesnis.`, '');
  md.push(table(['Formatas', 'Eil.', 'Fragmentas A', 'Fragmentas B'], dup.list.map((d) => [d.format, d.lines, d.a, d.b])), '');
}
md.push('## Testai ir padengimas (Jest)', '');
if (summary.tests) md.push(`Testų rinkinių: ${summary.tests.suites}, testų: ${summary.tests.tests}, praėjo: ${summary.tests.passed}, nepraėjo: ${summary.tests.failed}.`, '');
md.push(table(['Matavimas', 'Failų', 'Sakiniai', 'Šakos', 'Funkcijos', 'Eilutės'], [
  ['Visi src failai', c.allFiles?.files ?? '–', pct(c.allFiles?.statements), pct(c.allFiles?.branches), pct(c.allFiles?.functions), pct(c.allFiles?.lines)],
  ['Numatytoji Jest konfigūracija (kaip CI)', c.defaultConfig?.files ?? '–', pct(c.defaultConfig?.statements), pct(c.defaultConfig?.branches), pct(c.defaultConfig?.functions), pct(c.defaultConfig?.lines)],
  [`Verslo logika (${BUSINESS_LOGIC.join(', ')})`, c.businessLogic.files, pct(c.businessLogic.statements), pct(c.businessLogic.branches), pct(c.businessLogic.functions), pct(c.businessLogic.lines)],
]), '');
md.push(`Failai be jokio padengimo (${zeroCoverage.length}): ${zeroCoverage.map((f) => `\`${f}\``).join(', ')}.`, '');
md.push('## Statinė analizė', '');
md.push(`ESLint (projekto taisyklės, kaip \`npm run lint\`): klaidų – ${summary.eslint.errors}, įspėjimų – ${summary.eslint.warnings}` +
  ` (produkciniame kode ${summary.eslint.byArea[0].count}, testuose ${summary.eslint.byArea[1].count}, kituose failuose ${summary.eslint.byArea[2].count}).` +
  ` Papildomai įjungta \`complexity\` riba ${CC_LIMIT}: ${lt(ccMsgs.length, 'įspėjimas', 'įspėjimai', 'įspėjimų')}. TypeScript (tsc --noEmit): klaidų – ${tscErrors}.`, '');
md.push(table(['ESLint taisyklė', 'Tipas', 'Produkcinis kodas', 'Testai', 'Kiti failai'],
  summary.eslint.byRule.map((r) => [`\`${r.rule}\``, r.severity, r.produkcinis, r.testai, r.kita])), '');
md.push(table(['Failas:eilutė', 'Taisyklė', 'Pranešimas'], ruleMsgs.map((m) => [`${m.file}:${m.line}`, `\`${m.rule}\``, m.message.replace(/\|/g, '\\|')])), '');
md.push('## Priklausomybių pažeidžiamumai (npm audit)', '');
md.push(table(['Priklausomybės', 'Kritiniai', 'Aukšti', 'Vidutiniai', 'Žemi', 'Iš viso'], [
  ['Visos', vulns?.critical, vulns?.high, vulns?.moderate, vulns?.low, vulns?.total],
  ['Tik produkcinės (--omit=dev)', vulnsProd?.critical, vulnsProd?.high, vulnsProd?.moderate, vulnsProd?.low, vulnsProd?.total],
].map((r) => r.map((x) => x ?? '–'))), '');
if (vulnProdList.length) {
  md.push('', 'Produkcinių priklausomybių pažeidžiamumai:', '');
  md.push(table(['Paketas', 'Lygis', 'Tiesioginė', 'Pranešimų', 'Pavyzdžiai', 'Pataisyta versija'],
    vulnProdList.map((v) => [v.name, v.severity, v.direct ? 'taip' : 'ne', v.advisories, v.via.replace(/\|/g, '\\|'), v.fix])), '');
}
writeFileSync(join(OUT, 'summary.md'), md.join('\n') + '\n');

// Trumpa suvestinė konsolėje
console.log('\n================ SUVESTINĖ ================');
console.log(`Kodas: ${lt(summary.size.prodFiles, 'failas', 'failai', 'failų')}, NLOC ${summary.size.nloc}, ${lt(summary.size.functions, 'funkcija', 'funkcijos', 'funkcijų')}`);
console.log(`Ciklomatinis sudėtingumas: vid. ${fmt(summary.complexity.avgCcn)}; virš ${CC_LIMIT}: lizard – ${complexFns.length}, ESLint – ${ccMsgs.length}`);
for (const f of overLimit.slice(0, 5)) console.log(`   CCN ${String(f.lizard ?? '–').padStart(2)} / ${String(f.eslint ?? '≤10').padStart(3)}  ${f.name}  (${f.file}:${f.line})`);
const worst = [...fileMetrics].filter((f) => f.mi != null).sort((a, b) => a.mi - b.mi).slice(0, 3);
console.log(`Mažiausias palaikomumo indeksas (MI): ${worst.map((f) => `${f.file.replace(/^src\//, '')} ${fmt(f.mi)}`).join(', ')}`);
if (dup) console.log(`Dubliavimas: ${lt(dup.clones, 'fragmentas', 'fragmentai', 'fragmentų')}, ${lt(dup.uniqueLines, 'eilutė', 'eilutės', 'eilučių')} (${fmt(dup.uniquePercentage)} % kodo)`);
if (summary.tests) console.log(`Testai: praėjo ${summary.tests.passed} iš ${summary.tests.tests}`);
if (c.allFiles) console.log(`Padengimas (visi failai): sakiniai ${pct(c.allFiles.statements)}, šakos ${pct(c.allFiles.branches)}; kaip CI: sakiniai ${pct(c.defaultConfig?.statements)}; verslo logika: ${pct(c.businessLogic.statements)}`);
console.log(`ESLint: ${lt(summary.eslint.errors, 'klaida', 'klaidos', 'klaidų')}, ${lt(summary.eslint.warnings, 'įspėjimas', 'įspėjimai', 'įspėjimų')}; TypeScript: ${lt(tscErrors, 'klaida', 'klaidos', 'klaidų')}`);
if (vulns) console.log(`npm audit: ${lt(vulns.total, 'pažeidžiamumas', 'pažeidžiamumai', 'pažeidžiamumų')} (produkcinėse – ${vulnsProd?.total ?? '–'})`);
console.log(`\nVisa suvestinė: ${outArg(join(OUT, 'summary.md'))}`);
