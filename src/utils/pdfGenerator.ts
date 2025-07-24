import type { Prescription } from '@/api/prescription';
// Import autoTable correctly
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const generatePrescriptionPDF = (prescription: Prescription, medicines: any[]) => {
  // Create document instance
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Colors
const primaryColor = [2, 19, 115]; // Deep blue (#021373 - from your app header)
const secondaryColor = [132, 145, 217]; // Light blue (#8491D9 - from your buttons)
const accentColor = [199, 210, 254]; // Very light blue (#C7D2FE - from your text)
  
  // Header with logo and doctor info
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  // White text in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${prescription.prescribedBy.user.firstName} ${prescription.prescribedBy.user.lastName}`, margin, 20);
  
  doc.setFontSize(10);
  doc.text(prescription.prescribedBy.specialization, margin + 2, 26);
  
// Prescription label with rounded outline
doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
(doc as any).roundedRect(pageWidth - 60, 15, 50, 12, 4, 4, 'F');
doc.setTextColor(255, 255, 255);
doc.setFontSize(12);
doc.text('PRESCRIPTION', pageWidth - 55, 23);
  
  // Reset text color
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  // Date and Patient ID
  doc.setFontSize(10);
  doc.text(`Date: ${formatDate(prescription.date)}`, pageWidth - margin, 40, { align: 'right' });
  doc.text(`Patient ID: #P${prescription.patient.id.substring(0, 7)}`, pageWidth - margin, 46, { align: 'right' });
  
  // Patient Information Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Patient Information', margin, 60);
  
  // Decorative line
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, 62, margin + 80, 62);
  
  // Patient details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  const patientDetails = [
    [`Name:`, `${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`],
    [`Date of Birth:`, formatDate(prescription.patient.dateOfBirth || '')],
    [`Age:`, `${calculateAge(prescription.patient.dateOfBirth || '')} years`],
    [`Address:`, '123 Main Street, City'], // Replace with actual patient data
    [`Phone:`, '(555) 123-4567'], //put phone number
    [`Insurance:`, 'Blue Cross Blue Shield'] // Replace with actual patient data
  ];
  
  // Create two columns for patient details
  let yPosition = 70;
  patientDetails.forEach(([label, value], index) => {
    const column = index % 2 === 0 ? margin : pageWidth / 2;
    const rowY = yPosition + Math.floor(index / 2) * 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text(label, column, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, column + (label === 'Name:' ? 15 : 25), rowY);
  });
  
  // Prescription Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Prescription Details', margin, 120);
  doc.line(margin, 122, margin + 80, 122);
  
  // Medications table
  const medicationsData = prescription.medications.map((medication, index) => {
    const medicine = medicines.find(med => med.id === medication.medicineId);
    return [
      medicine?.name || `Medicine ${index + 1}`,
      medication.dosage,
      `${medication.quantity || '30'} tablets`,
       '2 refills',
      medication.frequency || 'Take as directed.'
    ];
  });
  
  // Use autoTable correctly
  autoTable(doc, {
    startY: 130,
    head: [['Medicine', 'Dosage', 'Quantity', 'Refills', 'Instructions']],
    body: medicationsData,
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      4: { cellWidth: 60 }
    }
  });
  
  // Get the y position after the table
  const tableEndY = (doc as any).lastAutoTable?.finalY || 200;
  const lastY = tableEndY + 20;
  
  // Footer with signature
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Doctor\'s Signature:', margin, lastY);
  
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.line(margin, lastY + 15, margin + 80, lastY + 15);
  
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${prescription.prescribedBy.user.firstName} ${prescription.prescribedBy.user.lastName}, MD`, margin, lastY + 25);
  
  // Clinic information footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('City Medical Center • 123 Medical Drive • City, State 12345', pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text('Phone: (555) 987-6543 • Fax: (555) 987-6544', pageWidth / 2, pageHeight - 5, { align: 'center' });
  
  return doc;
};

// Helper functions remain the same
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
};

const calculateAge = (dateString: string): number => {
  if (!dateString) return 0;
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};