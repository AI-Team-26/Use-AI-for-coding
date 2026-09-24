# Dual RTX 3090 Workstation Hardware Proposal

This document outlines hardware recommendations for building a high-performance workstation optimized for LLM inference and training using two NVIDIA RTX 3090 GPUs (totaling 48GB VRAM).

## Core Requirements

- **VRAM:** 48GB (2x 24GB RTX 3090)
- **PCIe Lanes:** Sufficient lanes for at least x8/x8 or x16/x16 configuration to avoid bandwidth bottlenecks during inference.
- **Physical Spacing:** Motherboard must support at least 3 slots of spacing between PCIe slots to accommodate thick (2.5 - 3 slot) GPUs.
- **Power:** High wattage to handle dual 350W+ GPUs and transient spikes.
- **Thermal Management:** Excellent airflow to prevent thermal throttling.

---

## Option 1: Professional Workstation (High Stability & Expansion)
*Best for: Professional development, heavy training, and maximum reliability.*

| Component | Recommendation | Estimated Cost (USD) |
| :--- | :--- | :--- |
| **CPU** | AMD Ryzen™ Threadripper™ Pro (e.g., 7955WX or higher) | $2,500 - $5,000 |
| **Motherboard** | ASUS Pro WS WRX80E-SAGE SE WIFI or ASUS Pro WS TRX50-SAGE WIFI | $600 - $1,000 |
| **RAM** | 256GB DDR5 ECC Registered | $1,000 - $1,500 |
| **GPU** | 2x NVIDIA RTX 3090 (Used) | $1,600 - $1,800 |
| **PSU** | 1600W Platinum (e.g., Corsair AX1600i or Seasonic Prime) | $300 - $450 |
| **Case** | Full Tower (e.g., Fractal Design Meshify 2 XL or Corsair 7000D) | $200 - $300 |
| **Cooling** | High-end AIO + Case Fans | $200 - $300 |
| **Total Est.** | | **$6,400 - $10,350** |

---

## Option 2: Prosumer Build (Optimized for Dual-GPU & AI)
*Best for: Local LLM inference, hobbyist research, and high-value workstation setups.*

| Component | Recommendation | Estimated Cost (EUR) | Notes |
| :--- | :--- | :--- | :--- |
| **CPU** | AMD Ryzen 9 7950X or 9950X | 220 - 370 | High core count for multi-agent tasks. |
| **Motherboard** | High-end X670E (e.g., ASRock Taichi / ASUS ProArt) | 300 - 500 | Must support x8/x8 bifurcation. |
| **RAM** | 64GB DDR5 | 180 - 250 | *Estimated placeholder.* |
| **GPU** | 2x NVIDIA RTX 3090 (Used) | 700 - 1,000 | Target: ~350-500 per card. |
| **PSU** | 1300W+ ATX 3.0/3.1 compliant | 200 - 400 | MSI MEG Ai1300P or Seasonic Prime. |
| **Case** | Fractal Design North XL or Lian Li Lancool III | 200 - 270 | Large volume & high airflow. |
| **Cooling** | Arctic Liquid Freezer III 360 | 110 - 150 | Top-mounted AIO. |
| **Total Est.** | | **1,910 - 2,940** | |

### AM5 Motherboard Comparison (Optimized for Dual GPU)

Use this table to quickly find model names for eBay searches. Focus on boards that support **x8/x8** bifurcation to ensure both GPUs have adequate bandwidth.

| Model Name | PCIe Configuration (Primary Slots) | Best Use Case | Price Tier |
| :--- | :--- | :--- | :--- |
| **ASRock X670E Taichi** | **x16 / x8 / x8** | Best Value / Balanced | ~405€ (Used/Open Box) |
| **ASUS ProArt X670E-Creator WiFi** | **x16 / x8 / x8** | Professional Multi-GPU Workflows | High (~600€ New / ~700€ eBay) |
| **MSI MEG X670E ACE** | **x16 / x8 / x4** | High-end Enthusiast / Stability | High (~650€ New) |
| **ASUS ROG Strix X670E-E Gaming** | **x16 / x8 / x4** | Premium Gaming / Single GPU focus | Mid-High |

---

## Power Supply (PSU) - Recommended Models
*Prioritize ATX 3.0/3.1 compliance to handle transient spikes from RTX 3090/4090.*

| Model | Tier / Efficiency | Notes |
| :--- | :--- | :--- |
| **Corsair AX1600i** | Titanium (Extreme) | The absolute gold standard, but very expensive. |
| **Seasonic PRIME TX-1300** | Titanium | Extremely stable, high-end professional choice. |
| **Corsair RM1200x Shift** | Gold (ATX 3.0) | Great cable management (side connectors). |
| **MSI MEG Ai1300P PCIE5** | Platinum (ATX 3.0) | Native 12VHPWR support, excellent for 40-series. |
| **Be Quiet! Dark Power Pro 13 1300W** | Titanium (ATX 3.0) | Very quiet operation, high quality. |
| **Thermaltake Toughpower GF3 1350W** | Gold (ATX 3.0) | Good value option for high wattage. |

---

## Budget Summary (Full Build Estimate)

| Component | Min (EUR) | Max (EUR) | Notes |
| :--- | :--- | :--- | :--- |
| Motherboard (MB) | 300 | 500 | Prosumer X670E range. |
| CPU | 220 | 370 | 7950X to 9950X. |
| Cooler (AIO) | 110 | 150 | Arctic vs. Corsair. |
| RAM (64GB DDR5) | 180 | 250 | *Estimated placeholder.* |
| PSU (1300W+ ATX 3.0) | 200 | 400 | MSI Used vs. Seasonic New. |
| Case (Large/Dual GPU) | 200 | 270 | Fractal/Lian Li options. |
| Other (Fans/Misc) | 100 | 200 | Extra fans & storage/OS. |
| GPUs (RTX 3090 24GB) | 700 | 1,000 | Based on target prices. |
| **GRAND TOTAL** | **2,010** | **3,140** | **Full Build Cost.** |

---

## Physical Clearance & Power Standards

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
*   **Risk Level:** Low.
*   **Considerations:** Motherboards do not suffer from computational stress. A board used for heavy LLM workloads is no more "worn out" than one used for gaming. Focus on physical integrity, pin condition (for CPU sockets), and ensuring the seller has good ratings for shipping reliability.

### GPUs
*   **Risk Level:** High.
*   **Considerations:** RTX 3090s are frequently used for mining or intensive LLM inference. These activities involve high heat and significant power transients which can degrade silicon over time. Always perform extensive stress tests (e.g., FurMark, 3DMark) and check VRAM stability before finalizing a purchase.
