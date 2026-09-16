import * as XLSX from 'xlsx';

/**
 * Xuất dữ liệu sang định dạng bảng tính Excel (.xlsx) chuẩn
 */
export function exportToExcel({
  fileName,
  sheetName = 'BaoCao',
  rows,
}: {
  fileName: string;
  sheetName?: string;
  rows: (string | number | null | undefined)[][];
}) {
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Tự động căn chỉnh độ rộng cột dựa trên nội dung dài nhất
    const colWidths = rows[0]?.map((_, colIndex) => {
      let maxLen = 10;
      rows.forEach(row => {
        const val = row[colIndex];
        if (val !== undefined && val !== null) {
          const str = String(val);
          maxLen = Math.max(maxLen, Math.min(str.length + 3, 50));
        }
      });
      return { wch: maxLen };
    });

    if (colWidths && colWidths.length > 0) {
      ws['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Tên file sạch đẹp không dấu tiếng Việt lỗi hệ thống
    const cleanFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    XLSX.writeFile(wb, cleanFileName);
    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file Excel:', error);
    return false;
  }
}

/**
 * Xuất dữ liệu sang định dạng CSV có UTF-8 BOM để mở tiếng Việt trên Microsoft Excel không bị lỗi font
 */
export function exportToCSV({
  fileName,
  rows,
}: {
  fileName: string;
  rows: (string | number | null | undefined)[][];
}) {
  try {
    const csvRows = rows.map(row => 
      row.map(item => {
        const val = item ?? '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );

    // Thêm UTF-8 Byte Order Mark (\uFEFF)
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const cleanFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', cleanFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file CSV:', error);
    return false;
  }
}

/**
 * Kích hoạt lệnh in tiêu chuẩn trình duyệt (hỗ trợ lưu thành PDF)
 */
export function printReport() {
  window.print();
}
