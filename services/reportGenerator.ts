
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const addElementAsImage = async (
    doc: jsPDF, 
    el: HTMLElement | null, 
    title: string, 
    currentY: number,
    pageWidth: number,
    pageHeight: number,
    margin: number
): Promise<number> => {
    if (!el) return currentY;
    
    let newY = currentY;
    const contentWidth = pageWidth - margin * 2;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // BLACK TEXT
    doc.text(title, margin, newY);
    newY += 20;

    const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff', // Use white background for PDF
        useCORS: true,
        // CRITICAL: Force light mode by removing the 'dark' class from the cloned document's root.
        // This ensures Tailwind processes 'dark:' variants as false, rendering the light mode styles.
        onclone: (clonedDoc) => {
            clonedDoc.documentElement.classList.remove('dark');
            clonedDoc.body.classList.remove('dark');
            
            // Optional: Ensure body background is white in the clone
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedDoc.body.style.color = '#000000';
        }
    });
    // Use JPEG for compression and smaller file size
    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const imgProps = doc.getImageProperties(imgData);
    const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

    if (newY + imgHeight > pageHeight - margin) {
        doc.addPage();
        newY = margin;
    }

    doc.addImage(imgData, 'JPEG', margin, newY, contentWidth, imgHeight);
    newY += imgHeight + 20;

    return newY;
};

const addTextContent = (
    doc: jsPDF, 
    text: string | null, 
    title: string, 
    currentY: number,
    pageWidth: number,
    pageHeight: number,
    margin: number
): number => {
    if (!text) return currentY;
    
    let newY = currentY;
    const contentWidth = pageWidth - margin * 2;

    if (newY > pageHeight - margin * 4) {
        doc.addPage();
        newY = margin;
    }
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // BLACK TEXT
    doc.text(title, margin, newY);
    newY += 20;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // BLACK TEXT
    const splitText = doc.splitTextToSize(text, contentWidth);

    for (let i = 0; i < splitText.length; i++) {
        if (newY > pageHeight - margin) {
            doc.addPage();
            newY = margin;
        }
        doc.text(splitText[i], margin, newY);
        newY += 12; // line height
    }
    
    return newY + 10;
};

export const generateGeneralAnalysisPDF = async (element: HTMLElement, fileName: string) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0); // BLACK TEXT
  doc.text('Informe de Análisis Electoral - DEMOS ARRAKIS', margin, currentY);
  currentY += 30;

  const chartElement = element.querySelector<HTMLElement>('#analysis-charts');
  const tableElement = element.querySelector<HTMLElement>('#analysis-table');
  const aiText = element.querySelector<HTMLElement>('#ai-analysis-text')?.innerText || null;

  currentY = await addElementAsImage(doc, chartElement, 'Análisis Gráfico', currentY, pageWidth, pageHeight, margin);
  currentY = addTextContent(doc, aiText, "Análisis Completo del Estratega IA", currentY, pageWidth, pageHeight, margin);
  currentY = await addElementAsImage(doc, tableElement, 'Ranking Detallado', currentY, pageWidth, pageHeight, margin);

  doc.save(fileName);
};

export const generateDHondtPDF = async (element: HTMLElement, fileName: string) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0); // BLACK TEXT
    doc.text('Informe de Simulación D\'Hondt', margin, currentY);
    currentY += 30;

    const summaryElement = element.querySelector<HTMLElement>('#dhondt-summary');
    const detailsElement = element.querySelector<HTMLElement>('#dhondt-details');
    const stepsElement = element.querySelector<HTMLElement>('#dhondt-steps');

    currentY = await addElementAsImage(doc, summaryElement, 'Resumen Gráfico', currentY, pageWidth, pageHeight, margin);
    currentY = await addElementAsImage(doc, detailsElement, 'Detalles de Asignación', currentY, pageWidth, pageHeight, margin);
    currentY = await addElementAsImage(doc, stepsElement, 'Cálculo Paso a Paso', currentY, pageWidth, pageHeight, margin);

    doc.save(fileName);
};

export const generateCoalitionAnalysisPDF = async (element: HTMLElement, fileName: string) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0); // BLACK TEXT
    doc.text('Informe de Análisis de Coaliciones', margin, currentY);
    currentY += 30;

    currentY = await addElementAsImage(doc, element, 'Resultados del Desglose', currentY, pageWidth, pageHeight, margin);

    doc.save(fileName);
};

