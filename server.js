const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'loans.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readLoans() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeLoans(loans) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(loans, null, 2), 'utf8');
}

app.get('/api/loans', (req, res) => {
  res.json(readLoans());
});

app.post('/api/loans', (req, res) => {
  const { name, amount, tenor, interestRate } = req.body;
  if (!name || !amount || !tenor || !interestRate) {
    return res.status(400).json({ error: 'Lengkapi semua field pengajuan pinjaman.' });
  }

  const principal = Number(amount);
  const months = Number(tenor);
  const rate = Number(interestRate) / 100;
  const monthlyPayment = Number(((principal * rate) / (1 - Math.pow(1 + rate, -months))).toFixed(2));
  const totalPayment = Number((monthlyPayment * months).toFixed(2));

  const loans = readLoans();
  const newLoan = {
    id: Date.now().toString(),
    name,
    amount: principal,
    tenor: months,
    interestRate: Number(interestRate),
    monthlyPayment,
    totalPayment,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  loans.unshift(newLoan);
  writeLoans(loans);

  res.status(201).json(newLoan);
});

app.post('/api/loans/:id/repay', (req, res) => {
  const loans = readLoans();
  const loan = loans.find((item) => item.id === req.params.id);
  if (!loan) {
    return res.status(404).json({ error: 'Pinjaman tidak ditemukan.' });
  }
  loan.status = 'Lunas';
  writeLoans(loans);
  res.json(loan);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
