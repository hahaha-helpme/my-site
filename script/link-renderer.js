/* Beschikbare functionaliteit: LinkRenderer (AG Grid cellRenderer voor hyperlinks) */
(function () {
  class LinkRenderer {
    init(params) {
      this.eGui = document.createElement('a');
      this.eGui.href = params.value;
      this.eGui.textContent = params.value ? params.value.split('/')[2] : 'link';
      this.eGui.target = '_blank';
    }
    getGui() { return this.eGui; }
    refresh(params) {
      this.eGui.href = params.value;
      this.eGui.textContent = params.value ? params.value.split('/')[2] : '';
      return true;
    }
  }

  // Globaal beschikbaar maken
  window.LinkRenderer = LinkRenderer;
})();