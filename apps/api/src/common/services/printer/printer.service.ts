import { Injectable } from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

// 👇 pdfmake en Node se usa con require
const PdfPrinter = require('pdfmake');

// Define font files
const fonts = {
  Roboto: {
    normal: 'fonts/Roboto-Regular.ttf',
    bold: 'fonts/Roboto-Medium.ttf',
    italics: 'fonts/Roboto-Italic.ttf',
    bolditalics: 'fonts/Roboto-MediumItalic.ttf',
  },
};

@Injectable()
export class PrinterService {

  // private printer: PdfPrinter;
  
  private printer = new PdfPrinter(fonts);

  constructor() {

    // this.printer = new PdfPrinter(fonts);

  }

  createPdf(docDefinition: TDocumentDefinitions) {

    return this.printer.createPdfKitDocument(docDefinition);
  
  }

  async generatePdf(docDefinition: TDocumentDefinitions): Promise<Buffer> {

    return new Promise((resolve, reject) => {

      const pdfDoc = this.createPdf(docDefinition);
      
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));

      pdfDoc.end();

    });
  }

}
