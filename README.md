# Clipping market data

An open daily dataset of the paid clipping and UGC campaign market: how many campaigns are live, how much budget is left, what they pay per 1,000 views, and what started and ended in the last 24 hours. Broken down by clipping platform, campaign type, social app and niche.

Data: ClippingAlpha (clippingalpha.com). License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Files

| Path | What it holds |
| --- | --- |
| `data/daily/YYYY-MM-DD.json` | The full snapshot for one UTC day, exactly as served by the source. |
| `data/market.csv` | One row per day with the headline numbers, for spreadsheets and charts. |

A GitHub Action fetches the source every day at 06:17 UTC and commits the new files. It can also be run by hand (Actions, Daily snapshot, Run workflow). Running it twice on one day replaces that day's file and row.

## Source

`https://clippingalpha.com/data/market/daily.json`, a public, read-only JSON file that [ClippingAlpha](https://clippingalpha.com) builds from the public listings of the clipping platforms it tracks: Content Rewards, Promote.fun, Clipster, Clipstake, Vyro and Evangelist. The file is cached for five minutes. The same numbers appear on the site's public pages: [clipping platforms](https://clippingalpha.com/boards), [social apps](https://clippingalpha.com/platforms), [niches](https://clippingalpha.com/niches) and the [ClipCPM Index](https://clippingalpha.com/index/cpm). Monthly CSV files with a data dictionary are on [clippingalpha.com/data](https://clippingalpha.com/data).

Every figure is an aggregate. The files hold no campaign, brand, title, clipper, post or link, and no campaign that is visible only to members of a clipping platform.

## Fields in the daily JSON

Top level:

| Field | Meaning |
| --- | --- |
| `schema_version` | The version of this layout. It changes only when a field is renamed or removed. New fields are added without a change. |
| `date` | The UTC day the snapshot is for. |
| `generated_at` | When the file was generated (UTC). |
| `checked_at` | When the newest live listing behind the numbers was last read from its clipping platform (UTC). |
| `source`, `documentation`, `repository`, `license`, `license_url`, `attribution` | Where the data comes from and how to credit it. |

`totals`:

| Field | Meaning |
| --- | --- |
| `live_campaigns` | Public campaigns live now across every tracked clipping platform. One campaign listed on two platforms counts once. |
| `clipping_platforms_live` | Clipping platforms with at least one live campaign. |
| `budget_left_usd` | The sum of the budget left on live campaigns, in USD, over the campaigns whose clipping platform shows a budget. |
| `new_campaigns_24h` | Live campaigns that went live in the last 24 hours. |
| `new_budget_usd_24h` | The total budgets those new campaigns posted, in USD, where shown. |
| `new_budget_campaigns_24h` | How many new campaigns stand behind `new_budget_usd_24h`. |
| `ended_campaigns_24h` | Campaign rounds that ended in the last 24 hours. |

`pay_per_1k_views_usd`, the ClipCPM Index, the advertised pay per 1,000 views of live campaigns ([method](https://clippingalpha.com/index/cpm)):

| Field | Meaning |
| --- | --- |
| `method` | The method version, for example `clipcpm-v1`. |
| `campaigns_read` | Live campaigns read. |
| `campaigns_in_index` | Live campaigns with a usable rate per 1,000 views. |
| `left_out` | Campaigns left out, by reason: `flat` (flat fee per post), `auction`, `contest`, `other_pay`, `no_rate`, `too_good` (a rate above the credibility ceiling). |
| `all` | Quartiles over every campaign type and social app. |
| `clipping` | Quartiles over clipping campaigns, the headline number. |
| `cells` | Quartiles per `campaign_type` and `social_platform`, `all` meaning every one. |

Each quartile object has `campaigns`, `p25`, `median` and `p75`, in USD per 1,000 views. A group with fewer than 3 campaigns has no quartiles: the object is `null` or the cell is absent.

`campaign_types`: one row each for `clipping`, `ugc`, `logo` and `music`, with `live_campaigns`, `new_campaigns_24h` and `budget_left_usd`.

`clipping_platforms`: one row per tracked clipping platform with `slug`, `name`, `live_campaigns`, `live_by_type`, `median_pay_per_1k_usd` and `budget_left_usd`.

`social_platforms` and `niches`: one row each with `slug`, `name`, `live_campaigns`, `median_pay_per_1k_usd`, `budget_left_usd` and `budget_lasted_median_days`, the median number of days the budgets of rounds that ended in the last 90 days lasted (`null` under 3 rounds). A campaign that pays on several social apps, or sits in several niches, counts in each.

Money is in USD. A `null` means the number is not known, never zero.

## Columns in market.csv

`date`, `generated_at`, `checked_at`, then every field of `totals`, then `live_clipping`, `live_ugc`, `live_logo`, `live_music`, then `clipping_campaigns_rated`, `clipping_p25_per_1k_usd`, `clipping_median_per_1k_usd`, `clipping_p75_per_1k_usd`, `all_campaigns_rated` and `all_median_per_1k_usd`. An empty cell means the number is not known. New columns are only ever added at the end.

## Caveats

- This is a snapshot of public listings at one moment a day. Budgets move by the minute, and a campaign can launch and end between two snapshots.
- The rates are what the clipping platforms advertise. What a post earns depends on its views, the brand approving it, payout rules, caps and fees.
- Clipping platforms change their terms, layouts and what they show publicly. A platform that stops showing budgets drops out of the budget sums.
- Coverage is the clipping platforms ClippingAlpha tracks, not the whole market. The list of platforms can change.
- Methods can improve over time. A change that renames or removes a field bumps `schema_version`.

## License and credit

The data is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit it with:

> Data: ClippingAlpha (clippingalpha.com)

and, where you can, a link to [clippingalpha.com/data](https://clippingalpha.com/data). The full license text is in [LICENSE](LICENSE).

ClippingAlpha is operated by Momentist, Inc. Questions or corrections: privacy@clippingalpha.com or [clippingalpha.com/support](https://clippingalpha.com/support).
