// Helper to remove Vietnamese tones/accents
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Clean and normalize a header string for matching
function cleanHeader(header: string): string {
  if (!header) return '';
  return removeAccents(header)
    .trim()
    .toLowerCase()
    .replace(/[\s\-_./()]/g, ''); // Bỏ khoảng trắng, _, -, ., /, (, )
}

const INVENTORY_ALIASES: Record<string, string[]> = {
  tag_id: ['tagid', 'batch', 'lpno', 'code', 'barcode'],
  bin: ['bin', 'location', 'vitri', 'vi_tri', 'kho']
};

const MASTER_DATA_ALIASES: Record<string, string[]> = {
  batch: ['batch', 'tagid', 'tag_id', 'code', 'barcode'],
  stock_code: ['stockcode', 'lpno', 'lp_no', 'lpno(stockcode)', 'itemcode', 'productcode'],
  qty: ['qty', 'quantity', 'soluong', 'so_luong', 'pcs', 'count'],
  warehouse: ['warehouse', 'wh', 'location', 'kho', 'whcode'],
  create_date: ['createdate', 'create_date', 'create_date_date', 'date']
};

export function normalizeCsvData(
  rawRows: Record<string, any>[],
  type: 'inventory' | 'master_data'
): any[] {
  const aliases = type === 'inventory' ? INVENTORY_ALIASES : MASTER_DATA_ALIASES;
  
  return rawRows.map(row => {
    const normalizedRow: Record<string, any> = {};
    
    // Khởi tạo các trường mặc định là rỗng hoặc 0
    if (type === 'inventory') {
      normalizedRow.tag_id = '';
      normalizedRow.bin = '';
    } else {
      normalizedRow.batch = '';
      normalizedRow.stock_code = '';
      normalizedRow.qty = 0;
      normalizedRow.warehouse = '';
      normalizedRow.create_date = '';
    }

    // Duyệt qua từng key trong row gốc và map vào schema chuẩn
    Object.entries(row).forEach(([rawKey, val]) => {
      const cleanedKey = cleanHeader(rawKey);
      
      // Tìm schema key tương ứng
      for (const [schemaKey, aliasList] of Object.entries(aliases)) {
        if (cleanedKey === schemaKey || aliasList.includes(cleanedKey)) {
          if (schemaKey === 'qty') {
            const parsedQty = parseFloat(String(val).replace(/,/g, ''));
            normalizedRow[schemaKey] = isNaN(parsedQty) ? 0 : parsedQty;
          } else {
            normalizedRow[schemaKey] = val !== null && val !== undefined ? String(val).trim() : '';
          }
          break;
        }
      }
    });

    return normalizedRow;
  });
}
