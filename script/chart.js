// chart.js

(function () {
  // Voeg chart-style toe

  const style = document.createElement("style");
  style.textContent = `
    .chart-popup {
      position: absolute;
      top: 150px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 400px;
      background-color: #f2f2f2;
      border-radius: 8px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      font-family: "Inter", sans-serif;
    }
    .chart-popup-header {
      padding: 20px 20px 0px 20px;
      cursor: move;
      background-color: #f2f2f2;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      font-weight: 500;
      font-family: "Inter", sans-serif;
    }
    .chart-popup-title {
      font-weight: bold;
    }
    .chart-popup-close {
      cursor: pointer;
      border: none;
      background: none;
      font-size: 20px;
      font-weight: bold;
      color: #555;
    }
    .chart-popup-close:hover {
      color: black;
    }
    .chart-popup-content {
      flex-grow: 1;
      padding: 0px 20px 20px 20px;
    }
  `;
  document.head.appendChild(style);

  // Functies
  function removeExistingChartPopup() {
    const existing = document.querySelector(".chart-popup");
    if (existing) existing.remove();
  }

  window.showStockChart = function (offersData, rowNode) {
    removeExistingChartPopup();

    const popup = document.createElement("div");
    popup.className = "chart-popup";

    const header = document.createElement("div");
    header.className = "chart-popup-header";

    const title = document.createElement("span");
    title.className = "chart-popup-title";
    title.textContent = `Voorraad voor: ${rowNode.data.make} ${rowNode.data.model}`;

    const closeButton = document.createElement("button");
    closeButton.className = "chart-popup-close";
    closeButton.innerHTML = "×";

    header.appendChild(title);
    header.appendChild(closeButton);

    const content = document.createElement("div");
    content.className = "chart-popup-content";
    const chartContainerId = "dynamic-chart-container";
    content.id = chartContainerId;

    popup.appendChild(header);
    popup.appendChild(content);
    document.body.appendChild(popup);

    const decodedOffers = offersData || [];
    const chartData = decodedOffers.map((offer) => ({
      day: offer.scrapeTimestamp?.slice(0, 10),
      stock: Number(offer.stockLeft) || 0,
    }));

    const chartOptions = {
      container: document.getElementById(chartContainerId),
      data: chartData,
      background: { fill: "#f2f2f2" },
      title: { text: "", fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: "500", spacing: 0 },
      subtitle: { text: "", spacing: 0 },
      fontFamily: "Inter, sans-serif",
      series: [{ type: "bar", xKey: "day", yKey: "stock", xName: "Datum", yName: "Voorraad" }],
      axes: [
        { type: "category", position: "bottom", title: { text: "Week", spacing: 10 } },
        { type: "number", position: "left", title: { text: "Totale Voorraad", spacing: 10 }, min: 0 }
      ],
      padding: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    agCharts.AgCharts.create(chartOptions);

    // Drag functionaliteit
    let isDragging = false, offsetX, offsetY;
    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - popup.offsetLeft;
      offsetY = e.clientY - popup.offsetTop;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      popup.style.left = `${e.clientX - offsetX}px`;
      popup.style.top = `${e.clientY - offsetY}px`;
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
    closeButton.addEventListener("click", () => popup.remove());
  };
})();