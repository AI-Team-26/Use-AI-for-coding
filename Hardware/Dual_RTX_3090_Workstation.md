# Dual RTX 3090 Workstation Hardware Proposal

This document outlines hardware recommendations for building a high-performance workstation optimized for LLM inference and training using two NVIDIA RTX 3090 GPUs (totaling 48GB VRAM).

Look at the video here to compare the components: https://www.youtube.com/watch?v=cN6aRa9GRfE
MB: ASUS X99-E WS

## Core Requirements

- **VRAM:** 48GB (2x 24GB RTX 3090)
- **PCIe Lanes:** Sufficient lanes for at least x8/x8 or x16/x16 configuration to avoid bandwidth bottlenecks during inference.
- **Physical Spacing:** Motherboard must support at least 3 slots of spacing between PCIe slots to accommodate thick (2.5 - 3 slot) GPUs.
- **Power:** High wattage to handle dual 350W+ GPUs and transient spikes.
- **Thermal Management:** Excellent airflow to prevent thermal throttling.

---

## Option 1: Professional Workstation (High Stability & Expansion)

_Best for: Professional development, heavy training, and maximum reliability._

| Component       | Recommendation                                                  | Estimated Cost (USD) |
| :-------------- | :-------------------------------------------------------------- | :------------------- |
| **CPU**         | AMD Ryzen™ Threadripper™ Pro (e.g., 7955WX or higher)           | $2,500 - $5,000      |
| **Motherboard** | ASUS Pro WS WRX80E-SAGE SE WIFI or ASUS Pro WS TRX50-SAGE WIFI  | $600 - $1,000        |
| **RAM**         | 256GB DDR5 ECC Registered                                       | $1,000 - $1,500      |
| **GPU**         | 2x NVIDIA RTX 3090 (Used)                                       | $1,600 - $1,800      |
| **PSU**         | 1600W Platinum (e.g., Corsair AX1600i or Seasonic Prime)        | $300 - $450          |
| **Case**        | Full Tower (e.g., Fractal Design Meshify 2 XL or Corsair 7000D) | $200 - $300          |
| **Cooling**     | High-end AIO + Case Fans                                        | $200 - $300          |
| **Total Est.**  |                                                                 | **$6,400 - $10,350** |

---

## Option 2: Prosumer Build (Optimized for Dual-GPU & AI)

_Best for: Local LLM inference, hobbyist research, and high-value workstation setups._

| Component       | Recommendation                                     | Estimated Cost (EUR) | Notes                                  |
| :-------------- | :------------------------------------------------- | :------------------- | :------------------------------------- |
| **CPU**         | AMD Ryzen 9 7950X or 9950X                         | 220 - 370            | High core count for multi-agent tasks. |
| **Motherboard** | High-end X670E (e.g., ASRock Taichi / ASUS ProArt) | 300 - 500            | Must support x8/x8 bifurcation.        |
| **RAM**         | 64GB DDR5                                          | 180 - 250            | _Estimated placeholder._               |
| **GPU**         | 2x NVIDIA RTX 3090 (Used)                          | 700 - 1,000          | Target: ~350-500 per card.             |
| **PSU**         | 1300W+ ATX 3.0/3.1 compliant                       | 200 - 400            | MSI MEG Ai1300P or Seasonic Prime.     |
| **Case**        | Fractal Design North XL or Lian Li Lancool III     | 200 - 270            | Large volume & high airflow.           |
| **Cooling**     | Arctic Liquid Freezer III 360                      | 110 - 150            | Top-mounted AIO.                       |
| **Total Est.**  |                                                    | **1,910 - 2,940**    |                                        |

### AM5 Motherboard

Optimized for Dual GPU.  
Focus on boards that support **x8/x8** bifurcation to ensure both GPUs have adequate bandwidth.

- **PCIe Lanes:** x8/x8 is sufficient for most local LLM inference.  
  x16/x16 is preferable for tensor-parallel inference, frequent model loading, long-prompt prefill, batched serving, and training.

| Model Name                     | PCIe slots    | Best Use Case          | Price                         |
| ------------------------------ | ------------- | ---------------------- | ----------------------------- |
| ASRock X670E Taichi 🔥         | x16 / x8 / x8 | Best Value / Balanced  | 410 Subito.it 390 esseshop.it |
| ASUS ProArt X670E-Creator WiFi | x16 / x8 / x8 | Professional Multi-GPU |                               |
| MSI MEG X670E ACE              | x16 / x8 / x4 | High-end / Stability   |                               |
| ASRock X870E Taichi Lite       | x16 / x8 / x8 |                        | 395 Amazon.it  380 Pixmart.it | 

