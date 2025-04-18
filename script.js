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
let skinImg = new Image();

status.innerHTML = '<i class="fas fa-check-circle"></i> Ready to generate!';

skinInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        skinImg.onload = () => {
            ctx.clearRect(0, 0, 64, 64);
            ctx.drawImage(skinImg, 4, 4, 56, 56); // Center inside 64x64
        };
        skinImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

downloadBtn.addEventListener('click', async () => {
    if (!skinImg.src) return alert('Please upload a skin image first.');

    try {
        const packName = packNameInput.value.trim() || 'MyTotemPack';
        const safeFileName = `${packName.replace(/[^a-z0-9]/gi, '_')}.mcpack`;
        const cleanName = packName.replace(/_/g, ' ');

        const newZip = new JSZip();

        const base = newZip.folder(packName);
        const textures = base.folder("textures");
        const items = textures.folder("items");
        const entity = textures.folder("entity");

        // 1. Save raw uploaded skin to textures/entity/totem.png
        const rawSkinBlob = await fetch(skinImg.src).then(res => res.blob());
        entity.file("totem.png", rawSkinBlob);

        // 2. Save edited version from canvas to textures/items/totem.png + pack_icon.png
        canvas.toBlob(async (editedBlob) => {
            items.file("totem.png", editedBlob);
            base.file("pack_icon.png", editedBlob);

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
            base.file("manifest.json", JSON.stringify(manifest, null, 4));

            // Create and save the .mcpack
            newZip.generateAsync({ type: 'blob' }).then(content => {
                saveAs(content, safeFileName);
            });
        }, 'image/png');

    } catch (err) {
        console.error('Generation error:', err);
        alert('Failed to generate pack: ' + err.message);
    }
});

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}