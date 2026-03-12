/**
 * =========================================
 * FamilyHealth — Google Apps Script Backend
 * =========================================
 * 
 * CARA DEPLOY:
 * 1. Buka https://script.google.com
 * 2. Buat project baru → Klik "+ New Project"
 * 3. Hapus semua kode di editor, paste seluruh kode ini
 * 4. Klik 💾 Simpan → Beri nama "FamilyHealth API"
 * 5. Klik ▶️ Run → Pilih fungsi "setup" → Berikan izin
 * 6. Klik "Deploy" → "New Deployment"
 *    - Pilih type: "Web App"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 *    - Klik "Deploy"
 * 7. Salin URL Web App → Paste ke Settings di FamilyHealth PWA
 * 
 * SPREADSHEET AKAN DIBUAT OTOMATIS SAAT PERTAMA KALI SETUP!
 */

// ===== KONFIGURASI =====
const SPREADSHEET_NAME = 'FamilyHealth Data';

// ===== SETUP =====
function setup() {
  // Cari atau buat spreadsheet
  let ss = getOrCreateSpreadsheet();
  
  // Buat sheet-sheet yang dibutuhkan
  const sheets = [
    { name: 'Entries', headers: ['id', 'type', 'title', 'value', 'notes', 'date', 'childId', 'synced'] },
    { name: 'Children', headers: ['id', 'name', 'gender', 'birthDate', 'weight', 'height', 'headCirc', 'synced'] },
    { name: 'Growth', headers: ['id', 'childId', 'date', 'weight', 'height', 'headCirc', 'synced'] },
    { name: 'Vaccines', headers: ['id', 'childId', 'name', 'date', 'status', 'notes', 'synced'] },
    { name: 'Symptoms', headers: ['id', 'tags', 'severity', 'area', 'notes', 'date', 'synced'] },
    { name: 'Medications', headers: ['id', 'name', 'dose', 'time', 'taken', 'date', 'synced'] },
    { name: 'Habits', headers: ['id', 'name', 'icon', 'target', 'current', 'unit', 'date', 'synced'] },
    { name: 'Vitals', headers: ['id', 'type', 'value', 'unit', 'date', 'synced'] }
  ];
  
  sheets.forEach(({ name, headers }) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#1a3a35');
      sheet.getRange(1, 1, 1, headers.length).setFontColor('#7dd3c0');
      sheet.setFrozenRows(1);
    }
  });
  
  // Hapus Sheet1 default jika ada
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
  
  Logger.log('✅ Setup selesai! Spreadsheet: ' + ss.getUrl());
  return { success: true, url: ss.getUrl() };
}

function getOrCreateSpreadsheet() {
  // Cari spreadsheet yang sudah ada
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  // Buat baru
  return SpreadsheetApp.create(SPREADSHEET_NAME);
}

// ===== WEB APP HANDLERS =====
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // CORS headers
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const params = e.parameter || {};
    const action = params.action || '';
    let postData = {};
    
    if (e.postData) {
      try { postData = JSON.parse(e.postData.contents); } catch(err) {}
    }
    
    let result;
    
    switch (action) {
      case 'ping':
        result = { success: true, message: 'FamilyHealth API aktif! 🌿' };
        break;
      case 'sync':
        result = syncData(postData);
        break;
      case 'getAll':
        result = getAllData(params.sheet || 'Entries');
        break;
      case 'add':
        result = addRow(params.sheet || 'Entries', postData);
        break;
      case 'update':
        result = updateRow(params.sheet || 'Entries', postData);
        break;
      case 'delete':
        result = deleteRow(params.sheet || 'Entries', params.id || postData.id);
        break;
      case 'bulkSync':
        result = bulkSync(postData);
        break;
      default:
        result = { success: false, error: 'Action tidak dikenal: ' + action };
    }
    
    output.setContent(JSON.stringify(result));
  } catch (error) {
    output.setContent(JSON.stringify({ success: false, error: error.toString() }));
  }
  
  return output;
}

// ===== CRUD OPERATIONS =====

function getAllData(sheetName) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan: ' + sheetName };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  
  return { success: true, data: rows };
}

