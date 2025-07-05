/* Beschikbare functionaliteit: ImageRenderer (AG Grid cellRenderer voor afbeeldingen) */
(function () {
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