// Fetches the ClippingAlpha daily market file and stores it in this repository:
//   data/daily/YYYY-MM-DD.json  the file as served, one per UTC day
//   data/market.csv             one row per day, the headline numbers
// The day is the file's own `date` field. Running twice on one day replaces that day's file and row.
// No dependencies, Node 20 or newer.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const SOURCE = process.env.SOURCE_URL ?? "https://clippingalpha.com/data/market/daily.json";
const SCHEMA = 1;

const COLUMNS = [
  "date",
  "generated_at",
  "checked_at",
  "live_campaigns",
  "clipping_platforms_live",
  "budget_left_usd",
  "new_campaigns_24h",
  "new_budget_usd_24h",
  "new_budget_campaigns_24h",
  "ended_campaigns_24h",
  "live_clipping",
  "live_ugc",
  "live_logo",
  "live_music",
  "clipping_campaigns_rated",
  "clipping_p25_per_1k_usd",
  "clipping_median_per_1k_usd",
  "clipping_p75_per_1k_usd",
  "all_campaigns_rated",
  "all_median_per_1k_usd",
];

async function fetchJson(url) {
  let last;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "clipping-market-data (github.com/ClippingAlpha/clipping-market-data)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, attempt * 15_000));
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
  const type = (t) => d.campaign_types.find((x) => x.campaign_type === t)?.live_campaigns ?? "";
  const pay = d.pay_per_1k_views_usd;
  const values = {
    date: d.date,
    generated_at: d.generated_at,
    checked_at: d.checked_at,
    ...d.totals,
    live_clipping: type("clipping"),
    live_ugc: type("ugc"),
    live_logo: type("logo"),
    live_music: type("music"),
    clipping_campaigns_rated: pay.clipping?.campaigns,
    clipping_p25_per_1k_usd: pay.clipping?.p25,
    clipping_median_per_1k_usd: pay.clipping?.median,
    clipping_p75_per_1k_usd: pay.clipping?.p75,
    all_campaigns_rated: pay.all?.campaigns,
    all_median_per_1k_usd: pay.all?.median,
  };
  return COLUMNS.map((c) => cell(values[c])).join(",");
}

const data = await fetchJson(SOURCE);
if (data.schema_version !== SCHEMA) throw new Error(`Expected schema_version ${SCHEMA}, got ${data.schema_version}. Update this script.`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date ?? "")) throw new Error(`Bad date: ${data.date}`);

await mkdir("data/daily", { recursive: true });
await writeFile(`data/daily/${data.date}.json`, `${JSON.stringify(data, null, 2)}\n`);

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
