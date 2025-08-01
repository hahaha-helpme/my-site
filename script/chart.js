// chart.js

(function () {
    // CSS wordt één keer gedefinieerd en toegevoegd voor een consistente styling.
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

    // De centrale, herbruikbare functie voor het renderen van grafieken.
    window.renderChart = function (columnId, rowNode) {
        removeExistingChartPopup();
        const { data: productData } = rowNode;
        if (!productData?.offers?.length) return;

        const popup = document.createElement("div");
        popup.className = "chart-popup";

        const sellers = [...new Map(productData.offers.map(o => [o.sellerId, o.sellerName])).entries()];
        const sellerOptions = sellers.map(([id, name]) => `<option value="${id}">${name}</option>`).join('');

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
                    ${sellerOptions}
                </select>
            </div>
            <div class="chart-popup-content" id="chart-container-${productData.productId}"></div>`;
        
        document.body.appendChild(popup);

        const ui = {
            header: popup.querySelector('.chart-popup-header'),
            title: popup.querySelector('.chart-popup-title'),
            closeButton: popup.querySelector('.chart-popup-close'),
            periodSelect: popup.querySelector('#period-select'),
            sellerSelect: popup.querySelector('#seller-select'),
            chartContainer: popup.querySelector('.chart-popup-content'),
        };

        let chartInstance = null;

        const updateChart = () => {
            const selectedPeriod = ui.periodSelect.value;
            const selectedSellerId = ui.sellerSelect.value;

            const filteredOffers = selectedSellerId === 'all'
                ? productData.offers
                : productData.offers.filter(o => o.sellerId === selectedSellerId);
            
            // --- CORRECTIE HIER: Robuuste en niet-muterende datumberekening ---
            const getPeriodKey = (timestamp) => {
                const d = new Date(timestamp);
                if (selectedPeriod === 'weekly') {
                    const dayOfWeek = d.getDay(); // Zondag=0, Maandag=1, ...
                    const dayOfMonth = d.getDate();
                    // Maak een *nieuwe* datum aan voor de berekening om mutatie te voorkomen
                    const weekStart = new Date(d);
                    // Zondag (0) wordt behandeld als dag 7 om de week op maandag te laten beginnen.
                    weekStart.setDate(dayOfMonth - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                    return weekStart.toISOString().split('T')[0];
                }
                if (selectedPeriod === 'monthly') {
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                }
                return d.toISOString().split('T')[0]; // Daily
            };

            const aggregated = [...filteredOffers.reduce((map, offer) => {
                const key = getPeriodKey(offer.scrapeTimestamp);
                const entry = map.get(key) || { revenue: 0, unitsSold: 0, priceSum: 0, priceCount: 0, sellers: new Set(), date: key };
                entry.revenue += Number(offer.revenue) || 0;
                entry.unitsSold += Number(offer.unitsSold) || 0;
                entry.priceSum += Number(offer.price) || 0;
                entry.priceCount++;
                entry.sellers.add(offer.sellerId);
                return map.set(key, entry);
            }, new Map()).values()].sort((a,b) => new Date(a.date) - new Date(b.date));

            const columnMapping = {
                'revenue': d => d.revenue,
                'unitsSold': d => d.unitsSold,
                'avgWeightedPrice': d => d.priceCount > 0 ? d.priceSum / d.priceCount : 0,
                'sellerCount': d => d.sellers.size,
            };
            const chartData = aggregated.map(d => ({
                date: new Date(d.date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                value: Number((columnMapping[columnId] || (() => 0))(d).toFixed(2))
            }));

            const yAxisTitle = columnId.charAt(0).toUpperCase() + columnId.slice(1).replace(/([A-Z])/g, ' $1');
            ui.title.textContent = `${yAxisTitle} for: ${productData.productTitle}`;
            console.log('chartData', chartData)
            const chartOptions = {
                data: chartData,
                series: [{ type: "bar", xKey: "date", yKey: "value", yName: yAxisTitle }],
                axes: [
                    { type: "category", position: "bottom", title: { text: "Date" }, label: { rotation: -35, autoRotate: true } },
                    { type: "number", position: "left", title: { text: yAxisTitle } }
                ],
                legend: { enabled: false },
                background: { fill: "#f2f2f2" },
            };
            
            if (!chartInstance) {
                chartOptions.container = ui.chartContainer;
                chartInstance = agCharts.AgCharts.create(chartOptions);
            } else {
                chartInstance.update(chartOptions);
            }
        };

        ui.periodSelect.addEventListener("change", updateChart);
        ui.sellerSelect.addEventListener("change", updateChart);
        ui.closeButton.addEventListener("click", () => popup.remove());

        let isDragging = false, offsetX, offsetY;
        ui.header.onmousedown = (e) => {
            isDragging = true;
            offsetX = e.clientX - popup.offsetLeft;
            offsetY = e.clientY - popup.offsetTop;
        };
        document.onmousemove = (e) => {
            if (!isDragging) return;
            popup.style.left = `${e.clientX - offsetX}px`;
            popup.style.top = `${e.clientY - offsetY}px`;
        };
        document.onmouseup = () => isDragging = false;

        updateChart(); // Eerste render
    };
})();