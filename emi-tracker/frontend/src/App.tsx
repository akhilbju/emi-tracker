
import { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    CircleDollarSign,
    Landmark,
    Plus,
    Check,
    Pencil,
    History,
    X,
    WalletCards,
    ArrowUpRight,
    Search,
    Trash2,
} from 'lucide-react';

import type { EMI, Payment, Frequency } from './types';
import { syncDueNotifications } from './notifications';

import {
    loadEMIs,
    saveEMIs,
    loadPayments,
    savePayments,
    reconcile,
    markPayment,
    addOccurrence,
} from './storage';

const money = (n: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(n);

const dateLabel = (s: string) =>
    new Date(s + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

const todayString = () => {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
    ).padStart(2, '0')}`;
};

const blank: EMI = {
    id: '',
    name: '',
    bank: '',
    dueDay: 1,
    amount: 0,
    remaining: 1,
    nextDue: todayString(),
    active: true,
    frequency: 'Monthly',
};

export default function App() {
    const [emis, setEmis] = useState<EMI[]>(() => loadEMIs());
    const [payments, setPayments] = useState<Payment[]>(() => loadPayments());

    const [bank, setBank] = useState('All banks');
    const [tab, setTab] = useState<'dashboard' | 'emis' | 'history'>('dashboard');

    const [editing, setEditing] = useState<EMI | null>(null);
    const [form, setForm] = useState<EMI>(blank);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const result = reconcile(emis, payments);

        setEmis(result.emis);
        setPayments(result.payments);

        saveEMIs(result.emis);
        savePayments(result.payments);
    }, []);

    useEffect(() => saveEMIs(emis), [emis]);

    useEffect(() => savePayments(payments), [payments]);

    useEffect(() => {
        void syncDueNotifications(emis);
    }, [emis]);

    const banks = useMemo(
        () => [
            'All banks',
            ...Array.from(new Set(emis.map((e) => e.bank).filter(Boolean))),
        ],
        [emis],
    );

    const visible = emis.filter(
        (e) =>
            (bank === 'All banks' || e.bank === bank) &&
            e.name.toLowerCase().includes(search.toLowerCase()),
    );

    const monthly = emis
        .filter((e) => e.active && e.frequency === 'Monthly')
        .reduce((s, e) => s + e.amount, 0);

    const totalDebt = emis
        .filter((e) => e.active && e.remaining !== null)
        .reduce((s, e) => s + e.amount * (e.remaining || 0), 0);

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

    const active = emis.filter((e) => e.active);

    const upcoming = active
        .slice()
        .sort((a, b) => a.nextDue.localeCompare(b.nextDue));

    const openForm = (e?: EMI) => {
        const value = e ? { ...e } : { ...blank, id: crypto.randomUUID() };

        setEditing(e || null);
        setForm(value);
        setShowForm(true);
    };

    const closeForm = () => {
        setEditing(null);
        setForm(blank);
        setShowForm(false);
    };

    const saveForm = () => {
        const val = {
            ...form,
            dueDay: Number(form.nextDue.slice(-2)) || form.dueDay,
            active: form.remaining !== 0,
        };

        setEmis((old) =>
            editing
                ? old.map((e) => (e.id === editing.id ? val : e))
                : [val, ...old],
        );

        closeForm();
    };

    const pay = (e: EMI, status: Payment['status']) => {
        const result = markPayment(e, status, emis, payments);

        setEmis(result.emis);
        setPayments(result.history);
    };

    const deleteEMI = (id: string) => {
        if (confirm('Delete this EMI and its payment history?')) {
            setEmis((es) => es.filter((e) => e.id !== id));
            setPayments((ps) => ps.filter((p) => p.emiId !== id));
        }
    };

    const undoPayment = (p: Payment) => {
        if (
            !confirm(
                `Undo the payment entry for ${p.emiName} dated ${dateLabel(p.dueDate)}?`,
            )
        ) {
            return;
        }

        const sameEMI = payments
            .filter((x) => x.emiId === p.emiId)
            .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

        const isLatest = sameEMI[0]?.id === p.id;

        if (isLatest) {
            setEmis((es) =>
                es.map((e) => {
                    if (e.id !== p.emiId) return e;

                    const expectedNext = addOccurrence(p.dueDate, e.frequency);

                    if (e.nextDue !== expectedNext) return e;

                    return {
                        ...e,
                        nextDue: p.dueDate,
                        remaining: e.remaining === null ? null : e.remaining + 1,
                        active: true,
                    };
                }),
            );
        }

        setPayments((ps) => ps.filter((x) => x.id !== p.id));
    };

    return (
        <main className="app-shell">
            <header className="top">
                <div className="brand">
                    <div className="brand-icon">
                        <CircleDollarSign size={24} />
                    </div>

                    <div>
                        <h1>EMI Tracker</h1>
                        <p>Your payments, in control.</p>
                    </div>
                </div>

                <button className="add" onClick={() => openForm()}>
                    <Plus size={17} /> Add EMI
                </button>
            </header>

            <nav className="tabs">
                <button
                    className={tab === 'dashboard' ? 'selected' : ''}
                    onClick={() => setTab('dashboard')}
                >
                    Overview
                </button>

                <button
                    className={tab === 'emis' ? 'selected' : ''}
                    onClick={() => setTab('emis')}
                >
                    My EMIs
                </button>

                <button
                    className={tab === 'history' ? 'selected' : ''}
                    onClick={() => setTab('history')}
                >
                    History
                </button>
            </nav>

            {tab === 'dashboard' && (
                <>
                    <section className="hero">
                        <div>
                            <span className="eyebrow">MONTHLY COMMITMENTS</span>
                            <h2>{money(monthly)}</h2>
                            <p>Across {active.length} active payment plans</p>
                        </div>

                        <div className="hero-icon">
                            <WalletCards size={27} />
                        </div>

                        <div className="hero-glow" />
                    </section>

                    <div className="stats">
                        <article>
                            <div className="stat-icon green">
                                <Landmark size={18} />
                            </div>
                            <span>Active EMIs</span>
                            <strong>{active.length}</strong>
                            <small>Payment plans</small>
                        </article>

                        <article>
                            <div className="stat-icon violet">
                                <History size={18} />
                            </div>
                            <span>Payments logged</span>
                            <strong>{payments.length}</strong>
                            <small>Recorded installments</small>
                        </article>

                        <article>
                            <div className="money-stat">
                                <span>Total remaining debt</span>
                                <strong>{money(totalDebt)}</strong>
                                <small>
                                    Remaining scheduled installments; unlimited plans excluded
                                </small>
                            </div>
                        </article>

                        <article>
                            <div className="money-stat">
                                <span>Total paid</span>
                                <strong>{money(totalPaid)}</strong>
                                <small>All payment history entries</small>
                            </div>
                        </article>
                    </div>

                    <section className="section">
                        <div className="section-head">
                            <div>
                                <h3>Coming up</h3>
                                <p>Keep an eye on your next due dates</p>
                            </div>

                            <button className="text-button" onClick={() => setTab('emis')}>
                                See all <ArrowUpRight size={15} />
                            </button>
                        </div>

                        {upcoming.slice(0, 5).map((e) => (
                            <EMIRow
                                key={e.id}
                                e={e}
                                onPay={() => pay(e, 'Paid')}
                                onEdit={() => openForm(e)}
                            />
                        ))}
                    </section>
                </>
            )}

            {tab === 'emis' && (
                <section className="section">
                    <div className="section-head">
                        <div>
                            <h3>All payment plans</h3>
                            <p>Manage due dates, amounts and recurrence</p>
                        </div>

                        <select value={bank} onChange={(e) => setBank(e.target.value)}>
                            {banks.map((b) => (
                                <option key={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div className="search">
                        <Search size={16} />
                        <input
                            placeholder="Search EMI name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {visible.map((e) => (
                        <EMIRow
                            key={e.id}
                            e={e}
                            onPay={() => pay(e, 'Paid')}
                            onEdit={() => openForm(e)}
                            onDelete={() => deleteEMI(e.id)}
                        />
                    ))}
                </section>
            )}

            {tab === 'history' && (
                <section className="section">
                    <div className="section-head">
                        <div>
                            <h3>Payment history</h3>
                            <p>Every installment in one place</p>
                        </div>

                        <span className="count">{payments.length} records</span>
                    </div>

                    {payments.length === 0 ? (
                        <div className="empty">
                            <History size={25} />
                            <b>No payments recorded yet</b>
                            <span>When an EMI is marked paid, it will appear here.</span>
                        </div>
                    ) : (
                        payments
                            .slice()
                            .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
                            .map((p) => (
                                <div className="history-row" key={p.id}>
                                    <div className="round-icon">
                                        <History size={17} />
                                    </div>

                                    <div className="row-main">
                                        <b>{p.emiName}</b>
                                        <span>
                                            {dateLabel(p.dueDate)} · {p.status}
                                        </span>
                                    </div>

                                    <strong>{money(p.amount)}</strong>

                                    <button
                                        className="undo-btn"
                                        title="Undo this payment entry"
                                        onClick={() => undoPayment(p)}
                                    >
                                        <Trash2 size={14} /> Undo
                                    </button>
                                </div>
                            ))
                    )}
                </section>
            )}

            <footer>
                <span className="footer-dot" /> Saved on this device <span>·</span> Dates
                are tracked locally
            </footer>

            {showForm && (
                <div className="modal-backdrop" onClick={closeForm}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <span className="eyebrow">PAYMENT DETAILS</span>
                                <h3>{editing ? 'Edit EMI' : 'Add a new EMI'}</h3>
                                <p>Set the details and how often it repeats.</p>
                            </div>

                            <button className="icon-btn" onClick={closeForm}>
                                <X />
                            </button>
                        </div>

                        <label>
                            EMI name
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Bike loan"
                            />
                        </label>

                        <label>
                            Bank / lender
                            <input
                                value={form.bank}
                                onChange={(e) => setForm({ ...form, bank: e.target.value })}
                                placeholder="e.g. ICICI Bank"
                            />
                        </label>

                        <label>
                            Installment amount
                            <input
                                type="number"
                                min="1"
                                value={form.amount || ''}
                                onChange={(e) =>
                                    setForm({ ...form, amount: Number(e.target.value) })
                                }
                                placeholder="₹ Amount"
                            />
                            <small>Amount charged each occurrence.</small>
                        </label>

                        <label>
                            First due date
                            <input
                                type="date"
                                value={form.nextDue}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        nextDue: e.target.value,
                                        dueDay: Number(e.target.value.slice(-2)) || 1,
                                    })
                                }
                            />
                        </label>

                        <label>
                            Recurrence
                            <select
                                value={form.frequency}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        frequency: e.target.value as Frequency,
                                    })
                                }
                            >
                                <option>Monthly</option>
                                <option>Weekly</option>
                                <option>Yearly</option>
                                <option>One-time</option>
                            </select>
                        </label>

                        <label>
                            Number of occurrences
                            <input
                                type="number"
                                min="1"
                                value={form.remaining === null ? '' : form.remaining}
                                placeholder="Leave blank for unlimited"
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        remaining:
                                            e.target.value === ''
                                                ? null
                                                : Math.max(1, Number(e.target.value)),
                                    })
                                }
                            />
                            <small>
                                For example, 12 means 12 installments remaining. Blank means
                                ongoing.
                            </small>
                        </label>

                        <button
                            className="primary full"
                            disabled={
                                !form.name.trim() ||
                                !form.bank.trim() ||
                                form.amount <= 0 ||
                                !form.nextDue
                            }
                            onClick={saveForm}
                        >
                            {editing ? 'Save changes' : 'Add payment plan'}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

function EMIRow({
    e,
    onPay,
    onEdit,
    onDelete,
}: {
    e: EMI;
    onPay: () => void;
    onEdit: () => void;
    onDelete?: () => void;
}) {
    return (
        <article className="emi-row">
            <div className="round-icon">
                <CalendarDays size={18} />
            </div>

            <div className="row-main">
                <div className="title-line">
                    <b>{e.name}</b>
                    {!e.active && <span className="closed">Completed</span>}
                </div>

                <span>
                    {e.bank || 'Bank not set'} · Due {dateLabel(e.nextDue)}
                </span>

                <span className="subline">
                    {e.frequency} ·{' '}
                    {e.remaining === null
                        ? 'Unlimited occurrences'
                        : `${e.remaining} left`}
                </span>
            </div>

            <div className="amount-area">
                <strong>{money(e.amount)}</strong>

                {e.active && (
                    <button className="paid-btn" onClick={onPay}>
                        <Check size={14} /> Mark paid
                    </button>
                )}

                <div className="row-actions">
                    <button title="Edit EMI" onClick={onEdit}>
                        <Pencil size={14} />
                    </button>

                    {onDelete && (
                        <button title="Delete EMI" onClick={onDelete}>
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
