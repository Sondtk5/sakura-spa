import { useState, useMemo } from 'react';
import { invoices as allInvoices, customers, products, services } from '../data/site';
import type { Invoice, InvoiceItem } from '../data/site';
import { generateId, formatCurrency, formatDate, formatDateTime } from '../components/Shared';
import { ArrowLeftRight, Search, X, FileText, Check, AlertTriangle, Receipt } from 'lucide-react';

interface ReturnInvoice {
  id: string;
  returnNo: string;
  originalInvoiceId: string;
  originalInvoiceNo: string;
  customerId: string;
  customerName: string;
  date: string;
  reason: string;
  items: { type: 'service' | 'product'; id: string; name: string; quantity: number; unitPrice: number; refundAmount: number }[];
  totalRefund: number;
  type: 'refund' | 'exchange';
}

// Load returns from localStorage
const STORAGE_KEY = 'sakura_spa_returns_v1';
function loadReturns(): ReturnInvoice[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return [];
}
function saveReturns(r: ReturnInvoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
}

export function Returns() {
  const [returnList, setReturnList] = useState<ReturnInvoice[]>(() => loadReturns());
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  // Create form
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [invSearch, setInvSearch] = useState('');
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [reason, setReason] = useState('');
  const [returnItems, setReturnItems] = useState<{ idx: number; type: 'service' | 'product'; id: string; name: string; unitPrice: number; maxQty: number; qty: number }[]>([]);

  const filteredInvoices = useMemo(() => {
    const q = invSearch.toLowerCase();
    return allInvoices.filter(inv =>
      inv.status === 'completed' &&
      (inv.invoiceNo.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [invSearch]);

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv.id);
    setInvSearch(`${inv.invoiceNo} - ${inv.customerName}`);
    // Pre-fill items from invoice
    const items = inv.items.map((it, idx) => ({
      idx,
      type: it.type,
      id: it.id,
      name: it.name,
      unitPrice: it.unitPrice,
      maxQty: it.quantity,
      qty: 1,
    }));
    setReturnItems(items);
  };

  const handleCreateReturn = () => {
    if (!selectedInvoice || !reason.trim()) return;
    const inv = allInvoices.find(i => i.id === selectedInvoice);
    if (!inv) return;

    const selectedReturnItems = returnItems.filter(it => it.qty > 0);
    if (selectedReturnItems.length === 0) return;

    const totalRefund = selectedReturnItems.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const newReturn: ReturnInvoice = {
      id: generateId(),
      returnNo: `DT-${Date.now().toString().slice(-6)}`,
      originalInvoiceId: inv.id,
      originalInvoiceNo: inv.invoiceNo,
      customerId: inv.customerId,
      customerName: inv.customerName,
      date: new Date().toISOString(),
      reason: reason.trim(),
      items: selectedReturnItems.map(it => ({
        type: it.type,
        id: it.id,
        name: it.name,
        quantity: it.qty,
        unitPrice: it.unitPrice,
        refundAmount: it.unitPrice * it.qty,
      })),
      totalRefund,
      type: returnType,
    };

    const updated = [newReturn, ...returnList];
    setReturnList(updated);
    saveReturns(updated);
    setShowCreate(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedInvoice('');
    setInvSearch('');
    setReturnType('refund');
    setReason('');
    setReturnItems([]);
  };

  const filteredReturns = useMemo(() => {
    const q = search.toLowerCase();
    return returnList.filter(r =>
      r.returnNo.toLowerCase().includes(q) ||
      r.originalInvoiceNo.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q)
    );
  }, [search, returnList]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-gold-400" /> Đổi trả
          </h1>
          <p className="text-white/50 text-sm mt-1">Quản lý hoàn tiền và trao đổi hàng</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20"
        >
          <FileText className="w-4 h-4" /> Tạo biên bản đổi trả
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo mã đổi trả, số hóa đơn, khách hàng..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
        />
      </div>

      {filteredReturns.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Chưa có phiếu đổi trả nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReturns.map(r => (
            <div key={r.id} className="bg-sakura-card rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">{r.returnNo}</span>
                  <span className="text-xs text-white/40">{formatDateTime(r.date)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.type === 'refund' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {r.type === 'refund' ? 'Hoàn tiền' : 'Trao đổi'}
                  </span>
                </div>
                <span className="text-gold-400 font-semibold">{formatCurrency(r.totalRefund)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/60 mb-2">
                <span>HĐ gốc: <span className="text-white/80">{r.originalInvoiceNo}</span></span>
                <span>KH: <span className="text-white/80">{r.customerName}</span></span>
              </div>
              <div className="text-xs text-white/40">Lý do: {r.reason}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.items.map((it, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-lg text-xs text-white/60">
                    {it.name} x{it.quantity} - {formatCurrency(it.refundAmount)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Return Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="bg-gradient-to-br from-[#2d1b2e] to-[#3d1f2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white font-serif">Tạo biên bản đổi trả</h3>
              <button onClick={() => setShowCreate(false)} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Select original invoice */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Chọn hóa đơn gốc *</label>
                <input
                  type="text"
                  value={invSearch}
                  onChange={e => { setInvSearch(e.target.value); setSelectedInvoice(''); }}
                  placeholder="Tìm theo số hóa đơn, tên khách..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50"
                />
                {invSearch && !selectedInvoice && (
                  <div className="mt-1 bg-[#2d1b2e] border border-white/10 rounded-xl overflow-hidden">
                    {filteredInvoices.map(inv => (
                      <button
                        key={inv.id}
                        onClick={() => handleSelectInvoice(inv)}
                        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 transition"
                      >
                        <span>{inv.invoiceNo} - {inv.customerName}</span>
                        <span className="text-gold-400 text-xs">{formatCurrency(inv.total)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Loại</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReturnType('refund')}
                    className={`px-4 py-2 rounded-xl text-sm transition ${returnType === 'refund' ? 'bg-rose-500/30 text-rose-200 border border-rose-500/30' : 'bg-white/5 text-white/60 border border-white/10'}`}
                  >
                    Hoàn tiền
                  </button>
                  <button
                    onClick={() => setReturnType('exchange')}
                    className={`px-4 py-2 rounded-xl text-sm transition ${returnType === 'exchange' ? 'bg-blue-500/30 text-blue-200 border border-blue-500/30' : 'bg-white/5 text-white/60 border border-white/10'}`}
                  >
                    Trao đổi
                  </button>
                </div>
              </div>

              {/* Items from selected invoice */}
              {selectedInvoice && returnItems.length > 0 && (
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Chọn sản phẩm/dịch vụ cần trả lại</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {returnItems.map((it, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">{it.name}</div>
                          <div className="text-xs text-white/40">{formatCurrency(it.unitPrice)} x {it.maxQty}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/50">SL:</span>
                          <input
                            type="number"
                            min={0}
                            max={it.maxQty}
                            value={it.qty}
                            onChange={e => {
                              const val = Math.min(it.maxQty, Math.max(0, parseInt(e.target.value) || 0));
                              setReturnItems(prev => prev.map((x, idx) => idx === i ? { ...x, qty: val } : x));
                            }}
                            className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs text-center focus:outline-none focus:border-sakura-400/50"
                          />
                          <span className="text-xs text-gold-400 w-16 text-right">
                            {formatCurrency(it.unitPrice * it.qty)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-right text-sm text-gold-400 font-semibold mt-2">
                    Tổng hoàn: {formatCurrency(returnItems.reduce((s, it) => s + it.unitPrice * it.qty, 0))}
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Lý do đổi trả *</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Nhập lý do đổi trả..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-sakura-400/50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateReturn}
                  disabled={!selectedInvoice || !reason.trim() || returnItems.every(it => it.qty === 0)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sakura-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-sakura-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Xác nhận tạo
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}