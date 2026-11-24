# PC upgrade

Goal: run local models with llama.cpp, plus coding. No gaming.  
Criteria, in this order: **low power consumption**, then VRAM, then everything else.  
CPU speed is at the bottom of the list — the 3770S is enough.  
Benchmarks and power figures of every CPU mentioned here: [CPU_comparison.md](CPU_comparison.md).

## Current PC

| Part  | Model                                       | Year |
| ----- | ------------------------------------------- | ---- |
| MB    | ASUS P8Z77-V LX, socket LGA1155, Z77        | 2012 |
| CPU   | Intel i7-3770S, 4 cores / 8 threads, 65 W   | 2012 |
| RAM   | 32 GB DDR3-1600, 4 x 8 GB Corsair Vengeance |      |
| Disks | SATA only, this board has no M.2 slot       |      |
| GPU   | RTX 4060 Ti 16 GB, undervolted              | 2023 |
| PSU   | Cooler Master 500 W, 80+ Platinum           |      |


### NVMe on PCI adapter issue 

Latest BIOS and drivers. Nothing to update neither in Windows 10 x64.  
Many SATA attached (probably 4).  
Wifi card attached to another slot.  
Audio on the board disabled to save power/chanenls.
Bluetooth active.
The RTX is not recognized when conencted to PCIe slot A, I tried all the PCI settings in the BIOS.  
Finally able to have it running on slot B. So, the GPU is on PCIs slot B.

I have a PCIe adapter on PCIe slot A for a NVMe disk.  
Here the problem. It is never recognized at first start, it requires a restart after Windows is fully loaded. Sometimes 2 restarts.  
Worked in this way for 2 months.  
This last week it started to require 2 restarts and in the last 2 days it started to stop beeing visible, once it caused BSOD.  
Now, it just disappeared. I was able to see it in Explorer but then not able to open the files and finally disappeared. 
In Windows Devices manager... refresh.. it can came up... but it really is unstable.

What to do?


## Where the watts actually go

During inference the GPU pulls 110–120 W (undervolted) and the CPU idles at 5–15 W. So the GPU is the
energy bill, not the CPU. The CPU decides the energy of everything else: boot, compiles, model loading,
file indexing, the browser.

For the same job, "less power" usually means "less energy", because energy = power × time.
A weaker CPU that stays at 65 W for 4 minutes can use more energy than a strong one at 90 W for 2 minutes.
That is the only place the 9700K vs 5600X question matters.

## The CPU is not the limit for llama.cpp

- Decode speed is decided by **VRAM bandwidth** (288 GB/s on the 4060 Ti), not by cores.
- Sampling, tokenizing and the chat loop are microseconds of work even on a 2012 CPU.
- Single thread: 3770S ≈ 2,040 vs 5600X ≈ 3,366 PassMark. That moves web benchmarks, not tok/s.

The CPU only matters when weights run **on the CPU**: hybrid offload, or MoE models with experts in RAM.
Nice to have, not a reason to upgrade.

## Power of the parts in play

| Part            | TDP     | Typical real draw        | Note                                        |
| --------------- | ------- | ------------------------ | ------------------------------------------- |
| i7-3770S        | 65 W    | ~50–65 W all-core        | 22 nm, current CPU                          |
| i7-9700K        | 95 W    | ~120–140 W all-core      | Z390 ignores the TDP by default; can cap it |
| Ryzen 5 5600X   | 65 W    | ~75–90 W all-core        | ECO mode in BIOS drops it to ~45 W          |
| Z390 chipset    | ~4 W    | ~4 W, always on          | passive heatsink                            |
| X570 chipset    | ~10 W   | ~10 W, always on         | small fan, runs the whole time the PC is on |
| 120 mm AIO      | 5–8 W   | 5–8 W, always on         | pump + fan; an air cooler adds 0 W          |
| RTX 4060 Ti     | 160 W   | 110–120 W undervolted    | ~5–8 W idle                                 |
| RTX 3060 12 GB  | 170 W   | ~110 W undervolted       | ~5–8 W idle                                 |
| RTX 3090        | 350 W   | 300–350 W                | wrong part for a low-power build            |

What this means for the two bundles:
- **Idle (coding, browser, editor):** both systems land around 45–60 W at the wall. The 5600X saves on the
  CPU side but the X570 chipset takes ~6 W back. The difference is a few watts — not a reason to choose.
