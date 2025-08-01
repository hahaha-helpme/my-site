// chart.js

(function () {
    // CSS wordt één keer gedefinieerd en toegevoegd voor een consistente styling.
    const style = document.createElement("style");
    style.textContent = `
      .chart-popup { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 800px; max-width: 90vw; height: 500px; max-height: 80vh; background-color: #f2f2f2; border-radius: 8px; z-index: 1000; display: flex; flex-direction: column; font-family: "Inter", sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      .chart-popup-header { padding: 16px 20px; cursor: move; background-color: #f2f2f2; display: flex; justify-content: space-between; align-items: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .chart-popup-title { font-weight: 600; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .chart-popup-close { cursor: pointer; border: none; background: none; font-size: 24px; font-weight: bold; color: #555; line-height: 1; }
      .chart-popup-close:hover { color: black; }
      .chart-popup-controls { padding: 5px 20px; display: flex; gap: 16px; background-color: #f2f2f2; }
      .chart-popup-controls select { font-family: "Inter", sans-serif; padding: 6px 10px; border-radius: 4px; background-color: white; border: 0px;}
      .chart-popup-content { flex-grow: 1; padding: 10px 20px 20px 20px; }`;
    document.head.appendChild(style);

    function removeExistingChartPopup() {
        const existing = document.querySelector(".chart-popup");
        if (existing) existing.remove();
    }

    // De centrale, herbruikbare functie voor het renderen van grafieken.
    window.renderChart = function (columnId, rowNode) {
        removeExistingChartPopup();
        const { data: productData } = rowNode;
        if (!productData?.offers?.length) return; // Vroege return als er geen data is

        // --- Stap 1: Bouw de popup-structuur efficiënt met een template ---
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

        // --- Stap 2: Verkrijg referenties naar de interactieve elementen ---
        const ui = {
            header: popup.querySelector('.chart-popup-header'),
            title: popup.querySelector('.chart-popup-title'),
            closeButton: popup.querySelector('.chart-popup-close'),
            periodSelect: popup.querySelector('#period-select'),
            sellerSelect: popup.querySelector('#seller-select'),
            chartContainer: popup.querySelector('.chart-popup-content'),
        };

        let chartInstance = null;

        // --- Stap 3: Definieer de update-logica die data verwerkt en de grafiek bijwerkt ---
        const updateChart = () => {
            const selectedPeriod = ui.periodSelect.value;
            const selectedSellerId = ui.sellerSelect.value;

            // Dataverwerking: filteren en aggregeren
            const filteredOffers = selectedSellerId === 'all'
                ? productData.offers
                : productData.offers.filter(o => o.sellerId === selectedSellerId);

            const getPeriodKey = (timestamp) => {
                const d = new Date(timestamp);
                if (selectedPeriod === 'weekly') {
                    // --- START VAN DE CORRECTIE ---
                    // Maak een kopie van de datum om de originele 'd' niet te wijzigen.
                    const tempDate = new Date(d);
                    const day = tempDate.getDay(); // Zondag = 0, Maandag = 1, etc.
                    // Bereken het verschil naar de voorgaande maandag.
                    // Als het zondag is (dag 0), ga 6 dagen terug. Anders, ga (dag - 1) dagen terug.
                    const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
                    const weekStart = new Date(tempDate.setDate(diff));
                    
                    return weekStart.toISOString().split('T')[0];
                    // --- EINDE VAN DE CORRECTIE ---
                }
                if (selectedPeriod === 'monthly') {
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                }
                return d.toISOString().split('T')[0]; // Daily
            };

            // --- START VAN DE AANPASSING ---
            const aggregated = [...filteredOffers.reduce((map, offer) => {
                const key = getPeriodKey(offer.scrapeTimestamp);
                const entry = map.get(key) || { 
                    revenue: 0, unitsSold: 0, priceSum: 0, sellers: new Set(), date: key,
                    deliveryRateSum: 0, stockLeftSum: 0, deliveryTimeMinSum: 0,
                    deliveryTimeMaxSum: 0, buyBoxCount: 0, offerCount: 0 
                };
                
                entry.revenue += Number(offer.revenue) || 0;
                entry.unitsSold += Number(offer.unitsSold) || 0;
                entry.priceSum += Number(offer.price) || 0;
                entry.sellers.add(offer.sellerId);

                // Aggregeer de nieuwe velden
                entry.deliveryRateSum += Number(offer.deliveryRate) || 0;
                entry.stockLeftSum += Number(offer.stockLeft) || 0;
                entry.deliveryTimeMinSum += Number(offer.deliveryTimeRangeDaysMin) || 0;
                entry.deliveryTimeMaxSum += Number(offer.deliveryTimeRangeDaysMax) || 0;
                if (offer.buyBox) {
                    entry.buyBoxCount++;
                }
                entry.offerCount++; // Belangrijk voor het berekenen van gemiddeldes
                
                return map.set(key, entry);
            }, new Map()).values()].sort((a,b) => new Date(a.date) - new Date(b.date));


            // Mapping naar grafiekdata op basis van gekozen kolom
            const columnMapping = {
                'revenue': d => d.revenue,
                'unitsSold': d => d.unitsSold,
                'avgWeightedPrice': d => d.offerCount > 0 ? d.priceSum / d.offerCount : 0,
                'sellerCount': d => d.sellers.size,
                // Nieuwe mappings voor de toegevoegde velden
                'deliveryRate': d => d.offerCount > 0 ? d.deliveryRateSum / d.offerCount : 0,
                'stockLeft': d => d.offerCount > 0 ? d.stockLeftSum / d.offerCount : 0, // Gemiddelde voorraad
                'deliveryTimeMin': d => d.offerCount > 0 ? d.deliveryTimeMinSum / d.offerCount : 0, // Gem. min. levertijd
                'deliveryTimeMax': d => d.offerCount > 0 ? d.deliveryTimeMaxSum / d.offerCount : 0, // Gem. max. levertijd
                'buyBox': d => d.buyBoxCount, // Totaal aantal Buy Box wins in de periode
            };
            // --- EINDE VAN DE AANPASSING ---

            const chartData = aggregated.map(d => ({
                date: new Date(d.date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                value: Number((columnMapping[columnId] || (() => 0))(d).toFixed(2))
            }));

            // Grafiekopties voorbereiden
            const yAxisTitle = columnId.charAt(0).toUpperCase() + columnId.slice(1).replace(/([A-Z])/g, ' $1');
            ui.title.textContent = `${yAxisTitle} for: ${productData.productTitle}`;
            
            const chartOptions = {
                data: chartData,
                series: [{ type: "bar", xKey: "date", yKey: "value", yName: yAxisTitle }],
                axes: [
                    { type: "category", position: "bottom", title: { text: "Date" } },
                    { type: "number", position: "left", title: { text: yAxisTitle } }
                ],
                legend: { enabled: false },
                background: { fill: "#f2f2f2" },
            };
            
            // --- Stap 4: Creëer de grafiek (indien nodig) of werk hem bij ---
            if (!chartInstance) {
                chartOptions.container = ui.chartContainer;
                chartInstance = agCharts.AgCharts.create(chartOptions);
            } else {
                chartInstance.update(chartOptions);
            }
        };

        // --- Stap 5: Voeg event listeners en drag-functionaliteit toe ---
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