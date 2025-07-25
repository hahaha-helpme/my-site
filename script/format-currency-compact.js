// /* Beschikbare functionaliteit: formatEuroCompact(value) – compacte €-notatie (K/M) */
// (function () {
//   window.formatEuroCompact = function (value) {
//     if (value === null || value === undefined) return '';
//     const formatted = new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'EUR',
//       notation: 'compact',
//       compactDisplay: 'short',
//       minimumFractionDigits: value < 1000 ? 2 : 0,
//       maximumFractionDigits: value < 1000 ? 2 : 1
//     }).format(value);

//     return formatted.replace('.', ',');
//   };
// })();

(function () {
  const currencies = {
    sk: 'EUR',
    pl: 'PLN',
    de: 'EUR',
    at: 'EUR',
    cz: 'CZK'
  };

  window.formatCurrency = function (value, countryCode) {
    if (value == null) return '';
    const currency = currencies[countryCode] || 'EUR';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value).replace('.', ',');
  };
})();