<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combinador de etiquetas PDF</title>
    <meta name="description" content="Ahorrá papel al imprimir tus etiquetas no autoadhesivas en hoja A4. Procesa PDFs localmente en tu navegador.">
    <link rel="stylesheet" href="css/styles.css.php">
    
    <script>
    // XSS Protection function
    window.escapeHTML = function(str) {
        if (str == null) return "";
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
        };
    </script>

    <meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdnjs.cloudflare.com/ajax/libs/;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: blob:;
               connect-src 'none';
               frame-src 'none';
               object-src 'none';">
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>Combinador de etiquetas PDF para Mercado Libre</h1>
            <p>Ahorrá papel al imprimir tus etiquetas de Mercado Libre en hojas A4 no autoadhesivas</p>
        </div>
        <main> 
        <div class="main-content">
            <div class="visual-examples">
                <h2>Cómo funciona:</h2>
                
                <div class="example-box">
                    <div class="box-title">Procesamiento Individual</div>
                    <div class="example-container">
                        <!-- Sección de entrada -->
                        <div class="example-section">
                            <div class="section-label">PDF de entrada</div>
                            <div class="page-grid">
                                <div class="page-item">
                                    <img src="images/original_page_1.png" alt="Página 1 de PDF original - Tamaño completo apaisado" loading="lazy" width="120" height="85">
                                    <div class="page-caption">Página 1 - apaisada<br><small>Tamaño completo</small></div>
                                </div>
                                <div class="page-item">
                                    <img src="images/original_page_2.png" alt="Página 2 de PDF original - Formato vertical" loading="lazy" width="85" height="120">
                                    <div class="page-caption">Página 2 - vertical<br><small>Solo el 20% superior</small></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Flecha -->
                        <div class="arrow-section">
                            <div class="arrow-icon" aria-hidden="true">→</div>
                            <div class="arrow-label">Procesar</div>
                        </div>
                        
                        <!-- Sección de salida -->
                        <div class="example-section">
                            <div class="section-label">PDF de salida</div>
                            <div class="output-item">
                                <img src="images/output_single.png" alt="PDF procesado individual - Formato A4" loading="lazy" width="200" height="141">
                                <div class="output-caption">PDF procesado<br><small>Formato A4</small></div>
                            </div>
                        </div>
                    </div>
                    <div class="box-description">
                        <p class="spaced-paragraph"><strong>Resultado:</strong> Cada PDF se procesa individualmente con la Página 1 a tamaño completo y la Página 2 recortada (20% superior) en la esquina inferior izquierda.</p>
                        <p class="spaced-paragraph"><strong>Ventaja:</strong> Ahora no necesitás remover la hoja dos antes enviar imprimir A4, tenés la info de etiqueta + producto juntas. Recortá solo la etiqueta para pegar en el paquete.</p>
                    </div>
                </div>
                
                <div class="example-box">
                    <div class="box-title">Procesamiento en Parejas</div>
                    <div class="example-container">
                        <!-- Sección de entrada -->
                        <div class="example-section">
                            <div class="section-label">Dos PDFs</div>
                            <div class="pdf-pair">
                                <div class="pdf-group">
                                    <div class="pdf-label">PDF A</div>
                                    <div class="page-grid">
                                        <div class="page-item small">
                                            <img src="images/original_page_1.png" alt="PDF A - Página 1 apaisada" loading="lazy" width="90" height="64">
                                            <div class="page-caption">Página 1 - apaisada</div>
                                        </div>
                                        <div class="page-item small">
                                            <img src="images/original_page_2.png" alt="PDF A - Página 2 vertical" loading="lazy" width="64" height="90">
                                            <div class="page-caption">Página 2 - vertical</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="pdf-group">
                                    <div class="pdf-label">PDF B</div>
                                    <div class="page-grid">
                                        <div class="page-item small">
                                            <img src="images/original_page_1.png" alt="PDF B - Página 1 apaisada" loading="lazy" width="90" height="64">
                                            <div class="page-caption">Página 1 - apaisada</div>
                                        </div>
                                        <div class="page-item small">
                                            <img src="images/original_page_2.png" alt="PDF B - Página 2 vertical" loading="lazy" width="64" height="90">
                                            <div class="page-caption">Página 2 - vertical</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Flecha -->
                        <div class="arrow-section">
                            <div class="arrow-icon" aria-hidden="true">→</div>
                            <div class="arrow-label">Combinar</div>
                        </div>
                        
                        <!-- Sección de salida -->
                        <div class="example-section">
                            <div class="section-label">Salida combinada</div>
                            <div class="output-item">
                                <img src="images/output_pair.png" alt="PDF combinado en pareja - Dos etiquetas en A4 apaisado" loading="lazy" width="200" height="141">
                                <div class="output-caption">PDF A (completo) + PDF B (completo)<br><small>A4 apaisado</small></div>
                            </div>
                        </div>
                    </div>
                    <div class="box-description">
                        <p class="spaced-paragraph"><strong>Resultado:</strong> PDF A (completo) en el lado izquierdo + PDF B (completo lado derecho).</p>
                        <p class="spaced-paragraph"><strong>Ventaja:</strong> Si tenés que hacer múltiples envíos, podés imprimir dos etiquetas en una misma hoja ahorrando papel.</p>
                    </div>
                </div>
            </div>

