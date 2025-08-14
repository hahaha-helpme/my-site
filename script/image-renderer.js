/* Beschikbare functionaliteit: ImageRenderer (AG Grid cellRenderer voor afbeeldingen) */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    // /* Cel centreren */
    // .ag-cell.image-cell {
    //   display: flex;
    //   align-items: center;
    //   justify-content: center;
    //   height: 100%;
    // }
    // /* Afbeelding schalen */
    // .ag-cell.image-cell img {
    //   width: 35px;
    //   height: 35px;
    //   object-fit: contain;
    // }

// g-cell.image-cell {
//   display: flex;
//   align-items: center;
//   height: 100%;
// }


// .ag-cell.image-cell img {
//   width: 35px;
//   height: 35px;
//   object-fit: contain; 
// }

/* Targeting de specifieke image-cell class */
.ag-cell.image-cell {
    display: flex !important;
    justify-content: center;
    align-items: center;
}

.ag-cell.image-cell .ag-cell-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.ag-cell.image-cell .ag-cell-value {
    display: flex;
    justify-content: center;
    align-items: center;
}

.ag-cell.image-cell img {
    width: 35px;
    height: 35px;
    object-fit: cover;
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