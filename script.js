const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
let templateZip = null;
let uploadedImageBlob = null;
let totemBaseImg = new Image();
const status = document.getElementById('status');
const skinInput = document.getElementById('skin-input');
const downloadBtn = document.getElementById('download-btn');
const packNameInput = document.getElementById('pack-name');
const canvas = document.getElementById('totem-canvas');
const ctx = canvas.getContext('2d');
let skinImg = new Image();

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
});

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

(async function init() {
    try {
        const cachedTemplate = localStorage.getItem('cachedTotemTemplate');
        if (cachedTemplate) {
            const buffer = Uint8Array.from(atob(cachedTemplate), c => c.charCodeAt(0)).buffer;
            templateZip = await JSZip.loadAsync(buffer);
        } else {
            const response = await fetch('Totem_Template.zip');
            if (!response.ok) throw new Error(`Failed to fetch template (${response.status})`);
            const buffer = await response.arrayBuffer();
            templateZip = await JSZip.loadAsync(buffer);
            localStorage.setItem('cachedTotemTemplate', btoa(String.fromCharCode(...new Uint8Array(buffer))));
        }
        if (!templateZip.file('textures/entity/totem.png')) throw new Error('Template missing required files');
        const baseBlob = await templateZip.file('textures/items/totem.png').async('blob');
        totemBaseImg.src = URL.createObjectURL(baseBlob);
        status.textContent = 'Ready to generate!';
    } catch (error) {
        console.error('Template error:', error);
        alert(`Template loading failed: ${error.message}`);
    }
})();

skinInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        skinImg.onload = () => {
            if (!totemBaseImg.complete) return totemBaseImg.onload = skinImg.onload;
            ctx.clearRect(0, 0, 64, 64);
            ctx.drawImage(totemBaseImg, 0, 0, 64, 64);
            ctx.drawImage(skinImg, 8, 8, 8, 8, 28, 4, 8, 8);
            ctx.drawImage(skinImg, 40, 8, 8, 8, 28, 4, 8, 8);
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
        const newZip = templateZip.clone();
        const rawSkinBlob = await fetch(skinImg.src).then(res => res.blob());
        const entity = newZip.folder('textures/entity');
        entity.file('totem.png', rawSkinBlob);
        canvas.toBlob(async (editedBlob) => {
            const items = newZip.folder('textures/items');
            items.file('totem.png', editedBlob);
            newZip.file('pack_icon.png', editedBlob);
            const manifestFile = newZip.file('manifest.json');
            if (!manifestFile) throw new Error('manifest.json missing');
            const manifest = JSON.parse(await manifestFile.async('string'));
            manifest.header.name = cleanName;
            manifest.header.description = `${cleanName} generated using Pepe's Totem Skin Generator`;
            manifest.header.uuid = uuidv4();
            if (Array.isArray(manifest.modules)) {
                manifest.modules.forEach(mod => { mod.uuid = uuidv4(); });
            }
            newZip.file('manifest.json', JSON.stringify(manifest, null, 4));
            const content = await newZip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }
            });
            saveAs(new File([content], safeFileName, { type: 'application/octet-stream' }));
        }, 'image/png');
    } catch (error) {
        console.error('Generation error:', error);
        alert('Failed to create totem skin pack: ' + error.message);
    }
});