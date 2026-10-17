const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inisialisasi Database SQLite
const dbFile = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Gagal terhubung ke database:', err.message);
    } else {
        console.log('Database SQLite berhasil terhubung!');
    }
});

// Buat Tabel Orders jika belum ada
db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNumber TEXT,
    customerName TEXT,
    customerWhatsapp TEXT,
    deviceModel TEXT,
    imei TEXT,
    serviceName TEXT,
    price INTEGER,
    status TEXT DEFAULT 'Pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Endpoint API untuk Menerima Pesanan Baru (POST)
app.post('/api/orders', (req, res) => {
    const { orderNumber, customerName, customerWhatsapp, deviceModel, imei, serviceName, price } = req.body;
    
    const query = `INSERT INTO orders (orderNumber, customerName, customerWhatsapp, deviceModel, imei, serviceName, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`;
    const params = [orderNumber, customerName, customerWhatsapp, deviceModel, imei, serviceName, price];

    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Pesanan berhasil disimpan!', id: this.lastID });
    });
});

// Endpoint API untuk Mengambil Daftar Pesanan (GET)
app.get('/api/orders', (req, res) => {
    db.all(`SELECT * FROM orders ORDER BY id DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Endpoint API untuk Cek Status Pesanan Berdasarkan Nomor Order
app.get('/api/orders/status/:orderNumber', (req, res) => {
    const { orderNumber } = req.params;
    db.get(`SELECT orderNumber, customerName, deviceModel, serviceName, status, createdAt FROM orders WHERE orderNumber = ?`, [orderNumber], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'Nomor order tidak ditemukan.' });
        }
        res.json(row);
    });
});

// Endpoint API untuk Mengubah Status Pesanan (PUT)
app.put('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Status berhasil diperbarui!' });
    });
});

// Endpoint API untuk Menghapus Pesanan (DELETE)
app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM orders WHERE id = ?`, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Pesanan berhasil dihapus!' });
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server siap! Buka http://localhost:${PORT}`);
});