// Verification form AJAX logic extracted from index.html
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verifyForm');
  const btn = document.getElementById('submitBtn');
  const resultArea = document.getElementById('resultArea');
  const emailInput = document.getElementById('email');
  if (emailInput) emailInput.focus();

  // Bulk generation button handler
  const bulkBtn = document.getElementById('bulkGenBtn');
  if (bulkBtn) {
    bulkBtn.addEventListener('click', () => {
      window.location.href = '/mode';
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      btn.innerHTML = '🔄 Verifying...';
      btn.disabled = true;

      const email = emailInput.value;
      const event = document.getElementById('event').value;

      fetch('/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, event })
      })
        .then(async (res) => {
          btn.innerHTML = '🔍 Verify & Get Certificate';
          btn.disabled = false;
          if (res.status === 200) {
            const json = await res.json();
            const d = json.data;
            resultArea.innerHTML = `
              <div class="success">✅ Certificate found for <strong>${d.name}</strong></div>
              <p>Event: ${d.event} · Issued: ${d.issued_at}</p>
              <a class="btn" href="${d.download_url}" target="_blank" rel="noopener">📥 Download Certificate</a>`;
          } else if (res.status === 404) {
            resultArea.innerHTML = '<div class="error">❌ Certificate not found</div>';
          } else {
            const j = await res.json().catch(() => ({}));
            resultArea.innerHTML = `<div class="error">❌ ${j.message || 'Unexpected error'}</div>`;
          }
        })
        .catch((err) => {
          resultArea.innerHTML = '<div class="error">❌ Network error</div>';
          btn.innerHTML = '🔍 Verify & Get Certificate';
          btn.disabled = false;
        });
    });
  }
});
