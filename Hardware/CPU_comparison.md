# CPU comparison

The CPUs that show up in [PC Upgrade.md](PC%20Upgrade.md). Scores are PassMark (cpubenchmark.net, Nov 2026),
marked with ~ where the number moves between runs. Prices are rough used prices in the EU.

## Speed

| CPU             | Socket  | Year | Cores / threads | CPU Mark | 1-thread | Notes                                                            |
| --------------- | ------- | ---- | --------------: | -------: | -------: | ---------------------------------------------------------------- |
| i7-3770S        | LGA1155 | 2012 |           4 / 8 |    6,411 |    2,038 | Current CPU. No AVX2, so CPU inference takes the slow code path. |
| i7-9700K        | LGA1151 | 2018 |           8 / 8 |   14,397 |    2,856 | No hyper-threading, so 8 threads only.                           |
| i9-9900K        | LGA1151 | 2018 |          8 / 16 |  ~18,200 |    2,907 | Newest CPU a Z390 board takes. Runs hot.                         |
| Ryzen 7 3800X   | AM4     | 2019 |          8 / 16 |   22,942 |    2,709 | Zen 2. A 5800X beats it for similar money.                       |
| Ryzen 5 5600X   | AM4     | 2020 |          6 / 12 |   21,820 |    3,366 | Best balance of watts and speed on AM4.                          |
| Ryzen 7 5700X3D | AM4     | 2024 |          8 / 16 |   26,307 |    2,969 | 96 MB L3 helps games, not llama.cpp. Low clocks.                 |
| Ryzen 5 7600    | AM5     | 2023 |          6 / 12 |  ~26,300 |    3,907 | The 7600X with a 65 W limit and a cooler in the box.             |
| Ryzen 7 5800X   | AM4     | 2020 |          8 / 16 |   27,649 |    3,449 | About 27% more multi-core than a 5600X, at 105 W.                |
| Ryzen 5 7600X   | AM5     | 2022 |          6 / 12 |   28,252 |    4,127 | Best single thread here. Hits 95 C by design.                    |
| Ryzen 9 3950X   | AM4     | 2019 |         16 / 32 |   38,389 |    2,701 | 16 cores for compiles. Single thread barely above a 5600X.       |
| Ryzen 9 5950X   | AM4     | 2020 |         16 / 32 |   45,228 |    3,476 | Fastest AM4 drop-in. Overkill for coding and inference.          |

## Power, cooling, price

| CPU             |   TDP |      PPT | All-core draw | ECO mode        | Used price |
| --------------- | ----: | -------: | ------------: | --------------- | ---------: |
| i7-3770S        |  65 W |          |      ~50-60 W | none            |    ~30 EUR |
| i7-9700K        |  95 W | PL2 open |    ~120-140 W | PL1/PL2 in BIOS |    ~90 EUR |
| i9-9900K        |  95 W | PL2 open |    ~150-180 W | PL1/PL2 in BIOS |   ~160 EUR |
| Ryzen 7 3800X   | 105 W |    142 W |    ~120-140 W | 65 W (88 W PPT) |   ~100 EUR |
| Ryzen 5 5600X   |  65 W |     88 W |      ~75-90 W | 45 W (61 W PPT) |    ~70 EUR |
| Ryzen 7 5700X3D | 105 W |    142 W |    ~100-110 W | 65 W (88 W PPT) |   ~190 EUR |
| Ryzen 5 7600    |  65 W |     88 W |      ~70-85 W | 45 W (61 W PPT) |   ~150 EUR |
| Ryzen 7 5800X   | 105 W |    142 W |    ~115-130 W | 65 W (88 W PPT) |   ~120 EUR |
| Ryzen 5 7600X   | 105 W |    142 W |     ~90-110 W | 65 W (88 W PPT) |   ~140 EUR |
| Ryzen 9 3950X   | 105 W |    142 W |    ~140-150 W | 65 W (88 W PPT) |   ~220 EUR |
| Ryzen 9 5950X   | 105 W |    142 W |        ~140 W | 65 W (88 W PPT) |   ~300 EUR |

**Power terms in this table**

- **TDP** is a cooling number, not a consumption number. A 65 W part can draw more than 65 W for a while.
- **PPT** (AMD) is the real package power limit. Every AMD part has one, and it always sits above the TDP:
  65 W TDP means 88 W PPT, 105 W TDP means 142 W PPT.
- **PL1 / PL2** (Intel) are the long-term and short-term limits. **PL2 open** means the board ignores the
  short-term limit, so a 95 W chip like the 9700K or 9900K holds 120-180 W for minutes, not seconds, as long
  as the cooler can take it. That is why these two need a real cooler and a case with airflow.

