// Coordinate selector logic for configure_coordinates.html
document.addEventListener('DOMContentLoaded', () => {
	const fileInput = document.getElementById('coordTemplate');
	const wrapper = document.getElementById('canvasWrapper');
	const img = document.getElementById('templatePreviewImg');
	const marker = document.getElementById('marker');
	const xInput = document.getElementById('coordX');
	const yInput = document.getElementById('coordY');
	const statusEl = document.getElementById('coordStatus');

	if (!fileInput || !wrapper) return;

	fileInput.addEventListener('change', (e) => {
		const f = e.target.files[0];
		if (!f) return;
		const url = URL.createObjectURL(f);
		img.src = url;
		wrapper.style.display = 'block';
	});

	wrapper.addEventListener('click', (e) => {
		const rect = wrapper.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;
		marker.style.left = clickX + 'px';
		marker.style.top = clickY + 'px';
		marker.style.display = 'block';
		xInput.value = Math.round(clickX);
		yInput.value = Math.round(clickY);
	});

	const saveBtn = document.getElementById('saveCoords');
	if (saveBtn) {
		saveBtn.addEventListener('click', () => {
			statusEl.textContent = `Coordinates saved locally. X=${xInput.value}, Y=${yInput.value}. Copy these into the generator form.`;
		});
	}
});
