// Mirrors ClippingAlpha's open clipping market data into this repository, once a day:
//   data/csv/<file>.csv         every CSV file listed on clippingalpha.com/data, as published
//   data/daily/YYYY-MM-DD.json  the daily market file (/data/market/daily.json), one per UTC day
//   data/market.csv             one row per day with the headline numbers of the daily file
// The current month's CSV files follow the live reading, so their history is this repository's
// commit history. Closed months are frozen at the source and stop changing here.
// The day is the daily file's own `date` field. Running twice on one day replaces that day's file and row.
// No dependencies, Node 20 or newer.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const SITE = (process.env.SITE_URL ?? "https://clippingalpha.com").replace(/\/+$/, "");
const SCHEMA = 1;
const UA = "clipping-market-data (github.com/ClippingAlpha/clipping-market-data)";

const COLUMNS = [
  "date",
  "generated_at",
  "checked_at",
  "live_campaigns",
  "boards_live",
  "budget_left_usd",
  "new_campaigns_24h",
  "new_budget_usd_24h",
  "new_budget_campaigns_24h",
  "ended_campaigns_24h",
  "live_clipping",
  "live_ugc",
  "live_logo",
  "live_music",
  "live_read",
  "index_campaigns",
  "clipping_campaigns",
  "clipping_rate_p25_usd",
  "clipping_rate_median_usd",
  "clipping_rate_p75_usd",
  "all_campaigns",
  "all_rate_median_usd",
];

async function get(url, accept) {
  let last;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept, "user-agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      last = err;
      if (attempt < 4) await new Promise((r) => setTimeout(r, attempt * 15_000));
    }
  }
  throw new Error(`Could not fetch ${url}: ${last}`);
}

function cell(value) {
  if (value == null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function row(d) {
  const type = (t) => d.campaign_types.find((x) => x.campaign_type === t)?.live_campaigns;
  const index = (t) => d.cpm_index.cells.find((c) => c.campaign_type === t && c.platform === "all");
  const clipping = index("clipping");
  const all = index("all");
  const values = {
    date: d.date,
    generated_at: d.generated_at,
    checked_at: d.checked_at,
    ...d.totals,
    live_clipping: type("clipping"),
    live_ugc: type("ugc"),
    live_logo: type("logo"),
    live_music: type("music"),
    live_read: d.cpm_index.live_read,
    index_campaigns: d.cpm_index.campaigns,
    clipping_campaigns: clipping?.campaigns,
    clipping_rate_p25_usd: clipping?.rate_p25_usd,
    clipping_rate_median_usd: clipping?.rate_median_usd,
    clipping_rate_p75_usd: clipping?.rate_p75_usd,
    all_campaigns: all?.campaigns,
    all_rate_median_usd: all?.rate_median_usd,
  };
  return COLUMNS.map((c) => cell(values[c])).join(",");
}

// 1. The CSV files /data lists, as published.
const page = await get(`${SITE}/data`, "text/html");
const files = [...new Set([...page.matchAll(/\/data\/([a-z-]+-\d{4}-\d{2}\.csv)/g)].map((m) => m[1]))].sort();
if (files.length === 0) throw new Error(`No CSV files found on ${SITE}/data.`);
await mkdir("data/csv", { recursive: true });
for (const file of files) {
  const text = await get(`${SITE}/data/${file}`, "text/csv");
  await writeFile(`data/csv/${file}`, text.replace(/\r\n/g, "\n"));
}
console.log(`Mirrored ${files.length} CSV files.`);

// 2. The daily market file.
const data = JSON.parse(await get(`${SITE}/data/market/daily.json`, "application/json"));
if (data.schema_version !== SCHEMA) throw new Error(`Expected schema_version ${SCHEMA}, got ${data.schema_version}. Update this script.`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date ?? "")) throw new Error(`Bad date: ${data.date}`);
await mkdir("data/daily", { recursive: true });
await writeFile(`data/daily/${data.date}.json`, `${JSON.stringify(data, null, 2)}\n`);

// 3. One row a day.
const header = COLUMNS.join(",");
let lines = [];
try {
  lines = (await readFile("data/market.csv", "utf8")).split("\n").filter(Boolean);
} catch {
  lines = [];
}
if (lines[0] && lines[0] !== header) throw new Error("data/market.csv has a different header. Add new columns at the end on purpose, then update this script.");
const rows = lines.slice(1).filter((l) => !l.startsWith(`${data.date},`));
rows.push(row(data));
rows.sort();
await writeFile("data/market.csv", `${[header, ...rows].join("\n")}\n`);
console.log(`Stored ${data.date}: ${data.totals.live_campaigns} live campaigns, checked ${data.checked_at}.`);
