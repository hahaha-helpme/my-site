/* Beschikbare functionaliteit: ImageRenderer (AG Grid cellRenderer voor afbeeldingen) */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    /* Cel centreren */
    .ag-cell.image-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    /* Afbeelding schalen */
    .ag-cell.image-cell img {
      width: 35px;
      height: 35px;
      object-fit: contain;
    }
  `;
  document.head.appendChild(style);

  class ImageRenderer {
    init(params) {
      this.eGui = document.createElement('img');
      this.eGui.alt = params.value || 'Product Image';
      this.eGui.src = params.value;
    }
    getGui() { return this.eGui; }
    refresh(params) {
      this.eGui.alt = params.value || 'Product Image';
      this.eGui.src = params.value;
      return true;
    }
  }

  window.ImageRenderer = ImageRenderer;
})();