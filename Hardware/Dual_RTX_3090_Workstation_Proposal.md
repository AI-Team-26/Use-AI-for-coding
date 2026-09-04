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

## Power Management & Optimization

To mitigate the high power draw and heat generation of dual RTX 3090s, it is highly recommended to implement **undervolting**.

- **Method:** Use tools like MSI Afterburner (on Windows) or similar voltage curve adjustments on Linux to find a stable, lower voltage curve.
- **Benefit:** Significantly reduces power consumption (potentially by 50-100W per card), lowers operating temperatures, and reduces the risk of transient power spikes triggering PSU protections.
- **Impact:** Provides more headroom on the PSU and improves thermal stability within standard workstation cases.
