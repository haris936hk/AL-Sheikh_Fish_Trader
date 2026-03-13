# FISHPLUS Distributor — Business Model

## Overview

**AL-SHEIKH FISH TRADER AND DISTRIBUTER** is a fish distribution business based in Rawalpindi, Pakistan. The business acts as a **middleman (distributor)** between fish suppliers (بیوپاری) and retail customers (گاہک). The system manages two distinct sales channels and full purchase-to-payment accounting.

---

## Core Business Roles

| Role            | Urdu        | Description                                               |
| --------------- | ----------- | --------------------------------------------------------- |
| **Distributor** | ڈسٹری بیوٹر | The business itself — facilitates sales and manages stock |
| **Supplier**    | بیوپاری     | Fish vendors who provide fish to the distributor          |
| **Customer**    | گاہک        | Buyers who purchase fish                                  |

---

## Transaction Types

### 1. Purchase (خریداری) — Stock In

> **Purpose:** The only way to increase stock inventory.

- Fish is bought from a **supplier** and added to the distributor's inventory.
- Each purchase records: item, weight, rate, and amount.
- The supplier's balance increases (what the distributor owes them).
- `items.current_stock` is **increased** by the purchased weight.

```
Supplier ──[fish]──► Distributor's Stock
Supplier ◄──[money]── Distributor (cash paid or balance)
```

---

### 2. Sale (بکری) — Two Types

The Sale form supports **two fundamentally different types of sales**, controlled by the **Stock checkbox**.

---

#### 2a. Direct Sale (Stock ☐ unchecked)

> **The core distribution business.** Fish goes directly from supplier to customer. The distributor is just a middleman.

- The supplier sends fish, the distributor facilitates the sale to the customer.
- Fish **never enters the distributor's stock** — it passes through in real-time.
- The distributor earns commission on the transaction (tracked via Supplier Bills).
- **Stock is NOT affected** — `items.current_stock` does not change.
- **Supplier field is required** — the supplier who is providing the fish must be specified.

```
Supplier ──[fish]──► Distributor ──[fish]──► Customer
                     (middleman)
Supplier ◄──[payment - commission]── Distributor ◄──[payment]── Customer
```

**Financial Impact:**

- Customer balance **increases** (they owe more to the distributor)
- Supplier is tracked via the Supplier Bill system for periodic settlement

---

#### 2b. Stock Sale (Stock ☑ checked)

> **Selling from own inventory.** The distributor sells fish that was previously purchased and stored.

- Fish was already purchased and is sitting in the distributor's stock.
- When sold, the stock is **deducted** from `items.current_stock`.
- The system validates that sufficient stock is available before allowing the sale.
- **Supplier field is optional** — can optionally link a supplier for tracking purposes.

```
Distributor's Stock ──[fish]──► Customer
                                Customer ──[payment]──► Distributor
```

**Financial Impact:**

- Customer balance **increases** (they owe more to the distributor)
- `items.current_stock` **decreases** by the sold weight

---

### Comparison Table

| Aspect                      | Direct Sale (`is_stock = 0`) | Stock Sale (`is_stock = 1`)         |
| --------------------------- | ---------------------------- | ----------------------------------- |
| **Fish source**             | Supplier (real-time)         | Distributor's own inventory         |
| **Distributor role**        | Middleman / facilitator      | Seller                              |
| **Stock impact**            | ❌ No change                 | ✅ Deducted from `current_stock`    |
| **Supplier field**          | Required                     | Optional                            |
| **Revenue model**           | Commission on sales          | Full sale price minus purchase cost |
| **Stock validation**        | Not needed                   | Must have sufficient stock          |
| **Appears in Stock Report** | ❌ No                        | ✅ Yes                              |
| **Customer balance**        | ✅ Updated                   | ✅ Updated                          |

---

## Stock Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                      STOCK LIFECYCLE                        │
│                                                             │
│  Purchase ──[+weight]──► items.current_stock                │
│                                │                            │
│                          Stock Sale ──[-weight]──►           │
│                                                             │
│  Direct Sale ──── NO EFFECT on stock ────                   │
│                                                             │
│  Stock Report = opening + Σpurchases - Σstock_sales         │
│               (only is_stock=1 sales are subtracted)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Financial Flow

### Customer Balance

```
Customer Balance = Opening Balance + Σ(All Sales) - Σ(Payments Received)
```

Both direct and stock sales affect the customer's balance.

### Supplier Balance

```
Supplier Balance = Opening Balance + Σ(Purchases) - Σ(Payments Made)
```

Only purchases affect the supplier balance. Direct sales appear in the **Supplier Bill** which is a periodic settlement mechanism.

---

## Supplier Bill (بیوپاری بل)

The Supplier Bill is a periodic reconciliation with a supplier. It aggregates all sales linked to that supplier within a date range and calculates:

| Field           | Description                          |
| --------------- | ------------------------------------ |
| Gross Amount    | Total sale amounts within the period |
| Commission      | Distributor's cut (default 5%)       |
| Various Charges | Drugs, fare, labor, ice, other       |
| Cash Paid       | Amount already paid to supplier      |
| Collection      | Amounts collected                    |
| Balance         | What remains to be settled           |

> **Note:** Only direct sales linked to a supplier appear in the financial Supplier Bill. Stock sales are excluded, as their revenue fully belongs to the distributor.

---

## Reports

| Report                 | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| **Stock Report**       | Current inventory levels (purchases in, stock sales out) |
| **Stock Sale History** | All sales from stock within a date range                 |
| **Customer Recovery**  | Sales and payment tracking per customer                  |
| **Vendor Sales**       | Sales grouped by supplier                                |
| **Vendor Stock Bill**  | Stock sales for a specific supplier on a date            |
| **Daily Sales**        | Aggregated daily sales summary                           |
| **Daily Details**      | Line-item detail for a specific date                     |
| **Item Sale/Purchase** | Transaction history for a specific item                  |
| **Ledger**             | Account ledger for customer or supplier                  |
| **Customer Register**  | All customer balances as of a date                       |
| **Concession Report**  | Sales with discounts/concessions                         |
| **Net Summary**        | Day-end reconciliation                                   |

---

## Units

| Unit              | Conversion            |
| ----------------- | --------------------- |
| **Kilogram (kg)** | Base weight unit      |
| **Maund (من)**    | 1 Maund = 40 kg       |
| **Currency**      | Pakistani Rupee (Rs.) |

---

_Last updated: 2026-03-08_
_Based on: Business requirements discussion and codebase audit_
