// chart.js

(function () {
    // --- STAP 1: Robuuste, geïsoleerde dataverwerking ---
    const DataProcessor = {
        // Converteert een UTC-datum naar een ISO 8601 week string (bijv. "2025-W31")
        getISOWeekKey: (d) => {
            d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        },

        // Genereert een consistente, foutbestendige sleutel voor de gekozen periode.
        getPeriodKey: (timestamp, period) => {
            const d = new Date(timestamp);
            if (period === 'weekly') return DataProcessor.getISOWeekKey(d);
            if (period === 'monthly') return d.toISOString().substring(0, 7); // "YYYY-MM"
            return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
        },
        
        // Formatteert de sleutel naar een leesbaar label voor de grafiek-as.
        formatKey: (key, period) => {
            if (period === 'monthly') {
                const [year, month] = key.split('-');
                return new Date(Date.UTC(year, month - 1)).toLocaleDateString('nl-NL', { timeZone: 'UTC', month: 'long', year: 'numeric' });
            }
            if (period === 'weekly') {
                // Toont de week als "W31 2025" voor duidelijkheid
                const [year, week] = key.split('-W');
                return `W${week} ${year}`;
            }
            return new Date(key).toLocaleDateString('nl-NL', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
        },
        
        // De hoofd-functie die alle offers verwerkt en kant-en-klare grafiekdata teruggeeft.
        process: function({ offers, columnId, period, sellerId }) {
            const filteredOffers = sellerId === 'all'
                ? offers
                : offers.filter(o => o.sellerId === sellerId);

            const map = new Map();
            for (const offer of filteredOffers) {
                const key = this.getPeriodKey(offer.scrapeTimestamp, period);
                const entry = map.get(key) || { revenue: 0, unitsSold: 0, priceSum: 0, priceCount: 0, sellers: new Set() };
                
                entry.revenue += Number(offer.revenue) || 0;
                entry.unitsSold += Number(offer.unitsSold) || 0;
                entry.priceSum += Number(offer.price) || 0;
                entry.priceCount++;
                entry.sellers.add(offer.sellerId);
                
                map.set(key, entry);
            }

            const aggregated = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
            
            const columnMapping = {
                'revenue': d => d.revenue,
                'unitsSold': d => d.unitsSold,
                'avgWeightedPrice': d => d.priceCount > 0 ? d.priceSum / d.priceCount : 0,
                'sellerCount': d => d.sellers.size,
            };

            return aggregated.map(([key, data]) => ({
                date: this.formatKey(key, period),
                value: Number((columnMapping[columnId] || (() => 0))(data).toFixed(2))
            }));
        }
    };

    // --- STAP 2: De 'render' functie die de UI en de grafiek aanstuurt ---
    window.renderChart = function (columnId, rowNode) {
        document.querySelector(".chart-popup")?.remove(); // Verwijder een eventuele vorige popup
        
        const { data: productData } = rowNode;
        if (!productData?.offers?.length) return;

        // Bouw de popup-structuur met een efficiënte HTML-template.
        const popup = document.createElement("div");
        popup.className = "chart-popup";
        const sellerOptions = [...new Map(productData.offers.map(o => [o.sellerId, o.sellerName]))]
            .map(([id, name]) => `<option value="${id}">${name}</option>`).join('');

        popup.innerHTML = `
            <div class="chart-popup-header" style="cursor: move;">
                <span class="chart-popup-title"></span>
                <button class="chart-popup-close" style="cursor: pointer; border: none; background: none; font-size: 24px; font-weight: bold; color: #555; line-height: 1;">×</button>
            </div>
            <div class="chart-popup-controls" style="padding: 12px 20px; display: flex; gap: 16px; background-color: #f9f9f9; border-bottom: 1px solid #e0e0e0;">
                <select id="period-select" style="font-family: 'Inter', sans-serif; padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; background-color: white;">
                    <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
                <select id="seller-select" style="font-family: 'Inter', sans-serif; padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; background-color: white;">
                    <option value="all">All Sellers</option>${sellerOptions}
                </select>
            </div>
            <div class="chart-popup-content" style="flex-grow: 1; padding: 20px;"></div>`;
        document.body.appendChild(popup);

        // Referenties naar de UI-elementen.
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
            const chartData = DataProcessor.process({
                offers: productData.offers,
                columnId: columnId,
                period: ui.periodSelect.value,
                sellerId: ui.sellerSelect.value
            });
            
            const yAxisTitle = columnId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            ui.title.textContent = `${yAxisTitle} for: ${productData.productTitle}`;
            
            const chartOptions = {
                data: chartData,
                series: [{ type: "bar", xKey: "date", yKey: "value", yName: yAxisTitle }],
                axes: [
                    { type: "category", position: "bottom", title: { text: "Period" }, label: { rotation: -35, autoRotate: true } },
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

        // Event listeners en drag-functionaliteit.
        [ui.periodSelect, ui.sellerSelect].forEach(el => el.addEventListener("change", updateChart));
        ui.closeButton.addEventListener("click", () => popup.remove());

        let isDragging = false, pos = { top: 0, left: 0, x: 0, y: 0 };
        ui.header.onmousedown = (e) => {
            pos = { left: popup.offsetLeft, top: popup.offsetTop, x: e.clientX, y: e.clientY };
            isDragging = true;
        };
        document.onmousemove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - pos.x;
            const dy = e.clientY - pos.y;
            popup.style.left = `${pos.left + dx}px`;
            popup.style.top = `${pos.top + dy}px`;
        };
        document.onmouseup = () => isDragging = false;

        updateChart(); // Eerste render
    };
})();