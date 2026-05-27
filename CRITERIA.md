# Hatch Fit Score — Ranking Criteria

**North star:** Which thesis should a **3-person Hatch team** build this year — stand up in **10 weeks**, reach **revenue inside 10 weeks**, and grow toward **€10K → €1M** without a pivot?

We do **not** optimise for: TAM fantasy, “most innovative AI”, or invented €-by-month forecasts.

---

## Composite: Hatch Fit Score (1–5)

Weighted average of six criteria. **Trap risk** is inverted (high trap = low contribution).

| Criterion | Weight | Key question |
|-----------|--------|----------------|
| **Buildability** | 25% | Can a 3-person team ship a sellable v1 in **3d · 3w · 10w** on Shopify? |
| **Speed to revenue** | 20% | First paid install / obvious ROI in **≤10 weeks**? |
| **Wedge clarity** | 15% | Does a merchant get the value in **one sentence**? |
| **Distribution** | 15% | Reachable ICP via App Store, content, or tight outbound? |
| **Trap risk** | 10% | Incumbent moat, platform risk, science-project tech? *(inverted)* |
| **Expansion** | 15% | Path to €10K MRR and €1M without changing the product category? |

**Verdict bands:**  
- **≥4.2** — Strong Hatch fit  
- **3.5–4.19** — Viable with scope discipline  
- **2.8–3.49** — Borderline / needs wedge cut  
- **<2.8** — Trap or wrong team size  

---

## Criterion definitions (1–5 anchors)

### 1. Buildability (25%)

| Score | Meaning | Examples from dataset |
|-------|---------|----------------------|
| **5** | Theme app extension or single Shopify API; v1 in days | **H-08** ZeroPage (OOS/404 extension + embeddings), **H-09** CheckoutPulse (checkout block), **H-47** GorgiasLite (helpdesk sidebar) |
| **4** | Standard Shopify app + one integration; v1 in ~3 weeks | **H-22** HybridSave (Selling Plans toggle), **H-33** PrivyEscape (migration workflow) |
| **3** | Multiple integrations or non-trivial data pipeline | **H-02** LookCart (co-purchase + embeddings), **H-39** ListingGuard (nightly catalog crawl) |
| **2** | Hard platform surface (POS, B2B portal) or heavy ML | **H-21** POSReturn Pro, **H-26** FaireBreak, **H-46** Fit-Me (store-specific ML) |
| **1** | Research-grade or realtime multimodal on PDP | **H-03** FittingRoom3D (generative 3D mesh), **H-20** FounderVoice (Realtime voice clone), **H-32** CastingCall Live |

### 2. Speed to revenue (20%)

| Score | Meaning | Examples |
|-------|---------|----------|
| **5** | Obvious day-1 value; self-serve; replaces paid line item | **H-14** vs Yotpo pricing, **H-48** WISMO automation, **H-31** SMSFlat |
| **4** | App Store subscription; merchant sees ROI in first billing cycle | **H-08**, **H-29** DunningDesk (per-save fee) |
| **3** | Needs onboarding / data before value | **H-01** ThresholdIQ (needs order history), **H-40** RetailIQ |
| **2** | Long setup or enterprise-ish buyer | **H-06** Wholesale One, **H-34** FlowSegment |
| **1** | Revenue depends on behaviour change or network effects | **H-26** FaireBreak (migrate stockists), **H-12** FlashFair (habit formation) |

### 3. Wedge clarity (15%)

| Score | Meaning | Examples |
|-------|---------|----------|
| **5** | One painful moment, one fix | **H-08** “OOS pages earned €0”, **H-48** “WISMO without humans” |
| **4** | Clear job-to-be-done, slightly broader | **H-33** “Escape Privy pricing trap” |
| **3** | Bundle of features | **H-25** TrioSocial, **H-43** Occasion OS |
| **2** | Platform play / vague “AI for X” | **H-40** RetailIQ scorecard |
| **1** | Hard to explain in 10 seconds | **H-11** SessionMind realtime personas |

### 4. Distribution (15%)

