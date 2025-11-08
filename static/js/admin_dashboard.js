// Admin Dashboard interactive logic extracted from inline script
let templateFile = null;
let csvFile = null;

// Template upload handling
const templateBox = document.getElementById('templateBox');
const templateInput = document.getElementById('templateInput');
const templatePreview = document.getElementById('templatePreview');

if (templateBox) {
  templateBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    templateBox.classList.add('dragover');
  });

  templateBox.addEventListener('dragleave', () => {
    templateBox.classList.remove('dragover');
  });

  templateBox.addEventListener('drop', (e) => {
    e.preventDefault();
    templateBox.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleTemplateFile(file);
    }
  });
}

if (templateInput) {
  templateInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      handleTemplateFile(e.target.files[0]);
    }
  });
}

function handleTemplateFile(file) {
  templateFile = file;
  templatePreview.innerHTML = `
    <div class="preview-item">
      <div class="preview-info">
        <span>🖼️</span>
        <div>
          <strong>${file.name}</strong>
          <p style="color: #7f8c8d; font-size: 0.9rem; margin: 0;">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      </div>
      <button class="remove-btn" onclick="removeTemplate()">Remove</button>
    </div>
  `;
  templatePreview.classList.add('active');
  checkReadyToGenerate();
}

window.removeTemplate = function () {
  templateFile = null;
  templatePreview.classList.remove('active');
  templateInput.value = '';
  checkReadyToGenerate();
};

// CSV upload handling
const csvBox = document.getElementById('csvBox');
const csvInput = document.getElementById('csvInput');
const csvPreview = document.getElementById('csvPreview');

if (csvBox) {
  csvBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    csvBox.classList.add('dragover');
  });

  csvBox.addEventListener('dragleave', () => {
    csvBox.classList.remove('dragover');
  });

  csvBox.addEventListener('drop', (e) => {
    e.preventDefault();
    csvBox.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleCSVFile(file);
    }
  });
}

if (csvInput) {
  csvInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      handleCSVFile(e.target.files[0]);
    }
  });
}

function handleCSVFile(file) {
  csvFile = file;
  csvPreview.innerHTML = `
    <div class="preview-item">
      <div class="preview-info">
        <span>📑</span>
        <div>
          <strong>${file.name}</strong>
          <p style="color: #7f8c8d; font-size: 0.9rem; margin: 0;">${(file.size / 1024).toFixed(2)} KB</p>
        </div>
      </div>
      <button class="remove-btn" onclick="removeCSV()">Remove</button>
    </div>
  `;
  csvPreview.classList.add('active');
  checkReadyToGenerate();
}

window.removeCSV = function () {
  csvFile = null;
  csvPreview.classList.remove('active');
  csvInput.value = '';
  checkReadyToGenerate();
};

function checkReadyToGenerate() {
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) generateBtn.disabled = !(templateFile && csvFile);
}

// Generate certificates
const generateBtnEl = document.getElementById('generateBtn');
if (generateBtnEl) {
  generateBtnEl.addEventListener('click', async () => {
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const statusLog = document.getElementById('statusLog');
    const generateBtn = document.getElementById('generateBtn');

    // Show progress section
    progressSection.classList.add('active');
    progressSection.scrollIntoView({ behavior: 'smooth' });
    generateBtn.disabled = true;

    // Reset progress
    progressFill.style.width = '0%';
    progressFill.textContent = '0%';
    statusLog.innerHTML = '<p>📋 Preparing to generate certificates...</p>';

    // Collect form data
    const formData = new FormData();
    formData.append('template', templateFile);
    formData.append('csv', csvFile);
    formData.append('fontFamily', document.getElementById('fontFamily').value);
    formData.append('fontSize', document.getElementById('fontSize').value);
    formData.append('textColor', document.getElementById('textColor').value);
    formData.append('eventName', document.getElementById('eventName').value);
    formData.append('centerX', document.getElementById('centerX').value);
    formData.append('centerY', document.getElementById('centerY').value);

    try {
      const response = await fetch('/admin/generate-bulk', { method: 'POST', body: formData });
      if (response.ok) {
        const result = await response.json();

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress <= 100) {
            progressFill.style.width = progress + '%';
            progressFill.textContent = progress + '%';

            if (progress === 30) {
              statusLog.innerHTML += '<p class="success">✓ Template uploaded successfully</p>';
            } else if (progress === 50) {
              statusLog.innerHTML += '<p class="success">✓ CSV data parsed</p>';
            } else if (progress === 80) {
              statusLog.innerHTML += '<p class="success">✓ Generating certificates...</p>';
            } else if (progress === 100) {
              statusLog.innerHTML += `<p class="success">✓ ${result.message || 'All certificates generated successfully!'}</p>`;
              statusLog.innerHTML += `<p class="success">📧 Total: ${result.total || 0} certificates</p>`;
              generateBtn.disabled = false;
            }
            statusLog.scrollTop = statusLog.scrollHeight;
          } else {
            clearInterval(interval);
          }
        }, 500);
      } else {
        const error = await response.json();
        statusLog.innerHTML += `<p class="error">✗ Error: ${error.message || 'Failed to generate certificates'}</p>`;
        generateBtn.disabled = false;
      }
    } catch (err) {
      statusLog.innerHTML += `<p class="error">✗ Network error: ${err.message}</p>`;
      generateBtn.disabled = false;
    }
  });
}