function addRow(sheetName, rowData) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan: ' + sheetName };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(h => {
    if (h === 'id' && !rowData[h]) return Utilities.getUuid();
    if (h === 'synced') return new Date().toISOString();
    return rowData[h] !== undefined ? (Array.isArray(rowData[h]) ? JSON.stringify(rowData[h]) : rowData[h]) : '';
  });
  
  sheet.appendRow(newRow);
  
  const id = newRow[headers.indexOf('id')];
  return { success: true, id: id, message: 'Data berhasil ditambahkan' };
}

function updateRow(sheetName, rowData) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan: ' + sheetName };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol === -1) return { success: false, error: 'Kolom id tidak ditemukan' };
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === rowData.id) {
      headers.forEach((h, j) => {
        if (h !== 'id' && rowData[h] !== undefined) {
          const val = Array.isArray(rowData[h]) ? JSON.stringify(rowData[h]) : rowData[h];
          sheet.getRange(i + 1, j + 1).setValue(val);
        }
      });
      // Update synced timestamp
      const syncedCol = headers.indexOf('synced');
      if (syncedCol !== -1) {
        sheet.getRange(i + 1, syncedCol + 1).setValue(new Date().toISOString());
      }
      return { success: true, message: 'Data berhasil diperbarui' };
    }
  }
  
  return { success: false, error: 'Data dengan id tersebut tidak ditemukan' };
}

function deleteRow(sheetName, id) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan: ' + sheetName };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol === -1) return { success: false, error: 'Kolom id tidak ditemukan' };
  
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Data berhasil dihapus' };
    }
  }
  
  return { success: false, error: 'Data tidak ditemukan' };
}

// ===== BULK SYNC =====
function bulkSync(postData) {
  const results = {};
  const sheets = postData.sheets || {};
  
  Object.entries(sheets).forEach(([sheetName, rows]) => {
    const ss = getOrCreateSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      results[sheetName] = { success: false, error: 'Sheet tidak ditemukan' };
      return;
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const existingData = sheet.getDataRange().getValues();
    const idCol = headers.indexOf('id');
    const existingIds = new Set(existingData.slice(1).map(r => r[idCol]));
    
    let added = 0, updated = 0;
    
    rows.forEach(row => {
      if (existingIds.has(row.id)) {
        // Update existing
        for (let i = 1; i < existingData.length; i++) {
          if (existingData[i][idCol] === row.id) {
            headers.forEach((h, j) => {
              if (h !== 'id' && row[h] !== undefined) {
                const val = Array.isArray(row[h]) ? JSON.stringify(row[h]) : row[h];
                sheet.getRange(i + 1, j + 1).setValue(val);
              }
            });
            updated++;
            break;
          }
        }
      } else {
        // Add new
        const newRow = headers.map(h => {
          if (h === 'synced') return new Date().toISOString();
          return row[h] !== undefined ? (Array.isArray(row[h]) ? JSON.stringify(row[h]) : row[h]) : '';
        });
        sheet.appendRow(newRow);
        added++;
      }
    });
    
    results[sheetName] = { success: true, added, updated };
  });
  
  return { success: true, results };
}

function syncData(postData) {
  // Full bidirectional sync
  const localData = postData.data || {};
  const results = {};
  
  Object.entries(localData).forEach(([sheetName, localRows]) => {
    // Get remote data
    const remote = getAllData(sheetName);
    const remoteRows = remote.success ? remote.data : [];
    
    // Merge: local wins for conflicts
    const merged = new Map();
    remoteRows.forEach(r => merged.set(r.id, r));
    localRows.forEach(r => merged.set(r.id, r)); // local overwrites
    
    // Write back all merged data
    const ss = getOrCreateSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      // Clear existing data (keep headers)
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
      }
      // Write merged
      const mergedArr = Array.from(merged.values());
      if (mergedArr.length > 0) {
        const rows = mergedArr.map(row =>
          headers.map(h => {
            if (h === 'synced') return new Date().toISOString();
            return row[h] !== undefined ? (Array.isArray(row[h]) ? JSON.stringify(row[h]) : row[h]) : '';
          })
        );
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      
      results[sheetName] = { 
        success: true, 
        count: merged.size,
        remoteData: Array.from(merged.values())
      };
    }
  });
  
  return { success: true, results };
}
