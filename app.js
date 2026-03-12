let appData = [];
let selectedProfile = null;
let scriptUrl = localStorage.getItem('sehatku_url') || '';

// Cek apakah URL sudah tersimpan saat aplikasi dibuka
window.onload = () => {
    if (scriptUrl) {
        document.getElementById('script-url').value = scriptUrl;
        saveUrlAndFetch();
    }
};

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

async function saveUrlAndFetch() {
    console.log("Tombol Lanjut diklik!"); // Tanda bahwa klik terdeteksi
    
    const urlInput = document.getElementById('script-url').value;
    const btnLanjut = document.querySelector('#landing-page button');
    
    if (!urlInput) {
        alert('URL tidak boleh kosong!');
        return;
    }
    
    scriptUrl = urlInput;
    localStorage.setItem('sehatku_url', scriptUrl);
    console.log("Mencoba mengambil data dari:", scriptUrl);

    // Ubah tampilan tombol agar terlihat ada pergerakan
    btnLanjut.innerText = "Memuat data...";
    btnLanjut.disabled = true;

    try {
        const response = await fetch(scriptUrl, {
            method: 'GET',
            redirect: 'follow'
        });
        
        console.log("Respons diterima, memproses JSON...");
        const data = await response.json();
        console.log("Data berhasil dibaca:", data);
        
        if (data && data.profiles) {
            appData = data.profiles;
            renderProfiles();
            showPage('profile-page');
        } else {
            alert('Format data tidak sesuai dari Apps Script.');
        }
    } catch (error) {
        console.error("Terjadi error saat fetch:", error);
        alert('Gagal! Cek Console (F12) untuk melihat detail masalahnya.');
    } finally {
        // Kembalikan tombol ke kondisi semula
        btnLanjut.innerText = "Lanjut";
        btnLanjut.disabled = false;
    }
}
// Contoh fungsi untuk mengambil data dari Google Apps Script
function ambilDataKesehatan() {
  const scriptUrl = 'URL_GOOGLE_APPS_SCRIPT_KAMU_DI_SINI'; // Ganti dengan URL Web App GAS kamu
  
  // Tampilkan indikator loading (opsional tapi disarankan)
  document.getElementById('tempat-data').innerHTML = '<p>Sedang memuat data...</p>';

  fetch(scriptUrl)
    .then(response => response.json())
    .then(data => {
      // Hapus loading dan tampilkan datanya
      // (Asumsi data dari GAS berbentuk array of objects)
      let htmlContent = '';
      data.forEach(item => {
         htmlContent += `<div class="card">
                           <h3>${item.nama}</h3>
                           <p>Status: ${item.status}</p>
                         </div>`;
      });
      
      document.getElementById('tempat-data').innerHTML = htmlContent;
    })
    .catch(error => {
      console.error('Gagal mengambil data:', error);
      document.getElementById('tempat-data').innerHTML = '<p>Gagal memuat data. Silakan coba lagi.</p>';
    });
}

// Panggil fungsi ini tepat di dalam fungsi navigasi/pindah halaman kamu
    
    scriptUrl = urlInput;
    localStorage.setItem('sehatku_url', scriptUrl);

    try {
        // Fetch data dari Google Apps Script
        const response = await fetch(scriptUrl);
        const data = await response.json();
        
        if (data && data.profiles) {
            appData = data.profiles;
            renderProfiles();
            showPage('profile-page');
        } else {
            alert('Format data tidak sesuai.');
        }
    } catch (error) {
        alert('Gagal mengambil data. Pastikan URL benar dan CORS diizinkan.');
    }
}

function renderProfiles() {
    const list = document.getElementById('profile-list');
    list.innerHTML = '';
    appData.forEach(profile => {
        const btn = document.createElement('button');
        btn.innerText = profile.name;
        btn.onclick = () => showPinSection(profile);
        list.appendChild(btn);
    });
}

function showPinSection(profile) {
    selectedProfile = profile;
    document.getElementById('selected-profile-name').innerText = profile.name;
    document.getElementById('profile-list').style.display = 'none';
    document.getElementById('pin-section').style.display = 'block';
}

function cancelPin() {
    selectedProfile = null;
    document.getElementById('pin-input').value = '';
    document.getElementById('profile-list').style.display = 'block';
    document.getElementById('pin-section').style.display = 'none';
}

function verifyPin() {
    const pin = document.getElementById('pin-input').value;
    if (pin.length !== 6) return alert('PIN harus 6 digit angka.');

    if (pin === selectedProfile.pin.toString()) {
        document.getElementById('welcome-message').innerText = `Halo, ${selectedProfile.name}`;
        showPage('dashboard-page');
    } else {
        alert('PIN salah!');
    }
}

function logout() {
    selectedProfile = null;
    document.getElementById('pin-input').value = '';
    showPage('profile-page');
    cancelPin();
}