Asrock X670E TAICHI AMD X670 on esseshop.it: https://www.esseshop.it/asrock-x670e-taichi-amd-x670-presa-di-corrente-am5-atx-esteso-confezione-aperta-p-316833.html?utm_source=Bing&utm_medium=Bing&utm_campaign=products&msclkid=874848960d891cff07f6224515d10199

#### ASUS ROG Strix TRX40-XE Gaming

340 EUR on ebay

- Socket: AMD sTRX4
- CPU: 3rd-gen Ryzen Threadripper only (3960X / 3970X / 3990X)
- Memory: Quad-channel DDR4, 8 DIMM slots, up to 256 GB
- GPU slots: 3 × PCIe 4.0 x16, supporting x16/x16/x16
- Best for: Symmetric dual-GPU PCIe bandwidth at low used-board cost
- Tradeoff: Requires a separate Threadripper platform; not compatible with AM5 CPUs or DDR5

---

## CPU

|     | Model               | TDP    | Note                                      | Price                  |
| --- | ------------------- | ------ | ----------------------------------------- | ---------------------- |
|     | AMD Ryzen 9 7900X   | 170 ➖ | 12 Cores / 24 Threads (Zen 4)             |  302 Primart.it        |
| 🔸  | AMD Ryzen 9 7900X3D | 120 ✔️ | 12 Cores / 24 Threads (Zen 4, 3D V-Cache) |                        |
|     | AMD Ryzen 9 7950X   | 170 ➖ | 16 Cores / 32 Threads (Zen 4)             |                        |
| 🔸  | AMD Ryzen 9 9900X   | 120 ✔️ | 16 Cores / 32 Threads (Zen 5)             |                        |
|     | AMD Ryzen 9 9950X   | 170 ➖ | 16 Cores / 32 Threads (Zen 5)             | 410 EUR AliExpress     |

Best Efficiency: The Ryzen 9 9900X (or 7900X3D) have 120W TDP.  
Zen 5 (9000 series): The 9900X offers ~15% better single-core CPU IPC over the 7000 series at the same 120W TDP, making it a strong alternative to the 7900X3D if prices are close.  
Difference vs 7900X3D: The standard 7900X runs at a higher 170W TDP out of the box (faster clock speeds in standard multi-threaded tasks, but uses more power and lacks the extra 3D V-Cache).  
Eco Mode: You can easily enable 65W or 105W Eco Mode in the BIOS for the 7900X to match or beat the power efficiency of the X3D chips while keeping almost all of its performance.

---

## Power Supply (PSU) - Recommended Models

_Prioritize ATX 3.0/3.1 compliance to handle transient spikes from RTX 3090/4090._

| Model                                 | Tier / Efficiency  | Notes                                            |
| ------------------------------------- | :----------------- | :----------------------------------------------- |
| **Corsair AX1600i**                   | Titanium (Extreme) | The absolute gold standard, but very expensive.  |
| **Seasonic PRIME TX-1300**            | Titanium           | Extremely stable, high-end professional choice.  |
| **Corsair RM1200x Shift**             | Gold (ATX 3.0)     | Great cable management (side connectors).        |
| **MSI MEG Ai1300P PCIE5**             | Platinum (ATX 3.0) | Native 12VHPWR support, excellent for 40-series. |
| **Be Quiet! Dark Power Pro 13 1300W** | Titanium (ATX 3.0) | Very quiet operation, high quality.              |
| **Thermaltake Toughpower GF3 1350W**  | Gold (ATX 3.0)     | Good value option for high wattage.              |

---

## RAM

### DDR5

| Brand          | Speed | CL | Model               | Size           | Price                                             |
|----------------|----------------------------------|--------------- |---------------------------------------------------|
| CUSU           | 6000  |    |                     |  32 GB (16 x2) | 375 AliExpress                                    |
| Kingstom Fury  | 6000  | 36 | KF560C36BBE2AK2-32  |  32 GB (16 x2) | 750 Amazon                                        | 
| Kingstom Fury  | 5600  | 36 | KF556C36BWEA-32     |  32 GB (32 x1) | 560 Pixmart                                       | 
| Crucial        | 6000  | 36 |                     |  32 GB (16 x2) | 720 AliExpress                                    |

---

## Budget Summary (Full Build Estimate)

