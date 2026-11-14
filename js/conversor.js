const dropContainer = document.getElementById('drop-container');
const fileInput = document.getElementById('file-input');
const statusBox = document.getElementById('status-box');
const fileTitle = document.getElementById('file-title');
const triggerBtn = document.getElementById('trigger-btn');
const outputString = document.getElementById('output-string');
const formatInputs = document.querySelectorAll('input[name="fmt"]');

const downloadOverlay = document.getElementById('download-overlay');
const progressBarFill = document.getElementById('progress-bar-fill');
const percentageDisplay = document.getElementById('percentage-display');
const captchaPulse = document.getElementById('captcha-pulse');

let targetFile = null;
let interactionTime = 0;

window.onload = () => {
    interactionTime = Date.now();
};

dropContainer.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    if (e.target.files.length) handleIncomingFile(e.target.files[0]);
};

dropContainer.ondragover = (e) => {
    e.preventDefault();
    dropContainer.style.borderColor = "var(--neon-blue)";
};

dropContainer.ondragleave = () => {
    dropContainer.style.borderColor = "rgba(255, 255, 255, 0.05)";
};

dropContainer.ondrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleIncomingFile(e.dataTransfer.files[0]);
};

formatInputs.forEach(input => {
    input.onchange = () => refreshStringPreview();
});

function cleanExt(name) {
    let base = name.replace(/\.zip$/i, '');
    base = base.replace(/\.(mcaddon|mcpack|mcworld|mctemplate)$/i, '');
    return base;
}

function refreshStringPreview() {
    const ext = document.querySelector('input[name="fmt"]:checked').value;
    if (targetFile) {
        const base = cleanExt(targetFile.name);
        outputString.textContent = base + "[ForgeGames]" + ext;
    } else {
        outputString.textContent = "(Nombre del archivo) [ForgeGames]" + ext;
    }
}

function handleIncomingFile(file) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
        alert('Archivo no soportado. Sube un archivo comprimido .zip');
        return;
    }
    targetFile = file;
    fileTitle.textContent = file.name;
    statusBox.style.display = 'flex';
    triggerBtn.disabled = false;
    dropContainer.style.borderColor = "rgba(255, 255, 255, 0.05)";
    refreshStringPreview();
}

triggerBtn.onclick = () => {
    if (!targetFile) return;

    const timeDiff = Date.now() - interactionTime;
    downloadOverlay.style.display = 'flex';

    if (timeDiff < 1200) {
        captchaPulse.style.display = 'block';
        setTimeout(() => {
            captchaPulse.style.display = 'none';
            executeDownloadPipeline();
        }, 2500);
    } else {
        executeDownloadPipeline();
    }
};

function executeDownloadPipeline() {
    const ext = document.querySelector('input[name="fmt"]:checked').value;
    const base = cleanExt(targetFile.name);
    const computedName = base + "[ForgeGames]" + ext;

    let currentPercent = 0;
    progressBarFill.style.width = '0%';
    percentageDisplay.textContent = '0%';

    const interval = setInterval(() => {
        currentPercent += Math.floor(Math.random() * 8) + 4;
        if (currentPercent >= 100) {
            currentPercent = 100;
            clearInterval(interval);

            progressBarFill.style.width = '100%';
            percentageDisplay.textContent = '100%';

            setTimeout(() => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const blob = new Blob([e.target.result], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const temporaryLink = document.createElement('a');
                    temporaryLink.href = url;
                    temporaryLink.download = computedName;
                    temporaryLink.click();
                    URL.revokeObjectURL(url);

                    downloadOverlay.style.display = 'none';
                };
                reader.readAsArrayBuffer(targetFile);
            }, 400);
        } else {
            progressBarFill.style.width = currentPercent + '%';
            percentageDisplay.textContent = currentPercent + '%';
        }
    }, 150);
}

refreshStringPreview();
