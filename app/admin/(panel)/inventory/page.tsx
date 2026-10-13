"use client";
/* Inventory — one row per product per showroom.
   Add stock · Edit (set the exact count) · Move to another showroom · Mark damaged · Delete.
   Search, filters (showroom, category, metal, stock level), sort and 10/20/50/100/All per page. */
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { available, stockStatus } from "@/lib/inventory/stock";
import { adjustStock, deleteStockLine, markDamaged, setAvailable, transferStock } from "@/admin/services/inventory";
import { PageHead, StatusBadge, EmptyState } from "@/admin/components/ui";
import { usePaged } from "@/admin/components/CrudManager";
import { Modal } from "@/shared/components/Overlay";
import { Media } from "@/shared/components/Media";
import { Icon } from "@/shared/components/Icon";
import { useToast } from "@/shared/components/Toast";
import type { InventoryRecord, Product } from "@/types";

type Line = { key: string; p: Product; branchId: string; rec: InventoryRecord; avail: number; lastAt: string | undefined };
type Dialog =
  | { kind: "add" }
  | { kind: "edit" | "transfer" | "damage"; line: Line }
  | null;
type ProductRow = { p: Product; lines: Line[]; total: number; lastAt: string | undefined };
/** "SHINE Gold & Diamonds - Gold Souq (Branch 1)" → "Gold Souq (Branch 1)" */
const shortName = (name: string) => (name.includes(" - ") ? name.split(" - ").slice(1).join(" - ") : name);
type SortKey = "name" | "nameDesc" | "high" | "low" | "recent";

const ERR: Record<string, string> = {
  below_committed: "That is less than what is already sold or reserved.",
  insufficient_stock: "Not enough pieces available in this showroom.",
  invalid_transfer: "Choose a different showroom and a quantity above 0.",
  has_reservations: "This stock has open (unpaid) orders reserved on it — cancel those orders first.",
};

