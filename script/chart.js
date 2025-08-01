// chart.js

(function () {
    // Deze styling blijft ongewijzigd.
    const style = document.createElement("style");
    style.textContent = `
      .chart-popup { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 800px; max-width: 90vw; height: 500px; max-height: 80vh; background-color: #f2f2f2; border-radius: 8px; z-index: 1000; display: flex; flex-direction: column; font-family: "Inter", sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      .chart-popup-header { padding: 16px 20px; cursor: move; background-color: #f2f2f2; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e0e0e0; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .chart-popup-title { font-weight: 600; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .chart-popup-close { cursor: pointer; border: none; background: none; font-size: 24px; font-weight: bold; color: #555; line-height: 1; }
      .chart-popup-close:hover { color: black; }
      .chart-popup-controls { padding: 12px 20px; display: flex; gap: 16px; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0; }
      .chart-popup-controls select { font-family: "Inter", sans-serif; padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; background-color: white; }
      .chart-popup-content { flex-grow: 1; padding: 20px; }`;
    document.head.appendChild(style);

    function removeExistingChartPopup() {
        const existing = document.querySelector(".chart-popup");
        if (existing) existing.remove();
    }

    window.renderChart = function (columnId, rowNode) {
        removeExistingChartPopup();
        const { data: productData } = rowNode;
        if (!productData?.offers?.length) return;

        // --- Stap 1: Bouw de UI efficiënt met een HTML template ---
        const popup = document.createElement("div");
        popup.className = "chart-popup";
        const sellers = [...new Map(productData.offers.map(o => [o.sellerId, o.sellerName])).entries()];
        popup.innerHTML = `
            <div class="chart-popup-header">
                <span class="chart-popup-title"></span>
                <button class="chart-popup-close">×</button>
            </div>
            <div class="chart-popup-controls">
                <select id="period-select">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
                <select id="seller-select">
                    <option value="all">All Sellers</option>
                    ${sellers.map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}
                </select>
            </div>
            <div class="chart-popup-content"></div>`;
        document.body.appendChild(popup);

        // --- Stap 2: Definieer UI elementen en variabelen ---
        const ui = {
            header: popup.querySelector('.chart-popup-header'),
            title: popup.querySelector('.chart-popup-title'),
            closeButton: popup.querySelector('.chart-popup-close'),
            periodSelect: popup.querySelector('#period-select'),
            sellerSelect: popup.querySelector('#seller-select'),
            chartContainer: popup.querySelector('.chart-popup-content'),
        };
        let chartInstance = null;
        
        // --- Stap 3: Definieer de update-functie die alles regelt ---
        const updateChart = () => {
            const selectedPeriod = ui.periodSelect.value;
            const selectedSellerId = ui.sellerSelect.value;

            // Logica voor het groeperen op periode (robuust en UTC-gebaseerd)
            const getPeriodKey = (utcTimestamp) => {
                const date = new Date(utcTimestamp);
                if (selectedPeriod === 'monthly') {
                    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
                }
                if (selectedPeriod === 'weekly') {
                    const day = date.getUTCDay(); // Zondag=0, Maandag=1
                    const offset = (day === 0) ? 6 : day - 1; // Bereken dagen terug tot maandag
                    const monday = new Date(date.getTime() - offset * 86400000);
                    return monday.toISOString().substring(0, 10);
                }
                return utcTimestamp.substring(0, 10); // Daily
            };

            // Filter en aggregeer de data
            const offers = selectedSellerId === 'all'
                ? productData.offers
                : productData.offers.filter(o => o.sellerId === selectedSellerId);
                
            const aggregatedMap = offers.reduce((map, offer) => {
                const key = getPeriodKey(offer.scrapeTimestamp);
                const entry = map.get(key) || { revenue: 0, unitsSold: 0, priceSum: 0, priceCount: 0, sellers: new Set() };
                entry.revenue += Number(offer.revenue) || 0;
                entry.unitsSold += Number(offer.unitsSold) || 0;
                entry.priceSum += Number(offer.price) || 0;
                entry.priceCount++;
                entry.sellers.add(offer.sellerId);
                return map.set(key, entry);
            }, new Map());

            // Mapping van kolomnaam naar berekening
            const valueMapping = {
                'revenue': d => d.revenue,
                'unitsSold': d => d.unitsSold,
                'avgWeightedPrice': d => d.priceCount ? d.priceSum / d.priceCount : 0,
                'sellerCount': d => d.sellers.size,
            };

            // Transformeer data naar het formaat dat de grafiek verwacht
            const chartData = [...aggregatedMap.entries()]
                .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                .map(([dateKey, values]) => ({
                    date: new Intl.DateTimeFormat('nl-NL', { timeZone: 'UTC' }).format(new Date(dateKey)),
                    value: Number((valueMapping[columnId](values) || 0).toFixed(2))
                }));
            
            // Stel grafiekopties samen
            const yAxisTitle = columnId.charAt(0).toUpperCase() + columnId.slice(1).replace(/([A-Z])/g, ' $1');
            ui.title.textContent = `${yAxisTitle} for: ${productData.productTitle}`;
            
            const chartOptions = {
                data: chartData,
                series: [{ type: "bar", xKey: "date", yKey: "value", yName: yAxisTitle }],
                axes: [
                    { type: "category", position: "bottom", title: { text: "Date" }, label: { rotation: -35, autoRotate: true } },
                    { type: "number", position: "left", title: { text: yAxisTitle } }
                ],
                legend: { enabled: false }
            };

            // Creëer de grafiek (1e keer) of werk hem bij (volgende keren)
            if (!chartInstance) {
                chartInstance = agCharts.AgCharts.create({ ...chartOptions, container: ui.chartContainer });
            } else {
                chartInstance.update(chartOptions);
            }
        };

        // --- Stap 4: Koppel events ---
        ui.periodSelect.addEventListener("change", updateChart);
        ui.sellerSelect.addEventListener("change", updateChart);
        ui.closeButton.addEventListener("click", () => popup.remove());

        let isDragging = false, offsetX, offsetY;
        ui.header.onmousedown = (e) => {
            isDragging = true;
            offsetX = e.clientX - popup.offsetLeft;
            offsetY = e.clientY - popup.offsetTop;
        };
        document.onmousemove = (e) => isDragging && (popup.style.left = `${e.clientX - offsetX}px`, popup.style.top = `${e.clientY - offsetY}px`);
        document.onmouseup = () => isDragging = false;

        updateChart(); // Roep de functie aan voor de eerste weergave.
    };
})();