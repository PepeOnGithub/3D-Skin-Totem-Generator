const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
});

const status = document.getElementById('status');
const skinInput = document.getElementById('skin-input');
const downloadBtn = document.getElementById('download-btn');
const packNameInput = document.getElementById('pack-name');
const canvas = document.getElementById('totem-canvas');
const ctx = canvas.getContext('2d');
let templateZip = null;
let skinImg = new Image();

status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading template...';

// Fetch the ZIP template (replace with your actual template URL or path)
fetch('Totem_Template.zip')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    templateZip = JSZip.loadAsync(buffer);
    status.innerHTML = '<i class="fas fa-check-circle"></i> Template loaded!';
  })
  .catch(error => {
    console.error('Template error:', error);
    alert(`Template loading failed: ${error.message}`);
  });

skinInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        skinImg.onload = () => {
            ctx.clearRect(0, 0, 64, 64);
            ctx.drawImage(skinImg, 4, 4, 56, 56); // Draw the skin onto the totem template
        };
        skinImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

downloadBtn.addEventListener('click', async () => {
    if (!templateZip) return alert('Template still loading...');
    if (!skinImg.src) return alert('Please upload a skin image first.');

    try {
        const packName = packNameInput.value.trim() || 'MyTotemPack';
        const safeFileName = `${packName.replace(/[^a-z0-9]/gi, '_')}.mcpack`;
        const cleanName = packName.replace(/_/g, ' ');
        
        // Clone the template ZIP to modify it
        const newZip = templateZip.clone();
        
        // Convert the canvas image to a blob and add it to the ZIP
        canvas.toBlob((blob) => {
            const textureFolder = newZip.folder(`${packName}/textures/items`);
            textureFolder.file('totem_of_undying.png', blob);

            // Create the manifest.json file
            const manifest = {
                format_version: 2,
                header: {
                    name: cleanName,
                    description: `${cleanName} generated using Pepe's Totem Skin Generator`,
                    uuid: uuidv4(),
                    version: [1, 0, 0]
                },
                modules: [{
                    type: "resources",
                    uuid: uuidv4(),
                    version: [1, 0, 0]
                }]
            };
            newZip.file(`${packName}/manifest.json`, JSON.stringify(manifest, null, 4));
            
            // Generate the .mcpack file
            newZip.generateAsync({ type: 'blob' }).then(content => {
                saveAs(content, safeFileName);
            });
        }, 'image/png');
    } catch (error) {
        console.error('Generation error:', error);
        alert('Failed to create totem skin pack: ' + error.message);
    }
});

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}