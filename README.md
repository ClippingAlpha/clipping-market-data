# Clipping market data

An open daily archive of the paid clipping and UGC campaign market, from [ClippingAlpha](https://clippingalpha.com): the ClipCPM Index of pay per 1,000 views, each clipping platform's campaigns and rates, the public campaigns active each month, and a daily file with live counts, budget left and what started and ended in the last 24 hours.

Data: ClippingAlpha (clippingalpha.com). License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Files

| Path | What it holds |
| --- | --- |
| `data/csv/*.csv` | A daily mirror of every CSV file published on [clippingalpha.com/data](https://clippingalpha.com/data), with the same names and columns. |
| `data/daily/YYYY-MM-DD.json` | The daily market file for one UTC day, exactly as served. |
| `data/market.csv` | One row per day with the headline numbers of the daily file, for spreadsheets and charts. |

A GitHub Action runs every day at 06:17 UTC and commits what changed. It can also be run by hand (Actions, Daily snapshot, Run workflow). Running it twice on one day replaces that day's JSON file and row.

## The CSV files

The CSV files and their data dictionary are defined on [clippingalpha.com/data](https://clippingalpha.com/data). This repository copies them as published, with line endings normalized to LF.

| File | What it holds |
| --- | --- |
| `cpm-index-YYYY-MM.csv` | The [ClipCPM Index](https://clippingalpha.com/index/cpm) by campaign type and social app: quartiles of advertised rates per 1,000 views, realized pay on clipping campaigns and what the index leaves out, one metric per row. |
| `boards-YYYY-MM.csv` | Each clipping platform's public campaigns in the month, those in the index, and the quartiles of their rates per 1,000 views. |
| `campaigns-YYYY-MM.csv` | The public campaigns active in the month: page, brand, name, round, type, clipping platform, pay model, social apps, first seen, ended, and an 18+ flag. |
| `launch-baseline-2026-09.csv` | The numbers of the 27 Sep 2026 crawl. |

The current month's files follow the live reading and change every day, so this repository's commit history is their daily history. A month's index and platform files freeze when it closes, on the 1st.

## The daily JSON

Source: `https://clippingalpha.com/data/market/daily.json`, a public, read-only file cached for five minutes. It adds what the CSV files do not carry: live counts and budget left now, the last 24 hours, and the social app and niche breakdowns. Field names follow the CSV files.

Top level:

| Field | Meaning |
| --- | --- |
| `schema_version` | The version of this layout. It changes only when a field is renamed or removed. New fields are added without a change. |
| `date` | The UTC day the snapshot is for. |
| `generated_at` | When the file was generated, UTC. |
| `checked_at` | When the newest live listing behind the numbers was last read from its clipping platform, UTC. |
| `source`, `documentation`, `repository`, `license`, `license_url`, `attribution` | Where the data comes from and how to credit it. |

`totals`:

| Field | Meaning |
| --- | --- |
| `live_campaigns` | Public campaigns live now across the tracked clipping platforms. A campaign listed on two clipping platforms counts once. |
| `boards_live` | Clipping platforms with at least one live campaign. |
| `budget_left_usd` | The budget left on live campaigns, in USD, summed over the campaigns whose clipping platform shows a budget. |
| `new_campaigns_24h` | Live campaigns that went live in the last 24 hours. |
| `new_budget_usd_24h` | The total budgets those new campaigns posted, in USD, where shown. |
| `new_budget_campaigns_24h` | How many new campaigns stand behind `new_budget_usd_24h`. |
| `ended_campaigns_24h` | Campaign rounds that ended in the last 24 hours. |

`cpm_index`, the ClipCPM Index now, the same reading as the current month's `cpm-index` file:

| Field | Meaning |
| --- | --- |
| `method` | The method version, for example `clipcpm-v1`, described on the [ClipCPM Index](https://clippingalpha.com/index/cpm) page. |
| `live_read` | Live campaigns read. |
| `campaigns` | Live campaigns in the index: a public rate per 1,000 views, none left out. |
| `excluded` | Live campaigns left out, by reason: `flat` (flat fee per post), `auction`, `contest`, `other_pay`, `no_rate` and `too_good` (a rate above the credibility ceiling). |
| `cells` | One row per `campaign_type` and `platform` (`all` meaning every one) with `campaigns`, `rate_p25_usd`, `rate_median_usd` and `rate_p75_usd`, in USD per 1,000 views. A group under 3 campaigns has no row. |

`campaign_types`: one row each for `clipping`, `ugc`, `logo` and `music` with `live_campaigns`, `new_campaigns_24h` and `budget_left_usd`.

`boards`: one row per tracked clipping platform with `board`, `board_slug`, `live_campaigns`, `live_by_type`, `rate_median_usd` (median advertised rate per 1,000 views of its live campaigns) and `budget_left_usd`.

`platforms` (social apps) and `niches`: one row each with `platform` or `niche`, `name`, `live_campaigns`, `rate_median_usd`, `budget_left_usd` and `budget_lasted_median_days`, the median number of days the budgets of rounds that ended in the last 90 days lasted. A campaign that pays on several social apps, or sits in several niches, counts in each. Medians need 3 campaigns or more.

Money is in USD. A `null` means the number is not known, never zero.

## Columns in market.csv

`date`, `generated_at`, `checked_at`, every field of `totals`, `live_clipping`, `live_ugc`, `live_logo`, `live_music`, `live_read`, `index_campaigns`, then the index's clipping row on every app (`clipping_campaigns`, `clipping_rate_p25_usd`, `clipping_rate_median_usd`, `clipping_rate_p75_usd`) and its row over every type and app (`all_campaigns`, `all_rate_median_usd`). An empty cell means the number is not known. New columns are only ever added at the end.

## Caveats

- This is a snapshot of public listings at one moment a day. Budgets move by the minute, and a campaign can launch and end between two snapshots.
- The rates are what the clipping platforms advertise. What a post earns depends on its views, the brand approving it, payout rules, caps and fees.
- Clipping platforms change their terms, layouts and what they show publicly. A platform that stops showing budgets drops out of the budget sums.
- Coverage is the clipping platforms ClippingAlpha tracks (Content Rewards, Promote.fun, Clipster, Clipstake, Vyro and Evangelist today), not the whole market. The list can change.
- Methods can improve over time. A change that renames or removes a field of the daily file bumps `schema_version`.
- No clipper handles, post links or members-only campaigns are in any file.

## License and credit

The data is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit it with:

> Data: ClippingAlpha (clippingalpha.com)

and, where you can, a link to [clippingalpha.com/data](https://clippingalpha.com/data). The full license text is in [LICENSE](LICENSE).

ClippingAlpha is operated by Momentist, Inc. Questions or corrections: privacy@clippingalpha.com or [clippingalpha.com/support](https://clippingalpha.com/support).
