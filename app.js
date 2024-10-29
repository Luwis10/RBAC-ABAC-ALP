// Import express untuk membuat server dan rute
const express = require('express');
const session = require('express-session'); // Menggunakan session untuk menyimpan data autentikasi pengguna
const bodyParser = require('body-parser'); // Parsing data dari form
const path = require('path'); // Modul untuk menangani dan mengubah path file
const app = express(); // Inisialisasi aplikasi Express

// Konfigurasi body-parser untuk mem-parsing data dari form
app.use(bodyParser.urlencoded({ extended: true }));

// Konfigurasi session untuk menyimpan data autentikasi pengguna secara sementara
app.use(session({
    secret: 'my-secret-key', // Kunci rahasia untuk mengenkripsi session
    resave: false, // Session tidak akan disimpan ulang jika tidak ada perubahan
    saveUninitialized: true, // Menyimpan session meski belum ada data autentikasi
    cookie: { secure: false } // secure: true digunakan jika HTTPS diaktifkan pada produksi
}));

// Menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Data pengguna hardcoded untuk contoh autentikasi
const users = {
    adminHR: { password: 'password123', department: 'HR', role: 'Admin', clearance: 3, seniority: 5 },
    staffIT: { password: 'password123', department: 'IT', role: 'Staff', clearance: 1, seniority: 2 },
    managerFinance: { password: 'password123', department: 'Finance', role: 'Manager', clearance: 2, seniority: 7 },
    directorLegal: { password: 'password123', department: 'Legal', role: 'Director', clearance: 3, seniority: 10 },
    staffOps: { password: 'password123', department: 'Operations', role: 'Staff', clearance: 1, seniority: 1 },
    managerHR: { password: 'password123', department: 'HR', role: 'Manager', clearance: 2, seniority: 8 },
    staffFinance: { password: 'password123', department: 'Finance', role: 'Staff', clearance: 1, seniority: 3 },
};

// Middleware untuk memeriksa apakah pengguna sudah login sebelum mengakses rute tertentu
function checkLogin(req, res, next) {
    if (req.session.user) {
        next(); // Jika pengguna sudah login, lanjutkan ke rute berikutnya
    } else {
        res.status(401).send('Please login first'); // Kembali ke halaman login jika belum terautentikasi
    }
}

// Middleware untuk otorisasi pengguna berdasarkan kebijakan akses
function authorize(routePolicy) {
    return (req, res, next) => {
        const user = req.session.user;
        if (!user) return res.status(403).send('User not found');

        // Mengevaluasi kebijakan akses berdasarkan fungsi routePolicy
        if (routePolicy(user)) {
            next(); // Lanjutkan ke rute jika pengguna memenuhi kebijakan
        } else {
            res.status(403).send('Access denied'); // Tampilkan pesan ditolak jika tidak sesuai
        }
    };
}

// Kebijakan akses untuk berbagai rute berdasarkan peran, clearance, dan senioritas
const policies = {
    adminOnly: user => user.role === 'Admin',
    hrDepartment: user => user.department === 'HR',
    financeManager: user => user.department === 'Finance' && user.role === 'Manager' && user.seniority >= 5,
    itClearance2: user => user.department === 'IT' && user.clearance >= 2,
    legalDirector: user => user.department === 'Legal' && user.role === 'Director' && user.clearance === 3,
    opsCombined: user => user.department === 'Operations' && user.role === 'Staff' && user.clearance === 1 && user.seniority < 3,
    execClearance3: user => (user.role === 'Manager' || user.role === 'Director') && user.clearance === 3 && user.seniority >= 7,
};

// Rute untuk login, menerima data username dan password dari form
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username]; // Mencari pengguna berdasarkan username

    if (user && user.password === password) {
        // Jika autentikasi berhasil, simpan data user dalam session
        req.session.user = { username, ...user };
        res.send('Login successful');
    } else {
        res.status(401).send('Invalid credentials'); // Tampilkan pesan jika login gagal
    }
});

// Rute untuk logout, menghapus session pengguna
app.post('/logout', (req, res) => {
    req.session.destroy(); // Menghapus session
    res.send('Logged out');
});

// Rute tambahan untuk logout menggunakan metode GET (opsional)
app.get('/logout', (req, res) => {
    req.session.destroy(); // Menghapus session
    res.send('Logged out');
});

// Rute dengan kebijakan akses yang berbeda untuk setiap peran atau clearance
app.get('/admin', checkLogin, authorize(policies.adminOnly), (req, res) => res.send('Welcome to Admin-Only route'));
app.get('/hr-department', checkLogin, authorize(policies.hrDepartment), (req, res) => res.send('Welcome to HR Department route'));
app.get('/finance-manager', checkLogin, authorize(policies.financeManager), (req, res) => res.send('Welcome to Finance Manager route'));
app.get('/it-clearance-2', checkLogin, authorize(policies.itClearance2), (req, res) => res.send('Welcome to IT Clearance 2 route'));
app.get('/legal-director', checkLogin, authorize(policies.legalDirector), (req, res) => res.send('Welcome to Legal Director route'));
app.get('/ops-combined', checkLogin, authorize(policies.opsCombined), (req, res) => res.send('Welcome to Ops Combined route'));
app.get('/exec-clearance-3', checkLogin, authorize(policies.execClearance3), (req, res) => res.send('Welcome to Exec Clearance 3 route'));

// Menyajikan halaman login saat pengguna mengakses rute /login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html')); // Menampilkan file login.html
});

// Menjalankan server pada port yang ditentukan
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`); // Log bahwa server berjalan pada port 3000
});
