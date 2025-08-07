/* Beschikbare functionaliteit: ImageRenderer (AG Grid cellRenderer voor afbeeldingen) */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    /*
      De meest robuuste methode om de inhoud van een cel te centreren.
      'display: grid' maakt een grid-container van de cel.
      'place-items: center' is een afkorting die zowel horizontaal als verticaal centreert.
      '!important' is nodig om de standaard AG Grid-themastijlen te overschrijven.
    */
    .ag-cell.image-cell {
      display: grid !important;
      place-items: center !important;
      /* padding: 0 !important; <-- Voeg eventueel toe als er nog steeds een afwijking is */
    }

    /* Afbeelding schalen (deze regel blijft ongewijzigd) */
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

      this.eGui.onerror = () => {
        this.eGui.style.display = 'none';
      };
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