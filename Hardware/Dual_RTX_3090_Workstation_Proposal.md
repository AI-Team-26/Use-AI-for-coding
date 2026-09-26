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

## Option 2: Prosumer Build (Best Price/Performance)
*Best for: Local LLM inference, hobbyist research, and budget-conscious setups.*

| Component | Recommendation | Estimated Cost (USD) |
| :--- | :--- | :--- |
| **CPU** | AMD Ryzen 9 (e.g., 7950X) or Intel Core i9 (e.g., 14900K) | $500 - $700 |
| **Motherboard** | High-end X670E (AMD) or Z790 (Intel) with proper slot spacing | $300 - $500 |
| **RAM** | 128GB DDR5 | $400 - $600 |
| **GPU** | 2x NVIDIA RTX 3090 (Used) | $1,600 - $1,800 |
| **PSU** | 1200W - 1500W Gold/Platinum | $200 - $350 |
| **Case** | Large ATX/Full Tower (e.g., Lian Li Lancool III) | $150 - $250 |
| **Cooling** | High-end AIO + Case Fans | $150 - $250 |
| **Total Est.** | | **$3,300 - $4,450** |

### AM5 Motherboard Comparison (Optimized for Dual GPU)

Use this table to quickly find model names for eBay searches. Focus on boards that support **x8/x8** bifurcation to ensure both GPUs have adequate bandwidth.

| Model Name | PCIe Configuration (Primary Slots) | Best Use Case | Price Tier |
| :--- | :--- | :--- | :--- |
| **ASRock X670E Taichi** | **x16 / x8 / x8** | Best Value / Balanced | ~405€ (Used/Open Box) |
| **ASUS ProArt X670E-Creator WiFi** | **x16 / x8 / x8** | Professional Multi-GPU Workflows | High (~600€ New) |
| **MSI MEG X670E ACE** | **x16 / x8 / x4** | High-end Enthusiast / Stability | High (~650€ New) |
| **ASUS ROG Strix X670E-E Gaming** | **x16 / x8 / x4** | Premium Gaming / Single GPU focus | Mid-High |

> [!IMPORTANT]
> **Note on the AM4 (DDR4) Path:**
> If the AM5 components above are too expensive, you can significantly reduce costs by switching to the **AMD AM4 platform**. This allows you to use much cheaper **DDR4 RAM** and older (but still very capable) CPUs like the **Ryzen 9 5900X**. While you lose some future-proofing and raw PCIe Gen 5 speed, it is the most cost-effective way to build a dual-3090 workstation.

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
