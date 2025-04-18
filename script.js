
downloadBtn.addEventListener('click', async () => {
    if (!templateZip) return alert('Template still loading...');
    if (!skinImg.src) return alert('Please upload a skin image first.');
    try {
        const packName = packNameInput.value.trim() || 'MyTotemPack';
        const safeFileName = `${packName.replace(/[^a-z0-9]/gi, '_')}.mcpack`;
        const cleanName = packName.replace(/_/g, ' ');
        const newZip = templateZip.clone();

        // 1. Create a new 16x16 canvas to draw the head (like the totem)
        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = 16;
        iconCanvas.height = 16;
        const iconCtx = iconCanvas.getContext('2d');

        // 2. Draw the face (head front) from skin: source x=8 y=8 w=8 h=8
        iconCtx.drawImage(skinImg, 8, 8, 8, 8, 4, 0, 8, 8);

        // 3. Optional: draw the body under it (source x=20 y=20 w=8 h=12)
        iconCtx.drawImage(skinImg, 20, 20, 8, 12, 4, 8, 8, 8);

        // 4. Convert to blob and replace both totem textures and pack_icon
        iconCanvas.toBlob(async (iconBlob) => {
            const entity = newZip.folder('textures/entity');
            entity.file('totem.png', iconBlob);
            const items = newZip.folder('textures/items');
            items.file('totem.png', iconBlob);
            newZip.file('pack_icon.png', iconBlob);

            // 5. Update manifest
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

            // 6. Export as .mcpack
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