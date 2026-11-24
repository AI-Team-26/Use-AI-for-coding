# PC upgrade

Notes for replacing the 2012 platform. Two used bundles are on eBay for nearly the same price.

## Current PC

| Part  | Model                                       | Year |
| ----- | ------------------------------------------- | ---- |
| MB    | ASUS P8Z77-V LX, socket LGA1155, Z77        | 2012 |
| CPU   | Intel i7-3770S, 4 cores / 8 threads, 65 W   | 2012 |
| RAM   | 32 GB DDR3-1600, 4 x 8 GB Corsair Vengeance | ?    |
| Disks | SATA only, this board has no M.2 slot       | ?    |
| GPU   | RTX 4060 Ti 16 GB, undervolted              | 2023 |
| PSU   | Cooler Master 500 W, 80+ Platinum           | ?    |

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

| Part | Model                                           | Year |
| ---- | ----------------------------------------------- | ---- |
| MB   | Gigabyte Z390 AORUS ULTRA, socket LGA1151, Z390 | 2018 |
| CPU  | Intel i7-9700K, 8 cores / 8 threads, 95 W       | 2018 |
| RAM  | 32 GB DDR4, speed not stated                    | ?    |
| Disk | AORUS NVMe 500 GB                               | ?    |

- CPU Mark ≈ 14,400. About +130% over the 3770S.
- Three x16 slots, PCIe 3.0 from the CPU. Two cards run at x8/x8.
- Three M.2 slots, all PCIe 3.0 x4. NVMe disk is included.
- No CPU cooler in the bundle, and the 9700K runs hot. Budget ~40 EUR for an air cooler.
- End of the line: 9th gen is the newest CPU this board takes (i9-9900K). No cheaper future upgrade.

## Bundle #2 — AMD, 350 EUR

| Part   | Model                                      | Year |
| ------ | ------------------------------------------ | ---- |
| MB     | MSI MPG X570 Gaming Plus, socket AM4, X570 | 2019 |
| CPU    | Ryzen 5 5600X, 6 cores / 12 threads, 65 W  | 2020 |
| RAM    | 32 GB DDR4 G-Skill, speed not stated       | ?    |
| Cooler | NZXT 120 mm liquid cooler                  | ?    |

- CPU Mark ≈ 21,800. About +250% over the 3770S, and ~50% over the 9700K.
- PCIe 4.0 from the CPU: the 4060 Ti runs at 4.0 x8, its full speed.
- 12 threads instead of 8. That matters for llama.cpp CPU work and for everything that is not on the GPU.
- Upgrade path: this socket also takes a 5700X3D / 5800X3D or a 5950X later, for much less than a new platform.
- No disk in the bundle. A 1 TB NVMe is ~60 EUR.
- Board: one PCIe 4.0 x16 slot from the CPU (blue) and one x16-length slot at PCIe 4.0 **x4** from the chipset.
  No x8/x8. Two M.2 slots: the main one is PCIe 4.0 x4, the second is PCIe 3.0 x4.
- Board: has a Flash BIOS button, so the BIOS can be updated from a USB stick without a CPU installed.
  Useful, because a 2019 board does not boot a 5600X until that update is done.
- VRM 10 phases (8+2): plenty for a 65 W 5600X, and enough for a 5950X later.

## Comparison

|                      | Bundle #1 (9700K) | Bundle #2 (5600X) |
| -------------------- | ----------------- | ----------------- |
| Price                | 360 EUR           | 350 EUR           |
| Motherboard year     | 2018              | 2019              |
| Cores / threads      | 8 / 8             | 6 / 12            |
| CPU Mark             | ~14,400           | ~21,800           |
| PCIe for the 4060 Ti | 3.0 x16 (full)    | 4.0 x16 (full)    |
| Two GPUs             | x8/x8 (built in)  | 4.0 x4, no x8/x8  |
| NVMe disk included   | yes, 500 GB       | no                |
| CPU cooler included  | no                | yes, 120 mm AIO   |
| Future CPU upgrade   | none              | 5700X3D / 5950X   |

## Recommendation

Take bundle #2 (X570 + 5600X) if the goal is one GPU and a fast machine: more threads, PCIe 4.0, a real
upgrade path, and a cooler is included. Add a 1 TB NVMe.

Take bundle #1 (Z390 + 9700K) if you want true x8/x8 for two cards, three M.2 slots, and the 500 GB NVMe
inside the price. On the X570 Gaming Plus the second card runs at PCIe 4.0 x4 from the chipset instead of x8.

## Adding a second GPU: RTX 3060 12 GB

This is the cheapest way to get more VRAM. A used RTX 3060 12 GB costs about 150–180 EUR and adds 12 GB
next to the current card:

| Part                  | VRAM  | Power | Year |
| --------------------- | ----- | ----- | ---- |
| RTX 4060 Ti (current) | 16 GB | 160 W | 2023 |
| RTX 3060 12 GB (used) | 12 GB | 170 W | 2021 |
| Total                 | 28 GB | 330 W |      |

28 GB fits models that one card cannot hold, for example a 30B model at Q4 with a normal context, or a
smaller model with a very long context.

What it needs:
- **Two x16 slots.** Z390 AORUS ULTRA runs them at PCIe 3.0 x8/x8 (~7.9 GB/s each). MSI X570 Gaming Plus
  runs card 1 at 4.0 x16 (x8 used) and card 2 at 4.0 x4 (~7.9 GB/s, through the chipset).
  Same bandwidth for the second card on both boards, so the second GPU does not decide the bundle.
  The chipset slot shares its uplink with USB, SATA and the second M.2, which costs a little more latency.
- **Power:** 330 W for the two cards plus ~95 W CPU and the rest. Plan a 750 W PSU, not the current 500 W.
- **Space:** two 2-slot cards, so a case with room for 2.5 slots or more, and enough airflow between them.
  Undervolt the 3060 too: it drops from 170 W to about 110 W.
- **Driver:** a 40-series and a 30-series card work together on one driver, no problem.

What to expect in llama.cpp:
- Multi-GPU is built in: `--split-mode layer` is the default, and the model layers are shared between the cards.
- Unequal cards: set the ratio by hand, for example `-ts 0.6,0.4`, so the 16 GB card takes more layers.
  `--main-gpu` decides which card keeps the KV cache.
- Speed: each token passes through both cards, so it is slower per token than one big card of the same total
  VRAM. Fine for one user; not good for many parallel requests.
- Two cards make sense for running bigger models, not for training. LoRA fine-tuning is easier on a single card.

If two GPUs are the plan, both bundles work: the second card gets about 8 GB/s either way. The Z390 keeps
the card on a direct CPU link at x8; the X570 runs it at x4 through the chipset, which is fine for inference
and worse for moving large amounts of data between the cards.

## PSU

500 W is enough for one RTX 4060 Ti (160 W) plus either CPU. With a second GPU, plan a 750–850 W unit.
If the current Cooler Master is from 2012, replace it with the upgrade: capacitors age, and it is the one
part that can kill everything else.

## Ask the seller (both bundles)

- Does the X570 Gaming Plus already run the 5600X today (which BIOS version)? Otherwise it needs the
  Flash BIOS update before the first boot.
- RAM kit model and speed, and whether it runs with XMP on (3200 MHz or faster is what you want).
- Was the CPU ever overclocked or delaminated? Any bent socket pins?
- Is there a return option? Photos of the socket, the RAM stickers, and a boot screen.