| Score | Meaning | Examples |
|-------|---------|----------|
| **5** | Shopify App Store + clear ICP ($50K–$2M DTC) | **H-47**, **H-08**, **H-31** |
| **4** | App Store + content/SEO wedge | **H-14**, **H-33** |
| **3** | Needs outbound or larger merchants | **H-28** RechargeRecovery, **H-41** NightWatch |
| **2** | POS / B2B / EU-specific motion | **H-21**, **H-26** |
| **1** | Niche vertical only | **H-50** HabitatKit (reptile) |

### 5. Trap risk (10%, inverted)

Higher **trap** = lower score. We store `trapRisk` as “safety” (5 = safe, 1 = swamp).

| Score | Meaning | Examples |
|-------|---------|----------|
| **5** | Greenfield wedge, no entrenched suite war | **H-08**, **H-18** ExchangeUp |
| **4** | Competitors exist but differentiated mechanic | **H-10** QuizCart vs Octane placement |
| **3** | Competing on price with known incumbents | **H-14** vs Yotpo, **H-47** vs Gorgias |
| **2** | Core product of a platform giant | **H-24** vs Recharge retention, **H-30** vs Klaviyo timing |
| **1** | Science project or regulatory/platform roulette | **H-03**, **H-32**, **H-41** (auto repricing liability) |

### 6. Expansion (15%)

| Score | Meaning | Examples |
|-------|---------|----------|
| **5** | Wedge → platform in same merchant workflow | **H-48** WISMO → full CS agent, **H-39** audits → ops suite |
| **4** | Clear upsell tiers | **H-29** per-save → more channels |
| **3** | Bolt-on, limited TAM expansion | **H-09** CheckoutPulse |
| **2** | Single feature, hard to expand | **H-13** GuessRight gamification |
| **1** | Vertical lock-in | **H-50** reptile only |

---

## Hard gates (deterministic caps)

Applied **after** criterion scores. Each gate caps **buildability** and/or adjusts composite.

| Gate ID | Trigger (keyword / pattern in wedge + one_liner) | Effect |
|---------|--------------------------------------------------|--------|
| `G3D` | generative 3D, 3D mesh, AR try-on, drape-capable | Cap buildability ≤ **2** |
| `REALTIME_AI` | Realtime API, live-video, voice clone, <300ms persona swap | Cap buildability ≤ **2** |
| `INCUMBENT_WAR` | vs Yotpo / vs Gorgias / vs Klaviyo / vs Recharge **core** on price alone | Cap trapRisk ≤ **2** |
| `POS_ENTERPRISE` | Shopify POS overhaul, $10M+ only motion | Cap distribution ≤ **3** |
| `AUTO_REPRICE` | closed-loop repricing, fires Admin API price mutation | Cap trapRisk ≤ **2**, flag review |

Gates are **visible** in the UI (`gatesTriggered[]`).

---

## v1 timeline lens (judgment, not scored separately)

For **#1 pick** narrative only:

- **3 days** — installable shell, one merchant-visible win  
- **3 weeks** — paid beta, 5–10 stores  
- **10 weeks** — App Store listing, €10K path credible  

---

## Known traps (manual review list)

These often **look** like winners; our gates + trap risk should demote them:

- **H-03** FittingRoom3D — 3D research problem  
- **H-11** SessionMind — realtime PDP reshuffle + LLM  
- **H-20** FounderVoice — Realtime voice on every PDP  
- **H-32** CastingCall Live — live video + realtime AI Q&A  
- **H-41** NightWatch — autonomous price mutations (trust/liability)  
- **H-25** TrioSocial — three apps in one (scope creep)  

---

## Questions we’re unsure about (honesty)

1. **H-10 QuizCart** — checkout extension policy stability vs Octane; ranked high on wedge, medium on trap.  
2. **H-29 DunningDesk** — per-save pricing is great for revenue speed; depends on webhook coverage across subscription apps.  
3. **H-41 NightWatch** — strong merchant pain; gate keeps it out of top 5 until liability UX is scoped.

---

*This document is the source of truth. Code in `lib/criteria.ts` mirrors these weights and gates.*
