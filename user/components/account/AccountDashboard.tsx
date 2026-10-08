"use client";
import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { changeCustomerPassword, deleteAddress, logoutCustomer, saveAddress, updateCustomerProfile } from "@/user/services/account";
import { ProductCard } from "@/user/components/product/ProductCard";
import { TextInput } from "@/shared/components/Form";
import { useToast } from "@/shared/components/Toast";
import { uid } from "@/lib/utils";
import type { Address, Customer } from "@/types";

const TABS = ["dashboard", "profile", "addresses", "orders", "wishlist", "certificates", "appointments", "personalisation", "notifications", "password"] as const;
type Tab = (typeof TABS)[number];

export function AccountDashboard({ customer }: { customer: Customer }) {
  const d = useDb();
  const toast = useToast();
  const { t, L, money, date } = useI18n();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [profile, setProfile] = useState({ name: customer.name, phone: customer.phone });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [addr, setAddr] = useState<Address | null>(null);
  const orders = d.orders.filter((o) => o.customerId === customer.id);
  const appts = d.appointments.filter((a) => a.customerId === customer.id || a.email === customer.email);
  const perso = d.personalisation.filter((p) => p.customerId === customer.id || p.email === customer.email);
  const notes = d.notifications.filter((n) => n.to === customer.email || (customer.phone && n.to === customer.phone));
  const certs = orders.flatMap((o) => o.items.map((it) => ({ it, o, p: d.products.find((p) => p.id === it.productId) }))).filter((x) => x.p?.certificateNo);
  const wish = d.products.filter((p) => d.session.wishlist.includes(p.id));

  return (
    <div className="container">
      <div className="row row--between">
        <h1 className="page-title">{t("account.hello", { name: customer.name.split(" ")[0] })}</h1>
        <button className="btn btn--secondary btn--sm" onClick={logoutCustomer}>{t("account.signOut")}</button>
      </div>
      <div className="account-layout">
        <nav className="account-nav" aria-label={t("header.account")}>
          {TABS.map((x) => <button key={x} aria-current={tab === x} onClick={() => setTab(x)}>{t(`account.tab.${x}`)}</button>)}
        </nav>
        <div className="stack" style={{ gap: "1.5rem" }}>
          {tab === "dashboard" ? (
            <>
              <div className="stat-mini">
                <div><span className="muted small">{t("account.tab.orders")}</span><b>{orders.length}</b></div>
                <div><span className="muted small">{t("account.tab.wishlist")}</span><b>{wish.length}</b></div>
                <div><span className="muted small">{t("account.tab.appointments")}</span><b>{appts.length}</b></div>
              </div>
              <div className="panel"><h2>{t("account.recentOrders")}</h2>{orders.length ? ordersTable() : <p className="muted">{t("account.noOrders")}</p>}</div>
            </>
          ) : null}
          {tab === "profile" ? (
            <div className="panel stack">
              <h2>{t("account.tab.profile")}</h2>
              <div className="form-grid">
                <TextInput label={t("forms.name")} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                <TextInput label={t("forms.phone")} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                <TextInput className="span-2" label={t("forms.email")} value={customer.email} readOnly />
              </div>
              <button className="btn" style={{ justifySelf: "start" }} onClick={() => (updateCustomerProfile(customer.id, profile), toast(t("common.saved")))}>{t("common.save")}</button>
            </div>
          ) : null}
          {tab === "addresses" ? (
            <div className="panel stack">
              <h2>{t("account.tab.addresses")}</h2>
              {customer.addresses.map((a) => (
                <div key={a.id} className="row row--between" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
                  <span><strong>{a.label}</strong><br /><span className="muted small">{a.building}, {a.street}, {t("address.zone")} {a.zone}, {a.area}, {a.city}</span></span>
                  <span className="row"><button className="btn btn--ghost btn--sm" onClick={() => setAddr(a)}>{t("common.edit")}</button><button className="btn btn--ghost btn--sm" onClick={() => deleteAddress(customer.id, a.id)}>{t("common.delete")}</button></span>
                </div>
              ))}
              {addr ? (
                <div className="form-grid">
                  {(["label", "fullName", "phone", "building", "street", "zone", "area", "city", "landmark", "directions"] as const).map((k) => (
                    <TextInput key={k} label={t(`address.${k}`)} value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })} />
                  ))}
                  <div className="row span-2">
                    <button className="btn" onClick={() => (saveAddress(customer.id, addr), setAddr(null), toast(t("common.saved")))}>{t("common.save")}</button>
                    <button className="btn btn--secondary" onClick={() => setAddr(null)}>{t("common.cancel")}</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn--secondary" style={{ justifySelf: "start" }} onClick={() => setAddr({ id: uid("adr"), label: "Home", fullName: customer.name, phone: customer.phone, building: "", street: "", zone: "", area: "", city: "Doha", landmark: "", directions: "", country: "Qatar" })}>+ {t("address.new")}</button>
              )}
            </div>
          ) : null}
          {tab === "orders" ? <div className="panel"><h2>{t("account.tab.orders")}</h2>{orders.length ? ordersTable() : <p className="muted">{t("account.noOrders")}</p>}</div> : null}
          {tab === "wishlist" ? (wish.length ? <div className="grid-products" style={{ ["--grid-cols" as string]: "3" }}>{wish.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <p className="muted">{t("wishlist.empty")}</p>) : null}
          {tab === "certificates" ? (
            <div className="panel"><h2>{t("account.tab.certificates")}</h2>
              {certs.length ? <table className="table"><tbody>{certs.map(({ it, o, p }) => <tr key={o.id + it.productId}><td>{L(it.name)}</td><td className="ltr">{p?.certificateNo}</td><td className="muted">{o.number}</td></tr>)}</tbody></table> : <p className="muted">{t("account.noCertificates")}</p>}
            </div>
          ) : null}
          {tab === "appointments" ? (
            <div className="panel"><h2>{t("account.tab.appointments")}</h2>
              {appts.length ? <table className="table"><tbody>{appts.map((a) => <tr key={a.id}><td>{a.service}</td><td>{L(d.branches.find((b) => b.id === a.branchId)?.name)}</td><td className="ltr">{a.date} {a.time}</td><td><span className="badge">{t(`apt.${a.status}`)}</span></td></tr>)}</tbody></table> : <p className="muted">{t("account.none")}</p>}
              <Link href="/appointment" className="btn btn--secondary btn--sm" style={{ marginTop: "1rem" }}>{t("nav.bookAppointment")}</Link>
            </div>
          ) : null}
          {tab === "personalisation" ? (
            <div className="panel"><h2>{t("account.tab.personalisation")}</h2>
              {perso.length ? <table className="table"><tbody>{perso.map((p) => <tr key={p.id}><td>{p.type}</td><td>{p.text}</td><td>{date(p.createdAt)}</td><td><span className="badge">{p.status}</span></td></tr>)}</tbody></table> : <p className="muted">{t("account.none")}</p>}
              <Link href="/personalise" className="btn btn--secondary btn--sm" style={{ marginTop: "1rem" }}>{t("nav.personalise")}</Link>
            </div>
          ) : null}
          {tab === "notifications" ? (
            <div className="panel"><h2>{t("account.tab.notifications")}</h2>
              {notes.length ? <table className="table"><tbody>{notes.map((n) => <tr key={n.id}><td><span className="badge">{n.channel}</span></td><td>{n.message}</td><td className="muted">{date(n.at, true)}</td></tr>)}</tbody></table> : <p className="muted">{t("account.none")}</p>}
            </div>
          ) : null}
          {tab === "password" ? (
            <div className="panel stack">
              <h2>{t("account.tab.password")}</h2>
              <div className="form-grid">
                <TextInput label={t("auth.currentPassword")} type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
                <TextInput label={t("auth.newPassword")} type="password" value={pw.next} hint={t("auth.passwordRule")} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </div>
              <button className="btn" style={{ justifySelf: "start" }} onClick={async () => {
                const r = await changeCustomerPassword(customer.id, pw.current, pw.next);
                if (!r.ok) return toast(t(`auth.error.${r.error}`), "error");
                setPw({ current: "", next: "" });
                toast(t("common.saved"));
              }}>{t("common.save")}</button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  function ordersTable() {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t("order.col.number")}</th><th>{t("order.col.date")}</th><th>{t("order.col.status")}</th><th className="num">{t("cart.total")}</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/order/${o.id}`} className="ltr">{o.number}</Link></td>
                <td>{date(o.createdAt)}</td>
                <td><span className="badge">{t(`status.${o.status}`)}</span></td>
                <td className="num">{money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
