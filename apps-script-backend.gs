/**
 * SEHATKU — Google Apps Script Backend
 * =====================================
 * Deploy ini sebagai Web App (Execute as: Me, Access: Anyone)
 * Salin URL deployment ke pengaturan aplikasi Sehatku.
 *
 * STRUKTUR SPREADSHEET:
 * Buat sheet terpisah untuk setiap profil: "Ayah", "Ibu", "Anak", dst.
 *
 * Setiap sheet memiliki dua kolom: KEY | VALUE
 * Contoh:
 *   hr          | 72
 *   spo2        | 98
 *   temp        | 36.6
 *   rr          | 16
 *   bp          | 120/80
 *   glucose     | 105
 *   bb          | 70
 *   tb          | 172
 *   lp          | 88
 *   lk          |
 *   sleep_dur   | 7.5
 *   sleep_deep  | 1j 45m
 *   sleep_rem   | 1j 30m
 *   sleep_start | 22:15
 *   sleep_end   | 05:45
 *   lab_glukosa | 105
 *   lab_kolesterol | 185
 *   lab_asamurat   | 5.8
 *   lab_sgpt    | 28
 *   lab_sgot    | 25
 *   lab_ldl     | 110
 *   lab_hdl     | 55
 *   nut_cal     | 1850
 *   nut_carb    | 245
 *   nut_protein | 72
 *   nut_fat     | 65
 *   nut_water   | 1800
 *   nut_kafein  | 120
 *   ls_steps    | 8432
 *   ls_cal_burn | 420
 *   ls_active   | 45
 *   ls_gait     | Normal
 *   ls_smoke    | 0
 *   ls_alcohol  | 0
 *   env_aqi     | 75
 *   env_temp    | 30
 *   vo2max      | 42
 *   apnea       | 1.2
 */

function doGet(e) {
  const sheetName = e.parameter.sheet || 'Ayah';
  const callback = e.parameter.callback; // For JSONP if needed

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return jsonResponse({ error: `Sheet "${sheetName}" tidak ditemukan` }, callback);
    }

    const data = parseSheetData(sheet);
    const response = formatResponse(data);

    return jsonResponse(response, callback);
  } catch (err) {
    return jsonResponse({ error: err.message }, callback);
  }
}

function parseSheetData(sheet) {
  const rows = sheet.getDataRange().getValues();
  const data = {};
  rows.forEach(row => {
    if (row[0] && row[1] !== '') {
      data[String(row[0]).trim().toLowerCase()] = row[1];
    }
  });
  return data;
}

function formatResponse(d) {
  return {
    vital: {
      hr: num(d.hr),
      spo2: num(d.spo2),
      temp: num(d.temp),
      rr: num(d.rr),
      bp: d.bp || null,
      glucose: num(d.glucose),
      bb: num(d.bb),
      tb: num(d.tb),
      lp: num(d.lp),
      lk: num(d.lk),
      updated: d.vital_updated || new Date().toLocaleString('id-ID')
    },
    sleep: {
      duration: num(d.sleep_dur),
      deep: d.sleep_deep || null,
      rem: d.sleep_rem || null,
      light_pct: num(d.sleep_light_pct) || 40,
      deep_pct: num(d.sleep_deep_pct) || 35,
      rem_pct: num(d.sleep_rem_pct) || 25,
      start: d.sleep_start || null,
      end: d.sleep_end || null,
      trend: parseTrend(d.sleep_trend)
    },
    heart: {
      vo2max: num(d.vo2max),
      apnea: num(d.apnea)
    },
    lab: {
      glukosa: labItem(d.lab_glukosa, d.lab_glukosa_date, 70, 100),
      kolesterol: labItem(d.lab_kolesterol, d.lab_kolesterol_date, 0, 200),
      asamurat: labItem(d.lab_asamurat, d.lab_asamurat_date, 2.4, 7.0),
      sgpt: labItem(d.lab_sgpt, d.lab_sgpt_date, 0, 40),
      sgot: labItem(d.lab_sgot, d.lab_sgot_date, 0, 40),
      ldl: labItem(d.lab_ldl, d.lab_ldl_date, 0, 130),
      hdl: labItem(d.lab_hdl, d.lab_hdl_date, 40, 999)
    },
    nutrition: {
      calories: num(d.nut_cal),
      carb: num(d.nut_carb),
      protein: num(d.nut_protein),
      fat: num(d.nut_fat),
      water: num(d.nut_water),
      kafein: num(d.nut_kafein)
    },
    lifestyle: {
      steps: num(d.ls_steps),
      calories_burned: num(d.ls_cal_burn),
      active_minutes: num(d.ls_active),
      gait: d.ls_gait || 'Normal',
      smoking: num(d.ls_smoke) || 0,
      alcohol: num(d.ls_alcohol) || 0
    },
    environment: {
      aqi: num(d.env_aqi),
      temp_out: num(d.env_temp)
    },
    hrHistory: parseTrend(d.hr_history) || [72, 74, 71, 73, 76, 72, 74, 73, 75, 72, 70, 73]
  };
}

function num(val) {
  if (val === '' || val === null || val === undefined) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function labItem(val, date, min, max) {
  const v = num(val);
  if (v === null) return null;
  return {
    val: v,
    date: date || 'Terbaru',
    status: (v >= min && v <= max) ? 'normal' : (v > max * 1.2 ? 'danger' : 'warn')
  };
}

function parseTrend(val) {
  if (!val) return null;
  try {
    return String(val).split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  } catch { return null; }
}

function jsonResponse(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${json})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * CARA DEPLOY:
 * 1. Buka Google Sheets yang sudah berisi data kesehatan
 * 2. Klik Extensions > Apps Script
 * 3. Paste seluruh kode ini
 * 4. Klik Deploy > New Deployment
 * 5. Pilih Type: Web App
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Klik Deploy dan salin URL yang diberikan
 * 9. Paste URL tersebut ke pengaturan aplikasi Sehatku
 */
