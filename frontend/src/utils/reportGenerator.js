import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateDailyProductionReport = (reportData) => {
  const {
    date,
    appointments,
    summary,
    ledgerEntries = [],
    customNotes = ''
  } = reportData;

  // Create new PDF document
  const doc = new jsPDF();
  
  // Set up fonts and colors
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('DAILY PRODUCTION REPORT', 105, 20, { align: 'center' });
  
  // Date
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(formattedDate, 105, 30, { align: 'center' });
  
  // Clinic info (placeholder - can be customized)
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('SpineLine Clinic Management System', 105, 40, { align: 'center' });
  
  let yPosition = 55;
  
  // Summary metrics
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('DAILY SUMMARY', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.text(`Total Patients: ${summary.total}`, 20, yPosition);
  doc.text(`Scheduled: ${summary.scheduled}`, 70, yPosition);
  doc.text(`Checked-In: ${summary.checkedIn}`, 120, yPosition);
  doc.text(`Checked-Out: ${summary.checkedOut}`, 170, yPosition);
  yPosition += 20;
  
  // Patient details table
  const tableData = [];
  const allPatients = [
    ...appointments.scheduled.map(apt => ({ ...apt, status: 'Scheduled' })),
    ...appointments.checkedIn.map(apt => ({ ...apt, status: 'Checked-In' })),
    ...appointments.checkedOut.map(apt => ({ ...apt, status: 'Checked-Out' }))
  ];
  
  // Sort by time
  allPatients.sort((a, b) => {
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    return 0;
  });
  
  allPatients.forEach(appointment => {
    const patient = appointment.patientId;
    const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Unknown';
    const recordNumber = patient?.recordNumber || 'N/A';

    // Extract payment info from enhanced appointment data
    const paymentMethod = appointment.paymentMethod || 'N/A';
    const deductible = appointment.deductible || 0;
    const insuranceProvider = appointment.insuranceProvider || 'N/A';
    const comments = appointment.notes || appointment.reason || '';
    const totalBilled = appointment.totalBilled || 0;

    tableData.push([
      appointment.time || 'N/A',
      patientName,
      recordNumber,
      `$${deductible.toFixed(2)}`,
      paymentMethod,
      insuranceProvider,
      appointment.status,
      `$${totalBilled.toFixed(2)}`,
      comments.substring(0, 25) + (comments.length > 25 ? '...' : '')
    ]);
  });
  
  // Create table
  doc.autoTable({
    head: [['Time', 'Patient Name', 'Record #', 'Deductible', 'Payment', 'Insurance', 'Status', 'Billed', 'Comments']],
    body: tableData,
    startY: yPosition,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 18 }, // Time
      1: { cellWidth: 30 }, // Patient Name
      2: { cellWidth: 18 }, // Record #
      3: { cellWidth: 18 }, // Deductible
      4: { cellWidth: 18 }, // Payment
      5: { cellWidth: 22 }, // Insurance
      6: { cellWidth: 18 }, // Status
      7: { cellWidth: 18 }, // Billed
      8: { cellWidth: 25 }  // Comments
    }
  });
  
  // Payment breakdown summary
  const finalY = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('PAYMENT BREAKDOWN', 20, finalY);
  
  // Use payment breakdown from summary if available, otherwise calculate
  const paymentTotals = summary.paymentBreakdown || {};

  // If no breakdown available, calculate from appointments
  if (Object.keys(paymentTotals).length === 0) {
    allPatients.forEach(apt => {
      const method = apt.paymentMethod || 'Not Specified';
      const amount = apt.amountPaid || 0;
      paymentTotals[method] = (paymentTotals[method] || 0) + amount;
    });
  }

  let paymentY = finalY + 10;
  Object.entries(paymentTotals).forEach(([method, total]) => {
    doc.setFontSize(10);
    doc.text(`${method}: $${total.toFixed(2)}`, 20, paymentY);
    paymentY += 8;
  });

  // Total revenue from summary or calculated
  const totalRevenue = summary.totalRevenue || Object.values(paymentTotals).reduce((sum, amount) => sum + amount, 0);
  const totalBilled = summary.totalBilled || 0;

  doc.setFontSize(11);
  doc.setTextColor(0, 100, 0);
  doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, paymentY + 5);

  if (totalBilled > 0) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total Billed: $${totalBilled.toFixed(2)}`, 20, paymentY + 15);
    doc.text(`Outstanding: $${(totalBilled - totalRevenue).toFixed(2)}`, 20, paymentY + 25);
    paymentY += 20;
  }
  
  // Custom notes section
  if (customNotes) {
    const notesY = paymentY + 20;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('NOTES', 20, notesY);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const splitNotes = doc.splitTextToSize(customNotes, 170);
    doc.text(splitNotes, 20, notesY + 10);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 20, pageHeight - 10);
  doc.text('SpineLine Clinic Management System', 105, pageHeight - 10, { align: 'center' });
  
  return doc;
};

export const downloadDailyReport = (reportData, filename) => {
  const doc = generateDailyProductionReport(reportData);
  doc.save(filename || `daily-report-${reportData.date}.pdf`);
};
