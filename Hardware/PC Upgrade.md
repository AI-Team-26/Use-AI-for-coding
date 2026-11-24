# PC upgrade

Notes for replacing the 2012 platform. Two used bundles are on eBay for nearly the same price.

## Current PC

| Part    | Model                                                     |
| ------- | --------------------------------------------------------- |
| MB      | ASUS P8Z77-V LX (2012, socket LGA1155, Z77)               |
| CPU     | Intel i7-3770S — 4 cores / 8 threads, 65 W                |
| RAM     | 32 GB DDR3-1600 (4 x 8 GB Corsair Vengeance)              |
| Disks   | SATA only (this board has no M.2 slot)                    |
| GPU     | RTX 4060 Ti 16 GB, undervolted                            |
| PSU     | Cooler Master 500 W, 80+ Platinum                         |

PassMark CPU Mark: i7-3770S ≈ 6,200. Single thread ≈ 2,040.

The board has two "x16" slots, but only the blue one is wired to the CPU:
- blue slot: PCIe 3.0 x16
- black slot: PCIe 2.0 **x4** (from the Z77 chipset)

The RTX 4060 Ti only has 8 PCIe lanes, so in the black slot it runs at PCIe 2.0 x4 ≈ 2 GB/s instead of
PCIe 4.0 x8 ≈ 16 GB/s. Model load times and anything that moves data to and from the card get much slower.

## The slot problem is the real bottleneck

Before buying anything, try to make the card work in the blue slot. It costs nothing:
- Update the BIOS to the last version ASUS shipped for this board.
- In the BIOS: disable CSM (pure UEFI boot), enable "Above 4G Decoding", set the slot speed to "Gen 3" instead of "Auto".
- Reseat the card, try a different 8-pin cable, test the card in another PC if possible.

If the blue slot is dead, the two bundles below are the fix: both give a working PCIe x16 slot from the CPU.

## Bundle #1 — Intel, 360 EUR

| Part  | Model                                                    |
| ----- | -------------------------------------------------------- |
| MB    | Gigabyte Z390 AORUS ULTRA (2018, LGA1151, Z390)          |
| CPU   | Intel i7-9700K — 8 cores / 8 threads, 95 W               |
| RAM   | 32 GB DDR4 (speed not stated)                            |
| Disk  | AORUS NVMe 500 GB                                        |

- CPU Mark ≈ 14,400. About +130% over the 3770S.
- Three x16 slots, PCIe 3.0 from the CPU. Two cards run at x8/x8.
- Three M.2 slots, all PCIe 3.0 x4. NVMe disk is included.
- No CPU cooler in the bundle, and the 9700K runs hot. Budget ~40 EUR for an air cooler.
- End of the line: 9th gen is the newest CPU this board takes (i9-9900K). No cheaper future upgrade.

## Bundle #2 — AMD, 350 EUR

| Part   | Model                                            |
| ------ | ------------------------------------------------ |
| MB     | MSI X570 (exact model not stated)                |
| CPU    | Ryzen 5 5600X — 6 cores / 12 threads, 65 W       |
| RAM    | 32 GB DDR4 G-Skill (speed not stated)            |
| Cooler | NZXT 120 mm liquid cooler                        |

- CPU Mark ≈ 21,800. About +250% over the 3770S, and ~50% over the 9700K.
- PCIe 4.0 from the CPU: the 4060 Ti runs at 4.0 x8, its full speed.
- 12 threads instead of 8. That matters for llama.cpp CPU work and for everything that is not on the GPU.
- Upgrade path: this socket also takes a 5700X3D / 5800X3D or a 5950X later, for much less than a new platform.
- No disk in the bundle. A 1 TB NVMe is ~60 EUR.
- Ask the seller for the exact board model: it decides the slot layout and whether two cards can run at x8/x8.

## Comparison

|                       | Bundle #1 (9700K) | Bundle #2 (5600X) |
| --------------------- | ----------------- | ----------------- |
| Price                 | 360 EUR           | 350 EUR           |
| Cores / threads       | 8 / 8             | 6 / 12            |
| CPU Mark              | ~14,400           | ~21,800           |
| PCIe for the 4060 Ti  | 3.0 x16 (full)    | 4.0 x16 (full)    |
| Two GPUs              | x8/x8 (built in)  | depends on board  |
| NVMe disk included    | yes, 500 GB       | no                |
| CPU cooler included   | no                | yes, 120 mm AIO   |
| Future CPU upgrade    | none              | 5700X3D / 5950X   |
| Platform year         | 2018              | 2020              |

## Recommendation

Take bundle #2 (X570 + 5600X) if the goal is one GPU and a fast machine: more threads, PCIe 4.0, a real
upgrade path, and a cooler is included. Add a 1 TB NVMe.

Take bundle #1 (Z390 + 9700K) if two GPUs are planned. The x8/x8 split is built into the board, while on
X570 it depends on the model. The included 500 GB NVMe also closes part of the price gap.

## PSU

500 W is enough for one RTX 4060 Ti (160 W) plus either CPU. It is not enough for two GPUs: plan a
750–850 W unit then. If the current Cooler Master is from 2012, replace it with the upgrade: capacitors
age, and it is the one part that can kill everything else.

## Ask the seller (both bundles)

- Exact motherboard model and BIOS version (X570 must be new enough for a 5600X).
- RAM speed and whether it runs with XMP on (3200 MHz or faster is what you want).
- Was the CPU ever overclocked or delaminated? Any bent socket pins?
- Is there a return option? Photos of the socket, the RAM stickers, and a boot screen.