// /* Beschikbare functionaliteit: formatEuro(value) – €-notatie met twee decimalen */
// (function () {
//   window.formatEuro = function (value) {
//     if (value === null || value === undefined) return '';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'EUR',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(value).replace('.', ',');
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

  window.formatCurrencyCompact = function (value, countryCode) {
    if (value == null) return '';
    const currency = currencies[countryCode] || 'EUR';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: value < 1000 ? 2 : 0,
      maximumFractionDigits: value < 1000 ? 2 : 1
    }).format(value);
    return formatted.replace('.', ',');
  };
})();