- **Under load (compile, unpack, model load):** the 5600X does the work with less energy. 7 nm, 65 W class,
  and ECO mode is one BIOS setting away.
- **During inference:** identical. The CPU sits idle in both cases; the GPU decides.

## The slot problem

The board has two "x16" slots, but only the blue one is wired to the CPU:
- blue slot: PCIe 3.0 x16
- black slot: PCIe 2.0 **x4** (from the Z77 chipset)

The card does not run in the blue slot at all (tried a lot), so it sits in the black one at 2.0 x4.
For llama.cpp that costs model load time (16 GB takes ~8 s instead of ~2 s) and blocks a second card.
It does not cost tokens per second.

Before buying anything, retry the blue slot. It is free:
- Update the BIOS to the last version ASUS shipped for this board.
- In the BIOS: disable CSM (pure UEFI boot), enable "Above 4G Decoding", set the slot to "Gen 3" instead of "Auto".
- Reseat the card, try a different 8-pin cable, test the card in another PC if possible.

If the blue slot is dead, only a new board fixes it. That is the honest reason to buy one of the bundles.

## Bundle #1 — Intel, 360 EUR 

[https://www.ebay.it/itm/860160421053]

| Part | Model                                           | Year |
| ---- | ----------------------------------------------- | ---- |
| MB   | Gigabyte Z390 AORUS ULTRA, socket LGA1151, Z390 | 2018 |
| CPU  | Intel i7-9700K, 8 cores / 8 threads, 95 W       | 2018 |
| RAM  | 32 GB DDR4, speed not stated                    |      |
| Disk | AORUS NVMe 500 GB                               |      |

- Two cards at PCIe 3.0 x8/x8, both from the CPU. Best slot layout of the two.
- Three M.2 slots, all PCIe 3.0 x4. The 500 GB NVMe is included.
- No CPU cooler, and the 9700K needs a real one (~40 EUR). It also pulls 120–140 W all-core unless you
  cap it in the BIOS (PL1/PL2), which costs speed.
- 9th gen is the newest CPU this board takes (i9-9900K). No cheaper future upgrade.
- Passive chipset: no small fan running all day.

## Bundle #2 — AMD, 350 EUR

[https://www.ebay.it/itm/287696521007]

| Part   | Model                                      | Year |
| ------ | ------------------------------------------ | ---- |
| MB     | MSI MPG X570 Gaming Plus, socket AM4, X570 | 2019 |
| CPU    | Ryzen 5 5600X, 6 cores / 12 threads, 65 W  | 2020 |
| RAM    | 32 GB DDR4 G-Skill, speed not stated       | ?    |
| Cooler | NZXT 120 mm liquid cooler                  | ?    |

- One PCIe 4.0 x16 slot from the CPU (the 4060 Ti runs at 4.0 x8, full speed) plus one x16-length slot at
  PCIe 4.0 **x4** from the chipset. No x8/x8.
- 4.0 x4 is ~7.9 GB/s, the same as 3.0 x8 on the Z390. A second card gets the same bandwidth on both.
- Two M.2 slots: main one PCIe 4.0 x4, second PCIe 3.0 x4. No disk included (~60 EUR for 1 TB).
- 65 W CPU, ECO mode ~45 W, and later a 5700X3D or 5950X on the same board.
- Flash BIOS button, so the BIOS can be updated from a USB stick with no CPU installed. Needed: a 2019
  board does not boot a 5600X until that update.
- Downsides: the X570 chipset takes ~10 W the whole time the PC is on and its small fan is always spinning.
  The AIO adds 5–8 W. An air cooler on the 9700K adds 0 W when idle.

## Bundle #3 — AMD AM5, 500 EUR

| Part   | Model                                          | Year |
| ------ | ---------------------------------------------- | ---- |
| MB     | ASUS Prime B650-Plus, socket AM5, B650, ATX    | 2022 |
| CPU    | AMD Ryzen 5 7600X, 6 cores / 12 threads, 105 W | 2022 |
| RAM    | 32 GB DDR5                                     | ?    |
| Cooler | DeepCool Gammaxx AG400 V5 ARGB, tower air      | ?    |

- AM5 board. PCIe 4.0 x16 from the CPU plus a second x16 slot at 4.0 **x4** from the chipset, so a second
  card gets the same ~7.9 GB/s as on the other two bundles.
- **DDR5 at ~96 GB/s**, about double DDR4. This is the tier llama.cpp and MoE engines use when weights leave
  the GPU, so it is the one real speed gain between the three bundles.
- First M.2 is PCIe 5.0 x4. No disk is mentioned in the listing.
- The 7600X is a **105 W part** (142 W PPT), not a 65 W one: ~90-110 W all-core. ECO mode or PPT 88 W in the
  BIOS turns it into a 65 W-class CPU with no measurable loss for coding.
- Tower air cooler: no pump, fan near zero at idle. Lower idle draw than the AIO in bundle #2.
- AM5 is the only live socket here. Zen 5 drops in later.
- The 7600X sits at 95 °C by design. The AG400 is enough, but it is audible during long compiles.

## Bundle #4 - MSI MPG X570 - 220 EUR 🔥

[https://www.subito.it/informatica/msi-mpg-x570-gaming-plus-amd-ryzen-7-5800x-ram-32g-sondrio-646976442.htm]

MSI MPG X570 Gaming Plus AMD Ryzen 7 5800X RAM 32G

MB: MSI MPG X570 Gaming Plus
CPU: AMD Ryzen 7 5800X 8-Core 3801 MHz
RAM: G.Skill Ripjaws DDR4 32GB 3600 CL16  (2x 8GB) ❌
Dissipatore be quiet! Dark Rock 4

Need to buy another 16GB or 32 GB DDR4 (is it good to mix 8GB and 16GB modules in pair?)

## Bundle #5 - ASUS ROG X570-E - 320 EUR 🔥🥇

[https://www.subito.it/informatica/ryzen-9-3950x-asus-rog-x570-e-32gb-g-skill-ddr4-matera-646873428.htm]

Ryzen 9 3950X ASUS ROG X570-E 32GB G.Skill DDR4

MB: ASUS ROG Strix X570-E Gaming (con Wi-Fi e Bluetooth integrati).
CPU: AMD Ryzen 9 3950X (16 core / 32 thread)
RAM: 32 GB G.Skill Trident Z Neo RGB (kit 2×16 GB, DDR4-3600, CL16).


## Comparison

|                             | Bundle #1 (9700K)  | Bundle #2 (5600X)     | Bundle #3 (7600X)     |
| --------------------------- | ------------------ | --------------------- | --------------------- |
| Price                       | 360 EUR            | 350 EUR               | 500 EUR               |
| Cost with the missing parts | ~400 EUR (+cooler) | ~410 EUR (+1 TB disk) | ~560 EUR (+1 TB disk) |
| Motherboard year            | 2018               | 2019                  | 2022                  |
| CPU all-core draw           | ~120-140 W         | ~75-90 W (45 W ECO)   | ~90-110 W (88 W ECO)  |
| Energy for the same job     | higher             | lower                 | lowest                |
| Chipset draw, always on     | ~4 W, passive      | ~10 W, small fan      | ~5-7 W, passive       |
| Cooler                      | none, ~40 EUR      | 120 mm AIO, 5-8 W     | AG400 air, ~0 W idle  |
| Usable x16 slots            | 2, both from CPU   | 1 + 1 from chipset    | 1 + 1 from chipset    |
| Slot speed for card #2      | 3.0 x8 (~7.9 GB/s) | 4.0 x4 (~7.9 GB/s)    | 4.0 x4 (~7.9 GB/s)    |
| Card #1 speed               | 3.0 x16 (x8 used)  | 4.0 x16 (x8 used)     | 4.0 x16 (x8 used)     |
| NVMe                        | 500 GB included    | none, ~60 EUR         | none mentioned        |
| RAM bandwidth if offload    | ~51 GB/s at 3200   | ~51 GB/s at 3200      | ~96 GB/s at 6000      |
| Future CPU upgrade          | none               | 5700X3D / 5950X       | Zen 5 / Zen 6         |
| CPU Mark (not a reason)     | ~14,400            | ~21,800               | ~28,500               |

## Recommendation

**Bundle #2 (X570 + 5600X)** is the lower-energy choice: 65 W part, ECO mode, work finishes sooner, and a
cooler is in the box. The X570 chipset costs ~6 W more than Z390 while idle, but that is a few watts against
a CPU that stays at 75–90 W during any long job.

Take **bundle #1** only if you plan two GPUs on a direct CPU link and want the included NVMe. It costs more
energy per task, needs a cooler, and cannot be upgraded later.

**Bundle #3** costs 150 EUR more than the others, and once the missing disk is added it is roughly 150-160
more than either. What that buys: double the RAM bandwidth (96 vs 51 GB/s), a PCIe 5.0 M.2 slot, an air
cooler instead of an AIO pump, and a socket that still takes new CPUs. It does not buy lower power: the 7600X
is a 105 W part, so set ECO mode in the BIOS if watts come first.

So: **bundle #2** if this is a stopgap and 350 EUR is the point. **Bundle #3** if you will keep the machine for
years and want the RAM bandwidth for MoE weights that spill out of VRAM. Bundle #1 only for two cards on CPU
lanes.

Either way, keep the 500 W Platinum PSU if it is healthy. A right-sized unit runs near its sweet spot on this
build; a 750 W unit at 60 W load runs a few percent less efficiently.

Cheapest for power: fix the slot with the BIOS and change nothing. See the last section.

## Other boards sold with a 32 GB RAM bundle

Same criteria: idle power, then room for a second card. All are board + RAM only, so the CPU is extra
(except the X570 bundle above, which includes the CPU and a cooler).

| Board                        | Year | Socket  | RAM and bandwidth   | GPU slots                                     | M.2 slots       | Second GPU    |
| ---------------------------- | ---- | ------- | ------------------- | --------------------------------------------- | --------------- | ------------- |
| MSI MPG X570 Gaming Plus     | 2019 | AM4     | DDR4-3200, ~51 GB/s | x16 4.0 from CPU + x16 at x4 4.0 from chipset | 4.0 x4 + 3.0 x4 | yes, 7.9 GB/s |
| ASUS Prime B650-Plus WiFi II | 2022 | AM5     | DDR5-6000, ~96 GB/s | x16 4.0 from CPU + x16 at x4 from chipset     | 5.0 x4 + 4.0 x4 | yes, 7.9 GB/s |
| ASUS Prime B660M-A D4 WiFi   | 2022 | LGA1700 | DDR4-3200, ~51 GB/s | x16 4.0 from CPU + x16 at x4 3.0 from chipset | 4.0 x4 + 4.0 x4 | yes, 3.9 GB/s |
| Gigabyte B760 DS3H GEN5      | 2023 | LGA1700 | DDR5-6000, ~96 GB/s | x16 5.0 from CPU + 4 slots at x1              | 4.0 x4 + 4.0 x4 | no            |

Year is the chipset year. Suffixes in the name (WiFi II, GEN5) mean a later revision of the same board,
not a newer platform. The year that matters is the socket:
- **AM5 (2022):** the only live socket here. Takes Zen 4 today and Zen 5 as a drop-in, new CPUs still come out.
- **AM4 (2017-2022):** dead, but a 5700X3D or 5950X is cheap and still a big step up from a 5600X.
- **LGA1700 (2021-2023):** dead. The 14th gen is the last generation it will ever take.

**ASUS Prime B650-Plus WiFi II** — best platform of the list. DDR5-6000 doubles the RAM bandwidth, which is
the tier llama.cpp offload and MoE engines actually use. PCIe 5.0 on the first M.2, second x16 slot at
4.0 x4, passive chipset (no fan). AM5 still gets new CPUs. Needs an AM5 CPU (7500F / 7600, ~120-150 EUR).

**ASUS Prime B660M-A D4 WiFi** — the DDR4 Intel option, and a real one: unlike the B760 below it has a
second x16-length slot, at PCIe 3.0 x4 (~3.9 GB/s). That is fine for inference and half the load speed of
the 4.0 boards. Two 4.0 M.2 slots, passive chipset, low idle. Costs: mATX, so two GPUs need a 4-slot case
and the airflow between them is tight; LGA1700 is a dead socket; DDR4 gives 51 GB/s.

**Gigabyte B760 DS3H GEN5** — skip it if two GPUs are the plan. One x16 slot; the other four x16-length
slots are wired **x1**. "GEN5" is only the graphics slot, both M.2 are PCIe 4.0. Dead socket as well.

Chipset power, always on: X570 ~10 W with a small fan, B650 ~5-7 W passive, B660 / B760 ~4-6 W passive.
That is a few watts against a CPU at 75-140 W under load, but it is the part that runs all day.

Board ranking for this build:
1. **B650-Plus WiFi II** if the bundle is cheap enough that RAM + board + CPU lands near 350 EUR.
2. **X570 Gaming Plus** at 350 EUR complete: cheapest known-good, second card at 4.0 x4, 5700X3D later.
3. **B660M-A D4 WiFi**: workable, DDR4 and a slower second slot, mATX space is the catch.
4. **B760 DS3H GEN5**: only if you give up the second GPU.

Ask both sellers: is the 32 GB **2 x 16 GB or 1 x 32 GB**? One stick halves the RAM bandwidth, which is
the whole reason to pick DDR5. And on AM5, four sticks of DDR5 rarely reach 6000.

## Adding a second GPU: RTX 3060 12 GB

This is where "low power" and "bigger models" collide. A second card adds ~110 W (undervolted) during
inference and ~6 W at idle, plus ~330 W of peak headroom and a bigger PSU.

| Part                  | VRAM  | Bandwidth | Power | Year |
| --------------------- | ----- | --------- | ----- | ---- |
| RTX 4060 Ti (current) | 16 GB | 288 GB/s  | 160 W | 2023 |
| RTX 3060 12 GB (used) | 12 GB | 360 GB/s  | 170 W | 2021 |
| Total                 | 28 GB | 648 GB/s  | 330 W |      |

Worth it only if you want a **32B coding model at Q4** (~20 GB) with a real context window, or a 14B model
with a very long context. 16 GB does not hold those.

What it needs:
- **Two x16 slots.** Both bundles can do it. Z390: both cards at 3.0 x8. X570 Gaming Plus: card 1 at 4.0 x16,
  card 2 at 4.0 x4 through the chipset. Same bandwidth (~7.9 GB/s) to the second card.
- **Power:** 330 W peak for the two cards plus the rest. Plan a 650–750 W PSU.
- **Space and airflow:** two 2-slot cards, undervolt the 3060 too (~110 W).
- **Driver:** a 40-series and a 30-series card work together on one driver.

What to expect in llama.cpp:
- `--split-mode layer` is the default and shares the layers between the cards.
- Unequal cards: set the ratio by hand, for example `-ts 0.6,0.4`, so the 16 GB card takes more layers.
  `--main-gpu` decides which card keeps the KV cache.
- A 32B Q4 split over two slow cards runs at roughly reading speed (~8–12 tok/s). Fine for coding,
  not for a fast chat. A 14B on the 4060 Ti alone is faster per token and uses less power.

Not an option for a low-power build: a used RTX 3090 (24 GB, 936 GB/s) is ~600 EUR and 350 W. Best tok/s per
euro, worst watts. Skip it if power is the first criterion.

## Low-power tips for llama.cpp

- Keep the 4060 Ti undervolted, and also cap it: `nvidia-smi -pl 100` costs a few percent of speed and
  saves 20–30 W under load.
- Always offload all layers (`-ngl 99`), so the CPU stays idle instead of helping.
- 5600X: set ECO mode (45 W) in the BIOS. For coding and inference the difference is not measurable.
- Z390 (if you go Intel): set PL1/PL2 to 65 W. You lose the all-core turbo you do not need.
- Enable C-states and "ErP" in the BIOS so idle really is idle. One wall plug meter (~15 EUR) shows the truth.
- Shut the machine down when you stop working. 50 W of idle for 10 hours is 0.5 kWh every day.

## Cheapest path: keep the 3770S

If the BIOS fix works and one GPU is enough, you can stay as you are. That is also the lowest-power option:
65 W CPU, passive chipset, no AIO pump, an existing Platinum PSU.

What you give up:
- no NVMe (SATA SSD only, ~550 MB/s),
- DDR3-1600 at 25.6 GB/s if you ever offload to CPU,
- the second card can only go in the black slot at PCIe 2.0 x4 (~2 GB/s).

That is acceptable for one card and 14B models. It stops being acceptable the day you want a 32B model.

## PSU

500 W is plenty for the 3770S (65 W) plus the 4060 Ti (160 W), and right-sized means efficient.
A second GPU needs 650–750 W. The current Cooler Master is old; if you keep it, it is fine for the one-card
build, but replace it when you add a card — capacitors age and it is the one part that can take the rest with it.

## Ask the seller (all bundles)

- Does the board already run this CPU today, and which BIOS version? The X570 needs a Flash BIOS update
  before the first 5600X boot.
- RAM kit: 2 x 16 GB or 4 x 8 GB, what speed, and does XMP work? 2 x 16 GB at 3200 is what you want;
  four sticks often fall back below 3200.
- Was the CPU ever overclocked? Any bent socket pins?
- Is there a return option? Photos of the socket, the RAM stickers, and a boot screen.