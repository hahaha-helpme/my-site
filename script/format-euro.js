/* Beschikbare functionaliteit: formatEuro(value) – €-notatie met twee decimalen */
(function () {
  window.formatEuro = function (value) {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value).replace('.', ',');
  };
})();