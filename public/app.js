const nameInput = document.getElementById('name');
const amountInput = document.getElementById('amount');
const tenorInput = document.getElementById('tenor');
const interestInput = document.getElementById('interestRate');
const applyBtn = document.getElementById('applyBtn');
const resultBox = document.getElementById('result');
const loanList = document.getElementById('loanList');

const apiBase = '/api/loans';

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

function showResult(message) {
  resultBox.textContent = message;
  resultBox.classList.remove('hidden');
}

function hideResult() {
  resultBox.classList.add('hidden');
}

async function loadLoans() {
  loanList.innerHTML = '<p>Memuat data pengajuan...</p>';
  try {
    const res = await fetch(apiBase);
    const loans = await res.json();
    if (!loans.length) {
      loanList.innerHTML = '<p>Belum ada pengajuan pinjaman.</p>';
      return;
    }

    loanList.innerHTML = loans.map((loan) => {
      return `
        <div class="loan-card">
          <p><strong>${loan.name}</strong></p>
          <p>Jumlah: ${formatCurrency(loan.amount)}</p>
          <p>Tenor: ${loan.tenor} bulan</p>
          <p>Bunga: ${loan.interestRate}%</p>
          <p>Angsuran per bulan: ${formatCurrency(loan.monthlyPayment)}</p>
          <p>Total bayar: ${formatCurrency(loan.totalPayment)}</p>
          <div class="loan-meta">
            <span class="status ${loan.status}">${loan.status}</span>
            ${loan.status === 'Pending' ? `<button data-id="${loan.id}">Bayar lunas</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.loan-card button').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        await repayLoan(id);
      });
    });
  } catch (error) {
    loanList.innerHTML = '<p>Terjadi kesalahan saat memuat data.</p>';
  }
}

async function repayLoan(id) {
  try {
    const res = await fetch(`${apiBase}/${id}/repay`, { method: 'POST' });
    if (!res.ok) throw new Error('Gagal melunasi pinjaman');
    await loadLoans();
    showResult('Pinjaman berhasil dilunasi. Terima kasih.');
  } catch (error) {
    showResult('Gagal melunasi pinjaman. Silakan coba lagi.');
  }
}

applyBtn.addEventListener('click', async () => {
  hideResult();
  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);
  const tenor = Number(tenorInput.value);
  const interestRate = Number(interestInput.value);

  if (!name || !amount || !tenor) {
    showResult('Harap isi semua field dengan benar.');
    return;
  }

  try {
    const res = await fetch(apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, amount, tenor, interestRate })
    });

    if (!res.ok) {
      const data = await res.json();
      showResult(data.error || 'Terjadi kesalahan pengajuan.');
      return;
    }

    const loan = await res.json();
    showResult(`Pengajuan berhasil! Cicilan per bulan: ${formatCurrency(loan.monthlyPayment)}.`);
    nameInput.value = '';
    amountInput.value = '';
    tenorInput.value = '';
    await loadLoans();
  } catch (error) {
    showResult('Gagal mengirim pengajuan. Silakan coba lagi.');
  }
});

loadLoans();