| Component             |  Min |  Max | Notes                            |
| :-------------------- | ---: | ---: | :------------------------------- |
| Motherboard (MB)      |  300 |  500 | Prosumer X670E range.            |
| CPU                   |  220 |  370 | 7950X to 9950X.                  |
| Cooler (AIO)          |  110 |  150 | Arctic vs. Corsair.              |
| RAM (64GB DDR5)       |  250 |  550 |                                  |
| PSU (1300W+ ATX 3.0)  |  200 |  400 | MSI Used vs. Seasonic New.       |
| Case (Large/Dual GPU) |  200 |  270 | Fractal/Lian Li options.         |
| GPUs (RTX 3090 24GB)  |  800 | 1200 | Based on target prices.          |
| NVME 1TB              |  150 |  200 |                                  |
| Other (Fans/Misc)     |  100 |  200 | Extra fans, cables, adapters ... |
| TOTAL                 | 2330 | 3840 |                                  |

| Component             | Item                           | Platform  | Price | Link |
| :-------------------- | :----------------------------- | :-------- | ----: | :--- |
| Motherboard (MB)      | ASUS ProArt X670E-Creator WiFi | Ebay      |   430 |      |
| CPU                   | AMD Ryzen 9 7950X              | Ebay      |   230 |      |
| Cooler (AIO)          | Arctic Liquid Freezer III 360  | Ebay      |    80 |      |
| RAM (64GB DDR5)       | 64GB (2x32GB) DDR5-4800 CL40   | Ebay      |   600 |      |
| PSU (1300W+ ATX 3.0)  | Seasonic Prime PX1300          | Ebay      |   270 |      |
| Case (Large/Dual GPU) | Lian Li Lancool III            | Ebay      |   170 |      |
| GPUs (RTX 3090 24GB)  | RTX 3090 24GB                  | Subito.it |   700 |      |
| NVME 1TB              |                                |           |       |      |
| Other (Fans/Misc)     |                                |           |       |      |
| TOTAL                 |                                |           |  2480 |      |

## Deep Dive: The ASUS X99-E WS Path (High Bandwidth / Budget Optimized)

_Best for: Users looking to maximize PCIe bandwidth on a budget via the used market._

| Feature                  | Detail                         | Impact                                                                          |
| :----------------------- | :----------------------------- | :------------------------------------------------------------------------------ |
| **PCIe Configuration**   | Supports **x16 / x16**         | PCIex 3.0 x16 is like PCIex x8                                                  |
| **Critical Requirement** | Must use **2-slot width** GPUs | **Essential:** Ensures physical fit and prevents thermal choking between cards. |
| **Platform**             | Intel X99 (LGA 2011-v3)        | Uses DDR4; older but highly stable for workstation tasks.                       |

**Pros:**

- Massive PCIe bandwidth compared to many consumer boards.
- Significantly lower entry cost if sourcing used parts.
- Excellent for AI training where inter-GPU communication is frequent.

**Cons/Risks:**

- Requires finding specific "slim" (2-slot) RTX 3090 models.
- Older architecture (DDR4 vs modern DDR5).
- Requires careful planning of case airflow due to tight component density.

To ensure a successful build with dual RTX 3090s, pay close attention to these two factors:

### 1. Power Supply (Transient Spikes)

High-end GPUs can exhibit massive, millisecond-long power spikes (transients) that exceed their rated TDP.

- **Recommendation:** Prioritize power supplies that are **ATX 3.0 or ATX 3.1 compliant**. These standards are specifically designed to handle much higher transient excursions (up to 200% of the rated power) without triggering OCP (Over Current Protection).
- **Connectors:** Ensure the PSU has sufficient dedicated PCIe cables (do not use "pigtail" splitters for high-draw cards).

### 2. Physical Dimensions (Clearance)

Dual 3090s are physically massive.

- **GPU Length:** Ensure the case supports GPUs at least **330mm - 350mm** long.
- **GPU Width/Slot Thickness:** Most 3090s are 2.7 to 3 slots thick. Ensure the motherboard layout and case width allow for enough air gap between the two cards to prevent the top card from choking on the heat of the bottom card.
- **Vertical Clearance:** If using a front-mounted radiator (AIO), ensure there is still enough room for the GPU length.

---

## Second-Hand Hardware Advice

When sourcing components from secondary markets (like eBay), consider the following risks:

### Motherboards

- **Risk Level:** Low.
- **Considerations:** Motherboards do not suffer from computational stress. A board used for heavy LLM workloads is no more "worn out" than one used for gaming. Focus on physical integrity, pin condition (for CPU sockets), and ensuring the seller has good ratings for shipping reliability.

### GPUs

- **Risk Level:** High.
- **Considerations:** RTX 3090s are frequently used for mining or intensive LLM inference. These activities involve high heat and significant power transients which can degrade silicon over time. Always perform extensive stress tests (e.g., FurMark, 3DMark) and check VRAM stability before finalizing a purchase.
