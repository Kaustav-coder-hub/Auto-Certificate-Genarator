// Admin Dashboard interactive logic extracted from inline script
let csvFile = null;

// Counter animation function
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeOutCubic);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target.toLocaleString();
        }
    }
    
    requestAnimationFrame(update);
}

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
  if (generateBtn) generateBtn.disabled = !csvFile; // Only require CSV file now
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
    const progressPercent = document.getElementById('progressPercent');
    if (progressPercent) progressPercent.textContent = '0%';
    statusLog.innerHTML = '<p>📋 Preparing to upload CSV data...</p>';

    // First, upload CSV
    const uploadFormData = new FormData();
    uploadFormData.append('csv', csvFile);
    uploadFormData.append('eventName', document.getElementById('eventName').value);

    try {
      const uploadResponse = await fetch('/admin/upload-csv', { method: 'POST', body: uploadFormData });
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        statusLog.innerHTML += `<p class="error">✗ CSV Upload Error: ${error.message || 'Failed to upload CSV'}</p>`;
        generateBtn.disabled = false;
        return;
      }
      
      const uploadResult = await uploadResponse.json();
      statusLog.innerHTML += `<p class="success">✓ ${uploadResult.message}</p>`;

      // Now generate certificates
      statusLog.innerHTML += '<p>📋 Starting certificate generation...</p>';

      // Collect form data for generation
      const genFormData = new FormData();
      genFormData.append('fontFamily', document.getElementById('fontFamily').value);
      genFormData.append('fontSize', document.getElementById('fontSize').value);
      genFormData.append('textColor', document.getElementById('textColor').value);
      genFormData.append('centerX', document.getElementById('centerX').value);
      genFormData.append('centerY', document.getElementById('centerY').value);

      const response = await fetch('/admin/generate-bulk', { method: 'POST', body: genFormData });
      if (response.ok) {
        const result = await response.json();

        const interval = setInterval(() => {
          progress += 10;
          if (progress <= 100) {
            progressFill.style.width = progress + '%';
            if (progressPercent) progressPercent.textContent = progress + '%';

            if (progress === 20) {
              statusLog.innerHTML += '<p class="success">✓ CSV uploaded successfully</p>';
            } else if (progress === 40) {
              statusLog.innerHTML += '<p class="success">✓ Using predefined Sample1.png template</p>';
            } else if (progress === 60) {
              statusLog.innerHTML += '<p class="success">✓ Processing participants...</p>';
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
