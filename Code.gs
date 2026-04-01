function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    
    // Periksa atau Buat Sheet "db_backup"
    var sheet = doc.getSheetByName("db_backup");
    if (!sheet) {
      sheet = doc.insertSheet("db_backup");
      sheet.appendRow(["Last Updated", "Application Data (JSON)"]);
      sheet.getRange("A1:B1").setFontWeight("bold");
    }
    
    // Simpan data di baris kedua
    var payloadString = typeof requestData.payload === 'string' ? requestData.payload : JSON.stringify(requestData.payload);
    
    sheet.getRange(2, 1).setValue(new Date());
    sheet.getRange(2, 2).setValue(payloadString);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success", 
      message: "Data berhasil diamankan ke Google Spreadsheet.",
      timestamp: new Date()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error", 
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName("db_backup");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error", 
        message: "Sheet db_backup belum dibuat. Lakukan sinkronisasi (POST) terlebih dahulu."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var rawData = sheet.getRange(2, 2).getValue();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success", 
      data: rawData ? JSON.parse(rawData) : null,
      timestamp: sheet.getRange(2, 1).getValue()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error", 
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
