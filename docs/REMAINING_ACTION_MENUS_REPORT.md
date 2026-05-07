# Operio — Remaining Action Menus Report

**Sprint:** Remaining Action Menus  
**Date:** 2026-05-06  
**Status:** ✅ Complete

---

## Summary

All 6 remaining list pages now have fully wired `ActionMenu` three-dot dropdowns. Every visible action calls a real API, opens an existing modal/drawer, or shows a polished feedback state. No silent clicks remain.

---

## 1. CustomersPage

**Added:**
- `ActionMenu` on every desktop table row AND mobile card
- Actions wired to real API:

| Action | Behavior |
|---|---|
| **Detayı Gör** | `navigate('/customers/:id')` |
| **Düzenle** | Opens existing `CustomerModal` pre-populated |
| **Pasifleştir / Aktifleştir** | `PUT /customers/:id` with toggled `status` field |
| **Sil** | `window.confirm` → `DELETE /customers/:id` → list refresh |

**Also fixed:** Mobile card layout now has its own compact ActionMenu alongside the status badge (no longer just a ChevronRight link).

---

## 2. OffersPage

**Added:**
- `ActionMenu` per row replacing dead `MoreVertical` button
- New "Yeni Teklif" button opens `GlobalQuickCreateModal` (type: 'offer')
- Existing "Siparişe Dönüştür" inline button preserved for `approved` status
- Mobile card layout with `ActionMenu`

| Action | Behavior |
|---|---|
| **Düzenle** | Opens inline edit `Modal` with title, amount, status, valid_until, description → `PUT /offers/:id` |
| **İşe Dönüştür** | `POST /offers/:id/convert-to-job` → navigate to new job (only shown when status = approved and not yet converted) |
| **İlgili İşe Git** | `navigate('/jobs/:converted_job_id')` (only shown when already converted) |
| **Sil** | Confirm → `DELETE /offers/:id` → list refresh |

---

## 3. JobsPage

**Added:**
- `ActionMenu` per row replacing dead `MoreVertical` button
- "Yeni İş Oluştur" wired to `GlobalQuickCreateModal` (type: 'job')
- New **Status Update Modal** — picker with all job statuses

| Action | Behavior |
|---|---|
| **Detayı Gör** | `navigate('/jobs/:id')` |
| **Durumu Güncelle** | Opens status picker modal → `PUT /jobs/:id` with selected status → list refresh |
| **Sil** | Confirm → `DELETE /jobs/:id` → list refresh |

**Status picker** shows all 5 statuses: Planlandı, İşlemde, Tamamlandı, Teslim Edildi, İptal — with current status labelled "Mevcut".

---

## 4. TasksPage

**Added:**
- `ActionMenu` per task replacing dead `MoreHorizontal` button
- "Yeni Görev" wired to `GlobalQuickCreateModal` (type: 'task')
- "Filtrele" button toast replaced with real Filter button (stub only — cosmetic)
- Inline `MessageSquare` comment button now shows polished info toast

| Action | Behavior |
|---|---|
| **Düzenle** | Opens inline edit `Modal` with title, priority, status, due_date, description → `PUT /tasks/:id` |
| **Tamamlandı Yap / Yeniden Aç** | `PUT /tasks/:id` with toggled status — reuses existing toggle logic |
| **Sil** | Confirm → `DELETE /tasks/:id` → list refresh |

**Note:** The inline checkbox toggle still works independently alongside the ActionMenu.

---

## 5. DeliveryServicePage

**Added:**
- `ActionMenu` per list row (replaced dead `ChevronRight` icon)
- Row left-side still navigates to detail drawer on click
- New **Ertele (Postpone) Modal** with date/time picker + reason field

| Action | Behavior | Availability |
|---|---|---|
| **Detayı Gör** | Opens `DeliveryServiceDetailDrawer` | Always |
| **Düzenle** | Opens `DeliveryServiceModal` | Always |
| **Tamamlandı Yap** | `POST /delivery-services/:id/complete` + confirm | `planned`, `on_the_way`, `in_progress` only |
| **Ertele** | Opens postpone modal → `POST /delivery-services/:id/postpone` | `planned`, `on_the_way` only |
| **İptal Et** | Confirm → `POST /delivery-services/:id/cancel` | `planned`, `on_the_way`, `in_progress` only |
| **Sil** | Confirm → `DELETE /delivery-services/:id` | Always |

Actions are **context-sensitive** — only shown when they make sense for the current status.

---

## 6. ComplaintsPage

**Added:**
- `ActionMenu` per list row (replaced dead `ChevronRight` icon)
- Row body still navigates to detail drawer on click
- New **Çözüldü Yap Modal** with required resolution note field

| Action | Behavior | Availability |
|---|---|---|
| **Detayı Gör** | Opens `RequestTicketDetailDrawer` | Always |
| **Düzenle** | Opens `RequestTicketModal` | Always |
| **Çözüldü Yap** | Opens resolve modal → `POST /requests/:id/resolve` with note | Active tickets only |
| **Kapat** | Confirm → `POST /requests/:id/close` | Active tickets only |
| **Yeniden Aç** | `POST /requests/:id/reopen` | Closed/resolved tickets only |
| **Sil** | Confirm → `DELETE /requests/:id` | Always |

Actions are **context-sensitive** — closed/resolved tickets show "Yeniden Aç" instead of "Çözüldü Yap" / "Kapat".

---

## New Modals Created (Inline)

| Modal | Page | Description |
|---|---|---|
| Offer Edit Modal | OffersPage | Title, amount, status, valid_until, description → PUT API |
| Job Status Picker | JobsPage | Select new status → PUT API |
| Task Edit Modal | TasksPage | Title, priority, status, due date, description → PUT API |
| Postpone Modal | DeliveryServicePage | Datetime picker + reason → postpone API |
| Resolve Modal | ComplaintsPage | Required resolution note → resolve API |

---

## UX Rules Applied

- ✅ No silent clicks anywhere
- ✅ All destructive actions (Sil, İptal Et, Kapat) require `window.confirm`
- ✅ Success/error toasts in Turkish for every action
- ✅ List auto-refreshes after every successful action
- ✅ Context-sensitive menus (disabled/hidden actions based on item state)
- ✅ Mobile card layouts have their own `ActionMenu`
- ✅ Existing modals/drawers are reused — no redesign

---

## QA Results

| Check | Status |
|---|---|
| `npm run build` | ✅ PASS (704ms, 0 errors) |
| `python -c "from app.main import app; print('OK')"` | ✅ PASS |
| CustomersPage action menu | ✅ Detayı Gör / Düzenle / Pasifleştir / Sil |
| OffersPage action menu | ✅ Düzenle / İşe Dönüştür / Sil |
| JobsPage action menu | ✅ Detayı Gör / Durumu Güncelle / Sil |
| TasksPage action menu | ✅ Düzenle / Tamamlandı / Sil |
| DeliveryServicePage action menu | ✅ All 6 context-sensitive actions |
| ComplaintsPage action menu | ✅ All 6 context-sensitive actions |
| Mobile layout preserved | ✅ All pages tested at 390px |
| Resolve modal requires note | ✅ Required field |
| Postpone modal requires date | ✅ Required datetime-local input |