## How to read this

- **CPU Mark** is the multi-core total. It answers "how fast does a compile, an unpack or a model load finish".
- **1-thread** is how snappy the machine feels: editor, shell, browser, git. It barely moves multi-core work.
- **llama.cpp token speed is not in this table.** It comes from VRAM bandwidth. The CPU only matters when
  weights run on the CPU: hybrid offload, or MoE models with experts in RAM.
- **Energy is watts times time.** A CPU that is 30% faster at 30% more watts uses the same energy and finishes
  sooner. That is why efficiency, not raw power, decides the bill.

## Efficiency, in one number

CPU Mark divided by all-core watts. Higher is better.

| CPU             | CPU Mark / W |
| --------------- | ------------ |
| Ryzen 5 7600    | ~340         |
| Ryzen 5 7600X   | ~280         |
| Ryzen 5 5600X   | ~265         |
| Ryzen 9 3950X   | ~265         |
| Ryzen 7 5700X3D | ~250         |
| Ryzen 7 5800X   | ~225         |
| Ryzen 7 3800X   | ~190         |
| i7-3770S        | ~115         |
| i7-9700K        | ~110         |
| i9-9900K        | ~110         |

Coffee Lake (9700K, 9900K) turns most of its watts into heat. Zen 3 and Zen 4 give roughly double the work
per watt, which matters more than the CPU Mark total for a machine that is on all day.

## ECO mode

- **AMD:** one BIOS setting. A 105 W part drops to the 65 W profile (PPT 142 W to 88 W), a 65 W part drops to
  45 W (PPT 88 W to 61 W). It costs 3-8% in multi-core and almost nothing in single-thread.
- **Intel:** there is no ECO mode. On a Z board you set PL1/PL2 by hand. A 9700K becomes a ~65 W CPU that way,
  but you lose the all-core turbo; on B660/B760 the options are more limited.
- **Fan noise follows power.** The same cooler is quiet on a 65 W part and audible on a 105 W part at stock.
  ECO mode is the cheapest noise fix there is.

## What each CPU means for this build

- **i7-3770S** - enough for coding and enough for llama.cpp, because the GPU does the work. No AVX2, so any
  inference that lands on the CPU runs the slow path. Keep it if one GPU is all you need.
- **i7-9700K** - 8 threads with no hyper-threading, and 120-140 W unless capped. Weakest of the new-board
  options and the thirstiest per unit of work.
- **i9-9900K** - the end of the Z390 road. Fast, hot, and nothing cheaper to upgrade to later.
- **Ryzen 7 3800X** - fine CPU, wrong generation. A 5800X costs about the same used and does more with less.
- **Ryzen 5 5600X** - the safe low-power pick. 65 W, cooler in the box, and 21,820 is plenty for coding and
  for driving an inference GPU.
- **Ryzen 7 5700X3D** - 96 MB of cache that helps games, not llama.cpp. Buy it only if gaming comes later.
- **Ryzen 5 7600** - the 7600X with a sane power limit and a stock cooler. Best efficiency in the table.
- **Ryzen 7 5800X** - the sweet spot for a two-GPU build on DDR4: 8 cores for compiles at ~120 EUR used.
  In ECO mode it behaves like a 65 W part.
- **Ryzen 5 7600X** - best single thread and the highest efficiency of the fast parts. Needs DDR5, and 95 C
  is normal for Zen 4, not a fault.
- **Ryzen 9 3950X** - 16 cores, great for long compiles, widest gap between idle and load. Single thread is
  barely better than a 5600X, so buy it for the core count only.
- **Ryzen 9 5950X** - the fastest CPU AM4 will ever take. Overkill for coding plus inference.

## What comes in the box

The 5600X, 7600, 3800X and 3770S ship with a stock cooler. The 7600X, 5800X, 5700X3D, 3950X, 5950X, 9700K and
9900K do not, so budget 40-60 EUR for a tower cooler on those.

## Pick order for a power-first llama.cpp build

1. **Ryzen 5 7600** - best work per watt, cooler included, AM5 stays upgradeable. Costs DDR5.
2. **Ryzen 5 5600X** - cheapest complete option, 65 W, DDR4, cooler included.
3. **Ryzen 7 5800X in ECO mode** - when a bundle makes it cheap: 8 cores, 65 W limit, still fast.
4. **Ryzen 9 3950X / 5950X** - only if compiles dominate your day. Otherwise you pay watts for idle cores.
5. **i7-9700K / i9-9900K** - only for the Z390 slot layout or an included NVMe.