export const generateStrategicReportPDF = async (element: HTMLElement, fileName: string) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0); // BLACK TEXT
    doc.text('Informe Estratégico Cuantitativo - DEMOS ARRAKIS', margin, margin + 10);

    // Clone element to modify styles for PDF capture without affecting UI
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.width = `${element.scrollWidth}px`;
    clonedElement.style.padding = '20px';
    
    // We are now relying on html2canvas's onclone to strip the 'dark' class from the document root.
    // This allows Tailwind's light mode classes to take effect automatically.
    // However, we still ensure the container background is white.
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.color = '#000000';
    clonedElement.style.backgroundImage = 'none';

    document.body.appendChild(clonedElement); // Append to body to render

    const canvas = await html2canvas(clonedElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: clonedElement.scrollWidth,
        windowHeight: clonedElement.scrollHeight,
        onclone: (clonedDoc) => {
            // THE FIX: Remove the 'dark' class from the cloned document's html and body tags.
            // This forces the captured content to render in Light Mode styles.
            clonedDoc.documentElement.classList.remove('dark');
            clonedDoc.body.classList.remove('dark');
            
            // Ensure background is white
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedDoc.body.style.color = '#000000';
        }
    });
    
    document.body.removeChild(clonedElement); // Clean up

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const imgProps = doc.getImageProperties(imgData);
    const imgHeight = (imgProps.height * (pageWidth - margin * 2)) / imgProps.width;
    let heightLeft = imgHeight;
    let position = 45;

    doc.addImage(imgData, 'JPEG', margin, position, pageWidth - margin * 2, imgHeight);
    heightLeft -= (pageHeight - 65);

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', margin, position, pageWidth - margin * 2, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(fileName);
};

export const generateMarketingFullReportPDF = async (element: HTMLElement, fileName: string) => {
    // Robust logic for ultra-long content export (e.g. Cronoposting matrices)
    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    doc.setFontSize(22);
    doc.setTextColor(0, 40, 85); // Brand Primary
    doc.text('Dossier de Estrategia de Marketing Digital', margin, margin + 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, margin, margin + 35);

    // Clone element to modify styles for PDF capture without affecting UI
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Explicitly set dimensions to ensure charts render well
    clonedElement.style.width = '1200px'; // Force wide width for better chart resolution
    clonedElement.style.height = 'auto'; // Allow full expansion
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px'; // Hide offscreen
    clonedElement.style.top = '0';
    clonedElement.style.padding = '40px';
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.overflow = 'visible'; // Force overflow visibility
    
    // Hide buttons or interactive elements that shouldn't appear in print
    const buttons = clonedElement.querySelectorAll('button');
    buttons.forEach(btn => btn.style.display = 'none');
    
    // Expand all AnalysisCards in the clone (hacky but necessary if they are collapsed)
    const collapsed = clonedElement.querySelectorAll('.max-h-0');
    collapsed.forEach((el) => {
        (el as HTMLElement).style.maxHeight = 'none';
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.overflow = 'visible';
    });

    // Fix internal scroll containers to be full height/width
    const scrollables = clonedElement.querySelectorAll('.overflow-x-auto, .overflow-y-auto, .custom-scrollbar');
    scrollables.forEach((el) => {
        (el as HTMLElement).style.overflow = 'visible';
        (el as HTMLElement).style.height = 'auto';
        (el as HTMLElement).style.maxHeight = 'none';
    });

    document.body.appendChild(clonedElement); 
    
    // Calculate total height needed
    const fullHeight = clonedElement.scrollHeight + 100;

    try {
        const canvas = await html2canvas(clonedElement, {
            scale: 1.5, // Balance quality/size
            backgroundColor: '#ffffff',
            useCORS: true,
            windowWidth: 1200,
            windowHeight: fullHeight, // CRITICAL: Capture full height regardless of viewport
            height: fullHeight,
            onclone: (clonedDoc) => {
                clonedDoc.documentElement.classList.remove('dark');
                clonedDoc.body.classList.remove('dark');
            }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgProps = doc.getImageProperties(imgData);
        const imgHeight = (imgProps.height * (pageWidth - margin * 2)) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 60; // Start lower due to header

        doc.addImage(imgData, 'JPEG', margin, position, pageWidth - margin * 2, imgHeight);
        heightLeft -= (pageHeight - 80);

        while (heightLeft > 0) {
            position = 20 - (imgHeight - heightLeft); // Adjust position to render the next slice
            doc.addPage();
            // Calculate y-offset for the image on new page
            // We basically move the image UP so the next chunk is visible in the viewport
            const shift = (pageHeight - 40) * (doc.getNumberOfPages() - 1);
            
            // Standard approach: place huge image at negative coordinate
            // Initial Y was 60. Page 1 covered (PH - 80).
            // Page 2 needs to start showing from pixel (PH - 80).
            // So we place image at Y = 20 - (PH - 80) = 100 - PH? No.
            // Better logic:
            // Page 1: Y=60.
            // Page 2: Y = 60 - (PageHeight - 80).
            // Page 3: Y = 60 - 2*(PageHeight - 80).
            
            const effectivePageHeight = pageHeight - 40; // Top 20, Bottom 20 margin
            const yPos = 60 - (effectivePageHeight * (doc.getNumberOfPages() - 1)) + (doc.getNumberOfPages() > 1 ? 40 : 0); // adjust slightly

            doc.addImage(imgData, 'JPEG', margin, yPos, pageWidth - margin * 2, imgHeight);
            heightLeft -= effectivePageHeight;
        }

        doc.save(fileName);
    } finally {
        document.body.removeChild(clonedElement);
    }
};
