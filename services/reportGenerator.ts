
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
        // Force text color to black for the capture to ensure contrast on white background
        onclone: (clonedDoc) => {
            const element = clonedDoc.querySelector(`[data-pdf-target="true"]`) as HTMLElement; 
            if (element) {
                element.style.color = '#000000';
            }
            // Also force specific text classes if needed
            const texts = clonedDoc.querySelectorAll('.text-white, .text-gray-200, .text-gray-300, .text-gray-400, .text-light-text-primary, .dark\\:text-dark-text-primary');
            texts.forEach((t: any) => t.style.color = '#000000');
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
    // Force text colors to black for the PDF capture
    const allText = clonedElement.querySelectorAll('*');
    allText.forEach((el: any) => {
        const style = window.getComputedStyle(el);
        // Ensure non-transparent text becomes black
        if (style.color !== 'rgba(0, 0, 0, 0)' && style.color !== 'transparent') { 
             el.style.color = '#000000';
             el.style.textShadow = 'none';
        }
        // Force background of cards to be light gray for contrast
        if (el.classList.contains('bg-white/5') || el.classList.contains('glass-panel')) {
            el.style.backgroundColor = '#f3f4f6'; // Light gray background for cards
            el.style.borderColor = '#ccc';
            el.style.boxShadow = 'none';
        }
    });
    // Remove dark backgrounds
    clonedElement.style.backgroundColor = '#ffffff';
    clonedElement.style.backgroundImage = 'none';

    document.body.appendChild(clonedElement); // Append to body to render

    const canvas = await html2canvas(clonedElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: clonedElement.scrollWidth,
        windowHeight: clonedElement.scrollHeight,
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
