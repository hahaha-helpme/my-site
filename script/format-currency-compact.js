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