<div class="faq-section">
    <details class="faq-item">
        <summary class="faq-question">
             ¿Por qué hice está página?
        </summary>
        <div class="faq-answer">
            <p>Las etiquetas de Mercado Libre (en Argentina) normalmente vienen con 2 páginas:</p>
            <ol>
                <li><strong>Página 1:</strong> La etiqueta propiamente dicha (apaisada)</li>
                <li><strong>Página 2:</strong> Info del producto (vertical)</li>
            </ol>
            <p>Esto me hacía remover la página 2 antes de imprimir, para no desperdiciar papel.
            Pero también me hacía olvidar que producto correspondía a cada etiqueta 
            si no armaba el paquete inmediatamente. </p>

            <p><strong>Solución:</strong> Este programa combina ambas páginas en una sola hoja A4. Ahora solo necesito recortar el pequeño dato del producto antes de pegar la etiqueta. </p>
        </div>
    </details>
    
    <details class="faq-item">
        <summary class="faq-question">
            ¿Este sitio tiene alguna relación con Mercado Libre?
        </summary>
        <div class="faq-answer">
            <p><strong>¡NO!</strong></p>
            <p> Este programa viene sin garantías, no me hago responsable por errores o por su mal uso. </p>
        </div>
    </details>
</div>
            
            <div class="instructions">
                <h2>Cómo usar:</h2>
                <ul>
                    <li>Subí tus etiquetas, las mismas tienen <strong>exactamente 2 páginas</strong></li>
                    <li>Cada archivo tiene que terminar con la extensión <strong>.pdf</strong></li>
                    <li class="warning">Máximo 10 archivos por sesión</li>
                    <li>Elegí procesar como <strong>parejas</strong> (uno al lado del otro) o <strong>individuales</strong> (estilo original)</li>
                    <li>Descargá tus PDFs combinados</li>
                </ul>
                <br>
                <h2>Seguridad y privacidad:</h2>
                <ul>
                    <li>Tus archivos se procesan <strong>localmente en tu navegador</strong>.</li>
                    <li><strong>Ningún dato se sube a nuestros servidores</strong> ni a terceros.</li>
                    <li>Tus archivos originales <strong>no se modifican</strong>; solo se crean archivos nuevos.</li>
                    <li>Todo el procesamiento es visible en tu navegador (sin operaciones ocultas).</li>
                </ul>
            </div>

            <div class="upload-section">
                <div class="drop-zone" id="fileDropZone">
                    <div class="drop-zone-icon">📄</div>
                    <h3>Arrastrá archivos PDF acá</h3>
                    <p>o hacé clic para buscar tus archivos</p>
                    <button class="browse-btn">Elegir Archivos</button>
                    <div class="file-count-info">
                        Máximo 10 archivos | Tienen que tener exactamente 2 páginas cada uno
                    </div>
                </div>
                <input type="file" id="fileInput" class="file-input" multiple accept=".pdf,application/pdf">
            </div>

            <div class="file-list" id="fileList">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3>Archivos Seleccionados</h3>
                    <button id="clearFilesBtn" class="browse-btn" style="padding: 4px 8px; font-size: 0.8rem;">
                        Limpiar Todo
                    </button>
                </div>
                <div class="file-items" id="fileItems">
                    <!-- Los items de archivo se agregarán acá dinámicamente -->
                </div>
            </div>

            <div class="action-buttons">
                <button class="process-btn process-pairs" id="processPairsBtn" disabled>
                    Procesar como Parejas
                </button>
                <button class="process-btn process-singles" id="processSinglesBtn" disabled>
                    Procesar como Individuales
                </button>
            </div>

            <div class="status-section">
                <div class="status" id="status">
                    Por favor, seleccioná archivos PDF para comenzar
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressBar"></div>
                </div>
            </div>

            <div class="download-section" id="downloadSection">
                <h3>Descargar Resultados</h3>
                <div class="download-list" id="downloadList">
                    <!-- Los items de descarga se agregarán acá dinámicamente -->
                </div>
            </div>
            
        </div> <!-- Cierra .main-content -->
        </main>
        
        <!-- FOOTER DE GITHUB CORREGIDO: Fuera de .main-content -->
        <div class="github-minimal-footer">
            <p class="footer-text">
                <span class="footer-label">Herramienta de código abierto</span>
                <a href="https://github.com/ideacasual/combinador-etiquetas-ml" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="footer-link">
                   Ver en GitHub
                </a>
            </p>
        </div>
        
    </div> <!-- Cierra .container -->

    <!-- PDF.js library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    <!-- PDF Processor  -->
    <script src="js/pdf-processor.js.php" defer></script>
    
    <!-- Main Application -->
    <script src="js/script.js.php" defer></script>
</body>

</html>