export default function InventoryPage() {
  const d = useDb();
  const { t, L, date } = useI18n();
  const { user, can } = useAdmin();
  const toast = useToast();
  const editable = can("inventory.update");
  const [tab, setTab] = useState<"stock" | "reservations" | "transactions">("stock");

  // Filters
  const [q, setQ] = useState("");
  const [fBranch, setFBranch] = useState("all");
  const [fCat, setFCat] = useState("all");
  const [fMetal, setFMetal] = useState("all");
  const [fLevel, setFLevel] = useState<"all" | "in" | "low" | "out">("all");
  const [sort, setSort] = useState<SortKey>("name");

  // Dialogs
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState({ productId: "", branchId: "", qty: 1, note: "", to: "" });
  const [err, setErr] = useState("");

  // Branch managers see only their branch.
  const branches = d.branches.filter((b) => !user?.branchId || b.id === user.branchId);
  const branchIds = new Set(branches.map((b) => b.id));
  const low = d.settings.lowStockThreshold;

  const lastMove = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of d.inventoryTx) {
      const k = `${x.productId}|${x.branchId}`;
      if (!m.has(k)) m.set(k, x.at); // newest first
    }
    return m;
  }, [d.inventoryTx]);

  const allLines = useMemo<Line[]>(
    () =>
      d.inventory
        .filter((r) => branchIds.has(r.branchId))
        .map((rec) => {
          const p = d.products.find((x) => x.id === rec.productId);
          return p ? ({ key: `${p.id}|${rec.branchId}`, p, branchId: rec.branchId, rec, avail: available(rec), lastAt: lastMove.get(`${p.id}|${rec.branchId}`) } as Line) : null;
        })
        .filter((x): x is Line => !!x),
    [d.inventory, d.products, lastMove, branches], // eslint-disable-line react-hooks/exhaustive-deps
  );


  // One row per product (with its showrooms inside).
  const productRows = useMemo<ProductRow[]>(() => {
    const term = q.trim().toLowerCase();
    const rows = d.products
      .filter((p) => (!term || `${p.name.en} ${p.name.ar} ${p.sku}`.toLowerCase().includes(term)) && (fCat === "all" || p.categoryIds.includes(fCat)) && (fMetal === "all" || p.rateId === fMetal))
      .map((p) => {
        const pl = allLines.filter((l) => l.p.id === p.id && (fBranch === "all" || l.branchId === fBranch));
        const total = pl.reduce((s, l) => s + l.avail, 0);
        const lastAt = pl.map((l) => l.lastAt).filter(Boolean).sort().pop();
        return { p, lines: pl, total, lastAt };
      })
      .filter((r) => (fLevel === "out" ? r.total === 0 : fLevel === "low" ? r.total > 0 && r.total <= low : fLevel === "in" ? r.total > low : true));
    const byName = (a: ProductRow, b: ProductRow) => a.p.name.en.localeCompare(b.p.name.en);
    rows.sort((a, b) => {
      switch (sort) {
        case "nameDesc": return -byName(a, b);
        case "high": return b.total - a.total || byName(a, b);
        case "low": return a.total - b.total || byName(a, b);
        case "recent": return Date.parse(b.lastAt ?? "0") - Date.parse(a.lastAt ?? "0") || byName(a, b);
        default: return byName(a, b);
      }
    });
    return rows;
  }, [d.products, allLines, q, fBranch, fCat, fMetal, fLevel, sort, low]);
  const paged = usePaged(productRows, `${q}|${fBranch}|${fCat}|${fMetal}|${fLevel}|${sort}`);
  const [manageId, setManageId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const managed = d.products.find((x) => x.id === manageId);
  const openManage = (p: Product) => {
    const c: Record<string, number> = {};
    branches.forEach((b) => { const r = d.inventory.find((x) => x.productId === p.id && x.branchId === b.id); c[b.id] = r ? available(r) : 0; });
    setCounts(c);
    setErr("");
    setManageId(p.id);
  };
  const saveManage = () => {
    if (!managed) return;
    try {
      branches.forEach((b) => {
        const r = d.inventory.find((x) => x.productId === managed.id && x.branchId === b.id);
        const cur = r ? available(r) : 0;
        if ((counts[b.id] ?? 0) !== cur) setAvailable(managed.id, b.id, counts[b.id] ?? 0, "Stock count updated");
      });
      toast(t("common.saved"));
      setManageId(null);
    } catch (e) {
      setErr(ERR[(e as Error).message] ?? (e as Error).message);
    }
  };
  const removeProductStock = (r: ProductRow) => {
    if (!r.lines.length) return;
    if (!window.confirm(`Remove all stock of ${r.p.name.en}${fBranch !== "all" ? ` from ${branchName(fBranch)}` : " from every showroom"}?`)) return;
    try {
      r.lines.forEach((l) => deleteStockLine(l.p.id, l.branchId));
      toast(t("common.deleted"));
    } catch (e) {
      toast(ERR[(e as Error).message] ?? (e as Error).message, "error");
    }
  };
  const pendingRes = d.orders.filter((o) => o.payment.status === "pending").flatMap((o) => o.items.map((it) => ({ o, it })));
  const resPaged = usePaged(pendingRes, pendingRes.length);
  const txPaged = usePaged(d.inventoryTx, d.inventoryTx.length);

  // Summary
  const totalPieces = allLines.reduce((s, l) => s + l.avail, 0);
  const productTotals = new Map<string, number>();
  allLines.forEach((l) => productTotals.set(l.p.id, (productTotals.get(l.p.id) ?? 0) + l.avail));
  const lowCount = [...productTotals.values()].filter((n) => n > 0 && n <= low).length;
  const outCount = d.products.filter((p) => (productTotals.get(p.id) ?? 0) === 0).length;

  const branchName = (id: string) => L(d.branches.find((b) => b.id === id)?.name) || id;
  const clearFilters = () => (setQ(""), setFBranch("all"), setFCat("all"), setFMetal("all"), setFLevel("all"));

  const open = (dlg: Exclude<Dialog, null>) => {
    setErr("");
    if (dlg.kind === "add") setForm({ productId: "", branchId: fBranch !== "all" ? fBranch : branches[0]?.id ?? "", qty: 1, note: "", to: "" });
    else setForm({ productId: dlg.line.p.id, branchId: dlg.line.branchId, qty: dlg.kind === "edit" ? dlg.line.avail : 1, note: "", to: branches.find((b) => b.id !== dlg.line.branchId)?.id ?? "" });
    setDialog(dlg);
  };

  const save = () => {
    if (!dialog) return;
    try {
      if (dialog.kind === "add") {
        if (!form.productId) return setErr("Choose a product");
        if (!form.branchId) return setErr("Choose a showroom");
        if (form.qty <= 0) return setErr("Enter how many pieces to add");
        adjustStock(form.productId, form.branchId, Math.round(form.qty), form.note || "Stock added");
      }
      if (dialog.kind === "edit") setAvailable(form.productId, form.branchId, form.qty, form.note);
      if (dialog.kind === "damage") markDamaged(form.productId, form.branchId, Math.round(form.qty), form.note || "Damaged");
      if (dialog.kind === "transfer") transferStock(form.productId, form.branchId, form.to, Math.round(form.qty));
      toast(t("common.saved"));
      setDialog(null);
    } catch (e) {
      setErr(ERR[(e as Error).message] ?? (e as Error).message);
    }
  };


  const dialogLine = dialog && dialog.kind !== "add" ? dialog.line : null;
  const titles = { add: "Add stock", edit: "Edit stock", transfer: "Move to another showroom", damage: "Mark as damaged" } as const;

  return (
    <>
      <PageHead
        title={t("admin.nav.inventory")}
        sub="Stock per showroom. Add, edit, move or remove stock — the website updates instantly."
        actions={editable && tab === "stock" ? <button className="btn" onClick={() => open({ kind: "add" })}><Icon name="plus" size={16} /> Add stock</button> : null}
      />

      <div className="inv-stats">
        <div className="a-card"><span className="muted small">Pieces in stock</span><b>{totalPieces.toLocaleString("en")}</b></div>
        <div className="a-card"><span className="muted small">Stock lines</span><b>{allLines.length}</b></div>
        <button className="a-card" onClick={() => (setTab("stock"), setFLevel("low"))}><span className="muted small">Low stock products</span><b className="inv-warn">{lowCount}</b></button>
        <button className="a-card" onClick={() => (setTab("stock"), setFLevel("out"))}><span className="muted small">Out of stock products</span><b className="inv-bad">{outCount}</b></button>
      </div>

      <div className="tabs" role="tablist" style={{ margin: "1rem 0" }}>
        {(["stock", "reservations", "transactions"] as const).map((x) => <button key={x} role="tab" className="tab" aria-selected={tab === x} onClick={() => setTab(x)}>{t(`admin.inventory.tab.${x}`)}</button>)}
      </div>

      {tab === "stock" ? (
        <>
          <div className="a-toolbar inv-toolbar">
            <input className="input" type="search" placeholder="Search product or SKU…" value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("admin.search")} />
            <select className="select" value={fBranch} onChange={(e) => setFBranch(e.target.value)} aria-label="Showroom">
              <option value="all">All showrooms</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{L(b.name)}</option>)}
            </select>
            <select className="select" value={fCat} onChange={(e) => setFCat(e.target.value)} aria-label="Category">
              <option value="all">All categories</option>
              {d.categories.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </select>
            <select className="select" value={fMetal} onChange={(e) => setFMetal(e.target.value)} aria-label="Metal">
              <option value="all">All metals</option>
              {d.rates.map((r) => <option key={r.id} value={r.id}>{L(r.label)}</option>)}
            </select>
            <select className="select" value={fLevel} onChange={(e) => setFLevel(e.target.value as typeof fLevel)} aria-label="Stock level">
              <option value="all">All stock levels</option>
              <option value="in">In stock</option>
              <option value="low">Low stock (1–{low})</option>
              <option value="out">Out of stock (0)</option>
            </select>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
              <option value="name">Name A–Z</option>
              <option value="nameDesc">Name Z–A</option>
              <option value="high">Most stock first</option>
              <option value="low">Least stock first</option>
              <option value="recent">Recently updated</option>
            </select>
            <button className="btn btn--ghost btn--sm" onClick={clearFilters}>Clear</button>
            <span className="muted small" style={{ marginInlineStart: "auto" }}>{productRows.length} products</span>
          </div>

          <div className="table-wrap inv-scroll">
            <table className="table inv-table">
              <thead>
                <tr>
                  <th className="num" style={{ width: 56 }}>S.No</th>
                  <th>{t("admin.f.product")}</th>
                  <th>Stock in each showroom</th>
                  <th className="num">Total</th>
                  <th>{t("admin.f.status")}</th>
                  <th>Last updated</th>
                  <th className="num">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paged.pageRows.map((r, i) => {
                  const level = stockStatus(r.total, low);
                  return (
                    <tr key={r.p.id}>
                      <td className="num muted">{paged.start + i + 1}</td>
                      <td>
                        <span className="cell-main">
                          <span className="thumb"><Media mediaId={r.p.imageIds[0]} kind="product" /></span>
                          <span><b>{L(r.p.name)}</b><small className="ltr">{r.p.sku} · {L(d.rates.find((x) => x.id === r.p.rateId)?.label)}</small></span>
                        </span>
                      </td>
                      <td>
                        {r.lines.length ? (
                          <div className="inv-chips">
                            {r.lines.map((l) => (
                              <span key={l.branchId} className={`inv-chip${l.avail === 0 ? " inv-chip--zero" : ""}`} title={branchName(l.branchId)}>
                                {shortName(branchName(l.branchId))} <b>{l.avail}</b>
                              </span>
                            ))}
                          </div>
                        ) : <span className="muted small">No stock in any showroom</span>}
                      </td>
                      <td className="num"><b className="inv-qty">{r.total}</b></td>
                      <td><StatusBadge value={level} label={t(`admin.inventory.level.${level}`)} /></td>
                      <td className="small muted" style={{ whiteSpace: "nowrap" }}>{r.lastAt ? date(r.lastAt, true) : "—"}</td>
                      <td>
                        {editable ? (
                          <div className="row-actions" style={{ flexWrap: "nowrap" }}>
                            <button className="btn btn--sm" onClick={() => openManage(r.p)}>Manage stock</button>
                            <button className="btn btn--danger btn--sm" disabled={!r.lines.length} onClick={() => removeProductStock(r)}>Delete</button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!productRows.length ? <EmptyState text="No products match these filters." /> : null}
          </div>
          {paged.pager}
        </>
      ) : null}

      {tab === "reservations" ? (
        <>
          <p className="field-hint" style={{ marginBottom: "0.75rem" }}>Pieces held for orders that are waiting for payment.</p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th className="num" style={{ width: 56 }}>S.No</th><th>{t("order.col.number")}</th><th>{t("admin.f.product")}</th><th>{t("admin.nav.showrooms")}</th><th className="num">{t("admin.inventory.qty")}</th><th>{t("order.col.date")}</th></tr></thead>
              <tbody>
                {resPaged.pageRows.map(({ o, it }, i) => (
                  <tr key={o.id + i}><td className="num muted">{resPaged.start + i + 1}</td><td className="ltr">{o.number}</td><td>{L(it.name)}</td><td>{branchName(it.branchId)}</td><td className="num">{it.qty}</td><td>{date(o.createdAt, true)}</td></tr>
                ))}
              </tbody>
            </table>
            {!pendingRes.length ? <EmptyState text="No reserved stock." /> : null}
          </div>
          {resPaged.pager}
        </>
      ) : null}

      {tab === "transactions" ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th className="num" style={{ width: 56 }}>S.No</th><th>{t("order.col.date")}</th><th>{t("admin.f.product")}</th><th>{t("admin.nav.showrooms")}</th><th>{t("admin.inventory.kind")}</th><th className="num">{t("admin.inventory.qty")}</th><th>{t("admin.inventory.note")}</th><th>{t("admin.audit.user")}</th></tr></thead>
              <tbody>
                {txPaged.pageRows.map((x, i) => (
                  <tr key={x.id}><td className="num muted">{txPaged.start + i + 1}</td><td>{date(x.at, true)}</td><td>{L(d.products.find((p) => p.id === x.productId)?.name)}</td><td>{branchName(x.branchId)}</td><td><span className="badge">{x.kind}</span></td><td className="num">{x.qty}</td><td>{x.note}</td><td className="muted">{x.by}</td></tr>
                ))}
              </tbody>
            </table>
            {!d.inventoryTx.length ? <EmptyState text="No stock movements yet." /> : null}
          </div>
          {txPaged.pager}
        </>
      ) : null}

      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog ? titles[dialog.kind] : ""}
        closeLabel={t("common.close")}
        footer={<>
          {err ? <span className="field-error" style={{ marginInlineEnd: "auto" }}>{err}</span> : null}
          <button className="btn btn--secondary" onClick={() => setDialog(null)}>{t("common.cancel")}</button>
          <button className="btn" onClick={save}>{t("common.save")}</button>
        </>}
      >
        {dialog ? (
          <div className="a-form">
            {dialog.kind === "add" ? (
              <>
                <label className="field span-2"><span className="label">{t("admin.f.product")}</span>
                  <select className="select" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                    <option value="">— Choose a product —</option>
                    {[...d.products].sort((a, b) => a.name.en.localeCompare(b.name.en)).map((p) => <option key={p.id} value={p.id}>{L(p.name)} · {p.sku}</option>)}
                  </select>
                </label>
                <label className="field"><span className="label">Showroom</span>
                  <select className="select" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                    {branches.map((b) => <option key={b.id} value={b.id}>{L(b.name)}</option>)}
                  </select>
                </label>
                <label className="field"><span className="label">Pieces to add</span><input className="input" type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} /></label>
                {form.productId && form.branchId ? (
                  <p className="span-2 muted small">Currently in this showroom: <b>{(() => { const r = d.inventory.find((x) => x.productId === form.productId && x.branchId === form.branchId); return r ? available(r) : 0; })()}</b> piece(s)</p>
                ) : null}
              </>
            ) : (
              <p className="span-2 muted">{dialogLine ? `${L(dialogLine.p.name)} · ${branchName(dialogLine.branchId)} · ${dialogLine.avail} available now` : ""}</p>
            )}

            {dialog.kind === "edit" ? (
              <label className="field"><span className="label">Available pieces (exact count)</span><input className="input" type="number" min={0} value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} /></label>
            ) : null}
            {dialog.kind === "transfer" || dialog.kind === "damage" ? (
              <label className="field"><span className="label">{t("admin.inventory.qty")}</span><input className="input" type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} /></label>
            ) : null}
            {dialog.kind === "transfer" ? (
              <label className="field"><span className="label">Move to</span>
                <select className="select" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}>
                  {d.branches.filter((b) => b.id !== form.branchId).map((b) => <option key={b.id} value={b.id}>{L(b.name)}</option>)}
                </select>
              </label>
            ) : (
              <label className="field span-2"><span className="label">{t("admin.inventory.note")}</span><input className="input" placeholder="Optional — e.g. New stock arrived" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            )}
          </div>
        ) : null}
      </Modal>
      <Modal
        open={!!managed}
        onClose={() => setManageId(null)}
        wide
        title={managed ? `Manage stock · ${managed.name.en}` : ""}
        closeLabel={t("common.close")}
        footer={<>
          {err ? <span className="field-error" style={{ marginInlineEnd: "auto" }}>{err}</span> : null}
          <button className="btn btn--secondary" onClick={() => setManageId(null)}>{t("common.cancel")}</button>
          <button className="btn" onClick={saveManage}>Save all</button>
        </>}
      >
        {managed ? (
          <div className="stack">
            <p className="muted small">Type how many pieces are in each showroom, then click <b>Save all</b>. Use <b>Move</b> or <b>Damaged</b> for transfers and breakages.</p>
            <table className="table inv-manage">
              <thead><tr><th>Showroom</th><th className="num">Available now</th><th style={{ width: 210 }}>New count</th><th className="num">More</th></tr></thead>
              <tbody>
                {branches.map((b) => {
                  const rec = d.inventory.find((x) => x.productId === managed.id && x.branchId === b.id);
                  const now = rec ? available(rec) : 0;
                  const line: Line = { key: `${managed.id}|${b.id}`, p: managed, branchId: b.id, rec: rec ?? { id: "", productId: managed.id, branchId: b.id, total: 0, reserved: 0, sold: 0, returned: 0, damaged: 0, transferred: 0 }, avail: now, lastAt: undefined };
                  const v = counts[b.id] ?? 0;
                  return (
                    <tr key={b.id}>
                      <td>{L(b.name)}{rec?.reserved ? <small className="muted"> · {rec.reserved} reserved</small> : null}</td>
                      <td className="num">{now}</td>
                      <td>
                        <div className="inv-stepper">
                          <button className="btn btn--secondary btn--sm" aria-label="Minus one" onClick={() => setCounts({ ...counts, [b.id]: Math.max(0, v - 1) })}>−</button>
                          <input className="input" type="number" min={0} value={v} onChange={(e) => setCounts({ ...counts, [b.id]: Math.max(0, Number(e.target.value)) })} />
                          <button className="btn btn--secondary btn--sm" aria-label="Plus one" onClick={() => setCounts({ ...counts, [b.id]: v + 1 })}>+</button>
                        </div>
                      </td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          <button className="btn btn--secondary btn--sm" disabled={now === 0} onClick={() => (setManageId(null), open({ kind: "transfer", line }))}>Move</button>
                          <button className="btn btn--secondary btn--sm" disabled={now === 0} onClick={() => (setManageId(null), open({ kind: "damage", line }))}>Damaged</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="small">Total after saving: <b>{branches.reduce((s2, b) => s2 + (counts[b.id] ?? 0), 0)}</b> pieces</p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}