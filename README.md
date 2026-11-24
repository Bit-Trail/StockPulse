# [StockPulse](https://stockpulse.vercel.app)

> **StockPulse — Real-time retail inventory and automated supplier restocking system that tracks live sales velocity, triggers purchase orders before stockouts, and parses supplier price sheets with AI.**

---

## Problem Statement

Traditional billing and POS tools only tell you what has already happened—throwing stock errors after an item runs out. Shop owners often notice missing stock only when a customer asks for it, then spend time checking sheets, reading messy supplier rate lists, calculating order quantities, and messaging distributors—leading to lost sales while waiting on deliveries.

StockPulse solves this by tracking sales continuously, warning when stock is approaching its reorder threshold (based on sales pace, supplier delivery days, and safety buffer), calculating how much to order, and creating a purchase order ready for approval.

---

## What We Have Used

* **Frontend:** React, TypeScript, Vite, Tailwind CSS, and Lucide Icons.


* **Backend:** Node.js, Express, and TypeScript (`tsx`).


* **Database & Storage:** Supabase (PostgreSQL relational database + Supabase Storage bucket for product photos).


* **ORM:** Prisma 8 (`@prisma/orm-postgres`).


* **Real-Time Updates:** Server-Sent Events (SSE).


* **AI Layer:** Google Gemini API (`@google/generative-ai`) for parsing supplier price lists/rate sheets.



---

## How We Have Solved

1. **Product Shelf & Photo Uploads:** Shop items (name, SKU, selling price, current stock, reorder rules, and photo URL) are stored in PostgreSQL via Prisma 8, while product images are uploaded to Supabase Storage and saved as public URLs.


2. **Live Sales & Reorder Engine:** Recording a sale updates stock and rolling daily sales velocity inside a database transaction. When stock drops to or below the calculated Reorder Point ($\text{ROP} = (\text{Daily Sales Velocity} \times \text{Lead Time}) + \text{Safety Stock}$), the system drafts a `PENDING` Purchase Order (avoiding duplicate active orders) and broadcasts a live event over SSE.


3. **Real-World Order Lifecycle (`PENDING` → `APPROVED` → `DELIVERED`):**
* **Pending:** Drafted automatically when stock runs low.


* **Approved:** Marked as sent/in-transit with the supplier without adding phantom stock early.
* **Delivered:** Adds the ordered units to shelf stock once the delivery arrives.


4. **AI Supplier Price-List Importer:** Extracts minimum order quantities (`moq`) and delivery lead times (`lead_time_days`) from supplier rate-sheet text and updates matching products (with multi-model fallback and clear rate-limit feedback).



---

## Whom It Will Be Helpful For

* **Retail Shop Owners & Store Managers:** Groceries, kirana/general stores, produce/staples sellers, and multi-item retail counters that want visual stock visibility, low-stock alerts, and faster restocking without manual math.


* **Counter & Inventory Staff:** Anyone adding products with photos/prices, logging sales, or marking incoming supplier deliveries as received.


* **Small & Medium Distributors / Wholesale Operations:** Teams looking for a lightweight workflow connecting sales velocity, reorder thresholds, and supplier terms.
