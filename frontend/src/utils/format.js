export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const fmtMoney = (n) => (n != null && n !== '' ? Number(n).toLocaleString('vi-VN') : '—');

export const fmtCurrency = (n) => `${Number(n).toLocaleString('vi-VN')} đ`;

export const fmtMoneyShort = (n) => {
  const m = Number(n) / 1_000_000;
  return m >= 1
    ? `${m.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`
    : `${Number(n).toLocaleString('vi-VN')}`;
};
