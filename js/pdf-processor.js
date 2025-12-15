/**
 * PDF Processor - Processes PDF pairs: Document A full on left, left 50% of Document B on right
 * Page 1 of both documents stays at original size within their respective halves
 * Now includes ZIP download functionality
 */

// ========== CONFIGURATION CONSTANTS ==========
const Config = {
  // Page dimensions (A4 at 300 DPI)
  DPI: 300,
  A4_LANDSCAPE_WIDTH: 3508, // A4 width at 300 DPI
  A4_LANDSCAPE_HEIGHT: 2480, // A4 height at 300 DPI

  // Page 2 cropping - ONLY TOP CROP
  CROP_TOP_PERCENT: 0.2, // Keep top 20% (crop from the bottom)

  // Page 2 scaling
  PAGE2_SCALE_FACTOR: 0.5, // Scale to 50% (smaller for bottom placement)

  // Page 2 positioning - BOTTOM LEFT CORNER
  PAGE2_BOTTOM_MARGIN: 50, // Margin from bottom edge
  PAGE2_LEFT_MARGIN: 50, // Margin from left edge

  // Expected number of pages per input PDF
  EXPECTED_PAGES_COUNT: 2,

  // Output filename patterns
  PAIR_PREFIX: "pair",
  SINGLE_PREFIX: "single",

  // Image quality for PDF generation
  IMAGE_QUALITY: 1.0,
  IMAGE_FORMAT: "png",
};

