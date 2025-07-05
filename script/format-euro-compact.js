/* Beschikbare functionaliteit: formatEuroCompact(value) – compacte €-notatie (K/M) */
(function () {
  window.formatEuroCompact = function (value) {
    if (value === null || value === undefined) return '';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: value < 1000 ? 2 : 0,
      maximumFractionDigits: value < 1000 ? 2 : 1
    }).format(value);

    return formatted.replace('.', ',');
  };
})();