class PDFProcessor {
  constructor() {
    this.processedFiles = new Map();
    this.isProcessing = false;

    // Initialize PDF.js worker
    if (typeof pdfjsLib !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  }

  clearMemory() {
    // Clear processed files map
    this.processedFiles.clear();

    // Help garbage collector by removing canvas references
    const tempCanvases = document.querySelectorAll("canvas.temp-canvas");
    tempCanvases.forEach((canvas) => {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    });

    // Clear any blob URLs that might still be around
    if (window.pdfBlobUrls) {
      window.pdfBlobUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore errors
        }
      });
      window.pdfBlobUrls = [];
    }
  }

  async checkDependencies() {
    const errors = [];

    if (typeof pdfjsLib === "undefined") {
      errors.push("PDF.js library not loaded");
    }

    if (typeof window.jspdf === "undefined") {
      errors.push("jsPDF library not loaded");
    }

    if (errors.length > 0) {
      throw new Error(
        `Missing dependencies: ${errors.join(", ")}. Please refresh the page.`
      );
    }
  }

  /**
   * Load a PDF file and convert its pages to canvas images
   */
  async loadPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      if (pdf.numPages !== Config.EXPECTED_PAGES_COUNT) {
        throw new Error(
          `Se esperaban ${Config.EXPECTED_PAGES_COUNT} páginas, se encontraron ${pdf.numPages}`
        );
      }

      const pages = [];

      // Render each page to canvas
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // Calculate scale to match 300 DPI
        const viewport = page.getViewport({ scale: Config.DPI / 72 });

        // Create canvas for rendering
        const canvas = document.createElement("canvas");
        canvas.className = "temp-canvas"; // ADDED FOR MEMORY CLEANUP
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        pages.push(canvas);
      }

      return pages;
    } catch (error) {
      console.error(`Error al cargar el PDF ${file.name}:`, error);
      throw error;
    }
  }

  /**
   * Crop the top portion of page 2
   */
  cropPage2TopOnly(canvas) {
    const ctx = canvas.getContext("2d");
    const cropHeight = Math.floor(canvas.height * Config.CROP_TOP_PERCENT);

    // Get image data for the top portion
    const imageData = ctx.getImageData(0, 0, canvas.width, cropHeight);

    // Create new canvas with cropped dimensions
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.className = "temp-canvas"; // ADDED FOR MEMORY CLEANUP
    croppedCanvas.width = canvas.width;
    croppedCanvas.height = cropHeight;
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.putImageData(imageData, 0, 0);

    return croppedCanvas;
  }

  /**
   * Resize page 2 for bottom left placement
   */
  resizePage2(canvas) {
    const availableWidth = Config.A4_LANDSCAPE_WIDTH / 2;
    const availableHeight = Config.A4_LANDSCAPE_HEIGHT / 3;

    const maxWidth = availableWidth * Config.PAGE2_SCALE_FACTOR;
    const maxHeight = availableHeight * Config.PAGE2_SCALE_FACTOR;

    const originalRatio = canvas.width / canvas.height;

    let newWidth, newHeight;

    if (originalRatio > maxWidth / maxHeight) {
      // Width is the limiting factor
      newWidth = maxWidth;
      newHeight = newWidth / originalRatio;
    } else {
      // Height is the limiting factor
      newHeight = maxHeight;
      newWidth = newHeight * originalRatio;
    }

    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);

    // Create resized canvas
    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.className = "temp-canvas"; // ADDED FOR MEMORY CLEANUP
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    const resizedCtx = resizedCanvas.getContext("2d");

    resizedCtx.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      newWidth,
      newHeight
    );

    return resizedCanvas;
  }

  /**
   * Process page 2 (crop and resize)
   */
  processPage2(canvas) {
    // Step 1: Crop only the top portion
    const cropped = this.cropPage2TopOnly(canvas);

    // Step 2: Resize
    return this.resizePage2(cropped);
  }

  /**
   * Calculate position for page 2 at bottom left
   */
  calculatePage2Position(page2Canvas) {
    const x = Config.PAGE2_LEFT_MARGIN;
    const y =
      Config.A4_LANDSCAPE_HEIGHT -
      page2Canvas.height -
      Config.PAGE2_BOTTOM_MARGIN;
    return { x, y };
  }

  /**
   * Create individual layout for a PDF
   */
  async createIndividualLayout(pdfPages) {
    try {
      // Check for exactly 2 pages
      if (pdfPages.length !== Config.EXPECTED_PAGES_COUNT) {
        throw new Error(
          `Se esperaban ${Config.EXPECTED_PAGES_COUNT} páginas, se encontraron ${pdfPages.length}`
        );
      }

      // Create A4 landscape canvas
      const canvas = document.createElement("canvas");
      canvas.className = "temp-canvas"; // ADDED FOR MEMORY CLEANUP
      canvas.width = Config.A4_LANDSCAPE_WIDTH;
      canvas.height = Config.A4_LANDSCAPE_HEIGHT;
      const ctx = canvas.getContext("2d");

      // Fill with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // PAGE 1 - Paste as-is
      ctx.drawImage(pdfPages[0], 0, 0);

      // Process and place page 2 at bottom left
      const page2Processed = this.processPage2(pdfPages[1]);
      const { x, y } = this.calculatePage2Position(page2Processed);
      ctx.drawImage(page2Processed, x, y);

      return canvas;
    } catch (error) {
      console.error("Error al crear el diseño individual:", error);
      throw error;
    }
  }

  /**
   * Process PDF pair - FIXED VERSION: Uses jsPDF for PDF generation
   */
  async processPDFPair(pdfAFile, pdfBFile) {
    try {
      const pdfAPages = await this.loadPDF(pdfAFile);
      const pdfBPages = await this.loadPDF(pdfBFile);

      const docAImage = await this.createIndividualLayout(pdfAPages);
      const docBImage = await this.createIndividualLayout(pdfBPages);

      // Create final A4 landscape canvas
      const finalCanvas = document.createElement("canvas");
      finalCanvas.className = "temp-canvas"; // ADDED FOR MEMORY CLEANUP
      finalCanvas.width = Config.A4_LANDSCAPE_WIDTH;
      finalCanvas.height = Config.A4_LANDSCAPE_HEIGHT;
      const finalCtx = finalCanvas.getContext("2d");

      // Fill with white background
      finalCtx.fillStyle = "white";
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Document A: Paste FULL on LEFT side
      finalCtx.drawImage(docAImage, 0, 0);

      // Document B: Take only LEFT 50% and paste on RIGHT side
      const halfWidth = Config.A4_LANDSCAPE_WIDTH / 2;

      // Create temp canvas for left half of Document B
      const tempCanvas = document.createElement("canvas");
      tempCanvas.className = "temp-canvas"; // ADDED FOR MEMORY CLEANUP
      tempCanvas.width = halfWidth;
      tempCanvas.height = Config.A4_LANDSCAPE_HEIGHT;
      const tempCtx = tempCanvas.getContext("2d");

      // Draw left half of Document B
      tempCtx.drawImage(
        docBImage,
        0,
        0,
        halfWidth,
        Config.A4_LANDSCAPE_HEIGHT,
        0,
        0,
        halfWidth,
        Config.A4_LANDSCAPE_HEIGHT
      );

      // Paste the left half of Document B on the right side
      finalCtx.drawImage(tempCanvas, halfWidth, 0);

      // FIXED: Generate PDF using jsPDF instead of canvas.toBlob()
      if (typeof window.jspdf === "undefined") {
        throw new Error(
          "jsPDF library not loaded. Please include it in your HTML."
        );
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [Config.A4_LANDSCAPE_WIDTH, Config.A4_LANDSCAPE_HEIGHT],
        compress: true,
      });

      const imgData = finalCanvas.toDataURL("image/png");
      pdf.addImage(
        imgData,
        Config.IMAGE_FORMAT.toUpperCase(),
        0,
        0,
        Config.A4_LANDSCAPE_WIDTH,
        Config.A4_LANDSCAPE_HEIGHT
      );

      // Return PDF blob
      return pdf.output("blob");
    } catch (error) {
      console.error("Error al procesar el par de PDFs:", error);
      throw error;
    }
  }

  /**
   * Process single PDF - FIXED VERSION: Uses jsPDF for PDF generation
   */
  async processSinglePDF(pdfFile) {
    try {
      const pdfPages = await this.loadPDF(pdfFile);
      const singleImage = await this.createIndividualLayout(pdfPages);

      // FIXED: Generate PDF using jsPDF instead of canvas.toBlob()
      if (typeof window.jspdf === "undefined") {
        throw new Error(
          "jsPDF library not loaded. Please include it in your HTML."
        );
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [Config.A4_LANDSCAPE_WIDTH, Config.A4_LANDSCAPE_HEIGHT],
        compress: true,
      });

      const imgData = singleImage.toDataURL("image/png");
      pdf.addImage(
        imgData,
        Config.IMAGE_FORMAT.toUpperCase(),
        0,
        0,
        Config.A4_LANDSCAPE_WIDTH,
        Config.A4_LANDSCAPE_HEIGHT
      );

      // Return PDF blob
      return pdf.output("blob");
    } catch (error) {
      console.error("Error al procesar el PDF individual:", error);
      throw error;
    }
  }

  /**
   * Process all files based on mode
   */
  async processFiles(files, mode) {
    await this.checkDependencies();
    if (this.isProcessing) {
      throw new Error("Ya se están procesando archivos");
    }

    this.isProcessing = true;
    const results = [];

    try {
      if (mode === "pairs") {
        // Process in pairs
        for (let i = 0; i < files.length; i += 2) {
          if (i + 1 < files.length) {
            // Update progress
            const progress = (i / files.length) * 100;
            this.updateProgress(progress);
            this.updateStatus(
              `Procesando par ${Math.floor(i / 2) + 1} de ${Math.ceil(
                files.length / 2
              )}...`,
              "processing"
            );

            const pdfA = files[i];
            const pdfB = files[i + 1];

            try {
              const blob = await this.processPDFPair(pdfA, pdfB);
              const timestamp = Date.now();
              const pairNumber = Math.floor(i / 2) + 1;
              const filename = `${Config.PAIR_PREFIX}_${pairNumber
                .toString()
                .padStart(2, "0")}_${timestamp}.pdf`;

              results.push({
                filename: filename,
                blob: blob,
                files: [pdfA.name, pdfB.name],
                type: "pair",
                pairNumber: pairNumber,
                size: blob.size,
              });
            } catch (error) {
              console.error(
                `Error al procesar el par ${Math.floor(i / 2) + 1}:`,
                error
              );
              this.updateStatus(
                `Error al procesar el par ${Math.floor(i / 2) + 1}: ${
                  error.message
                }`,
                "error"
              );
            }
          } else {
            // Single leftover file
            const progress = (i / files.length) * 100;
            this.updateProgress(progress);
            this.updateStatus(`Procesando archivo restante...`, "processing");

            const pdf = files[i];
            try {
              const blob = await this.processSinglePDF(pdf);
              const timestamp = Date.now();
              const filename = `${Config.SINGLE_PREFIX}_restante_${timestamp}.pdf`;

              results.push({
                filename: filename,
                blob: blob,
                files: [pdf.name],
                type: "single",
                isLeftover: true,
                size: blob.size,
              });
            } catch (error) {
              console.error(`Error al procesar archivo individual:`, error);
              this.updateStatus(
                `Error al procesar archivo individual: ${error.message}`,
                "error"
              );
            }
          }
        }
      } else if (mode === "singles") {
        // Process all as singles
        for (let i = 0; i < files.length; i++) {
          const progress = (i / files.length) * 100;
          this.updateProgress(progress);
          this.updateStatus(
            `Procesando archivo ${i + 1} de ${files.length}...`,
            "processing"
          );

          const pdf = files[i];
          try {
            const blob = await this.processSinglePDF(pdf);
            const timestamp = Date.now();
            const filename = `${Config.SINGLE_PREFIX}_${(i + 1)
              .toString()
              .padStart(2, "0")}_${timestamp}.pdf`;

            results.push({
              filename: filename,
              blob: blob,
              files: [pdf.name],
              type: "single",
              fileNumber: i + 1,
              size: blob.size,
            });
          } catch (error) {
            console.error(`Error al procesar el archivo ${pdf.name}:`, error);
            this.updateStatus(
              `Error al procesar ${pdf.name}: ${error.message}`,
              "error"
            );
          }
        }
      }

      this.updateProgress(100);

      if (results.length > 0) {
        const totalSizeMB = (
          results.reduce((sum, r) => sum + r.size, 0) /
          (1024 * 1024)
        ).toFixed(2);
        this.updateStatus(
          `¡Proceso completado! ${results.length} archivo(s) PDF generados (${totalSizeMB} MB)`,
          "success"
        );
      } else {
        this.updateStatus(
          "No se procesó ningún archivo correctamente",
          "error"
        );
      }

      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Update status message
   */
  updateStatus(message, type = "info") {
    const statusElement = document.getElementById("status");
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status status-${type}`;
    }
  }

  /**
   * Update progress bar
   */
  updateProgress(percentage) {
    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
  }

  /**
   * Create download link
   */
  createDownloadLink(filename, blob) {
    const url = URL.createObjectURL(blob);

    // Track for cleanup when page closes
    if (!window.pdfBlobUrls) window.pdfBlobUrls = [];
    window.pdfBlobUrls.push(url);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.textContent = "Descargar PDF";
    link.className = "download-link";
    link.title = `${filename} (${(blob.size / 1024).toFixed(0)} KB)`;

    // Store reference to prevent garbage collection
    link._blob = blob;
    link._blobUrl = url;

    // Prevent multiple simultaneous downloads of same file
    let isDownloading = false;

    link.onclick = (e) => {
      if (isDownloading) {
        e.preventDefault();
        return false;
      }

      isDownloading = true;
      const originalText = link.textContent;

      // Visual feedback
      link.textContent = "⏳ Descargando...";
      link.style.opacity = "0.7";
      link.style.cursor = "wait";

      // Reset after download starts
      setTimeout(() => {
        link.textContent = "✓ Descargado (click para otra copia)";
        link.style.opacity = "0.8";
        link.style.cursor = "pointer";
        isDownloading = false;
      }, 1000);

      // Don't revoke the URL! File stays available
      return true;
    };

    return link;
  }

  /**
   * Display download results with ZIP option
   */
  displayResults(results) {
    const downloadSection = document.getElementById("downloadSection");
    const downloadList = document.getElementById("downloadList");

    if (!downloadSection || !downloadList) return;

    downloadSection.style.display = "block";
    downloadList.innerHTML = "";

    // Add ZIP download option if multiple files
    if (results.length > 1) {
      const zipItem = document.createElement("div");
      zipItem.className = "download-item download-all-item";

      const infoDiv = document.createElement("div");
      infoDiv.className = "download-item-info";

      const totalSizeMB = (
        results.reduce((sum, r) => sum + r.size, 0) /
        (1024 * 1024)
      ).toFixed(2);

      infoDiv.innerHTML = `
                <div class="zip-header">
                    <span class="zip-icon">📦</span>
                    <strong>Descargar todos los archivos</strong>
                </div>
                <small>${results.length} archivo(s) PDF • ${totalSizeMB} MB total</small>
            `;

      const downloadDiv = document.createElement("div");
      const zipButton = document.createElement("button");
      zipButton.textContent = "Descargar todo (.ZIP)";
      zipButton.className = "download-zip-btn";
      zipButton.onclick = () => this.downloadAllAsZip(results);

      downloadDiv.appendChild(zipButton);
      zipItem.appendChild(infoDiv);
      zipItem.appendChild(downloadDiv);
      downloadList.appendChild(zipItem);

      // Add separator
      const separator = document.createElement("hr");
      separator.className = "download-separator";
      downloadList.appendChild(separator);
    }

    // Sort results: pairs first, then singles
    results.sort((a, b) => {
      if (a.type === "pair" && b.type !== "pair") return -1;
      if (a.type !== "pair" && b.type === "pair") return 1;
      if (a.type === "pair" && b.type === "pair") {
        return (a.pairNumber || 0) - (b.pairNumber || 0);
      }
      return (a.fileNumber || 0) - (b.fileNumber || 0);
    });

    // Add individual download items
    results.forEach((result, index) => {
      const item = document.createElement("div");
      item.className = "download-item";

      const infoDiv = document.createElement("div");
      infoDiv.className = "download-item-info";

      let typeLabel = "";
      let icon = "📄";

      if (result.type === "pair") {
        typeLabel = `Par ${result.pairNumber}`;
        icon = "🔄";
      } else if (result.isLeftover) {
        typeLabel = "Archivo restante";
      } else {
        typeLabel = `Individual ${result.fileNumber}`;
      }

      const fileSizeKB = Math.round(result.size / 1024);

      infoDiv.innerHTML = `
                <strong>${icon} ${escapeHTML(result.filename)}</strong>
                <small>${escapeHTML(typeLabel)} | ${
        result.files.length
      } archivo(s) fuente | ${fileSizeKB} KB</small>
                <div class="file-list">${result.files
                  .map((f) => escapeHTML(f))
                  .join(", ")}</div>
            `;

      const downloadDiv = document.createElement("div");
      const link = this.createDownloadLink(result.filename, result.blob);
      downloadDiv.appendChild(link);

      item.appendChild(infoDiv);
      item.appendChild(downloadDiv);
      downloadList.appendChild(item);
    });

    // Scroll to results
    downloadSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * Download all files as ZIP
   */
  async downloadAllAsZip(results) {
    try {
      this.updateStatus("Creando archivo ZIP...", "processing");

      // Load JSZip library dynamically
      await this.loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
      );

      if (typeof JSZip === "undefined") {
        throw new Error("No se pudo cargar la biblioteca ZIP");
      }

      const zip = new JSZip();
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");

      // Add all PDFs to zip
      results.forEach((result, index) => {
        zip.file(result.filename, result.blob);
      });

      // Generate zip file
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // Create and trigger download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pdfs-procesados-${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        this.updateStatus(
          `¡ZIP descargado con ${results.length} archivos!`,
          "success"
        );
      }, 100);
    } catch (error) {
      console.error("Error al crear ZIP:", error);
      this.updateStatus("Error al crear archivo ZIP", "error");

      // Fallback: download files individually
      this.fallbackIndividualDownload(results);
    }
  }

  /**
   * Fallback: download files individually
   */
  fallbackIndividualDownload(results) {
    this.updateStatus("Descargando archivos uno por uno...", "info");

    // Download with delay to avoid browser blocking
    results.forEach((result, index) => {
      setTimeout(() => {
        const link = this.createDownloadLink(result.filename, result.blob);
        link.click();

        // Update status for last file
        if (index === results.length - 1) {
          setTimeout(() => {
            this.updateStatus(
              `Descargados ${results.length} archivos individualmente`,
              "success"
            );
          }, 1000);
        }
      }, index * 1000); // 1 second between downloads
    });
  }

  /**
   * Helper to load scripts dynamically
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.head.appendChild(script);
    });
  }
}

// Create global instance
window.pdfProcessor = new PDFProcessor();
