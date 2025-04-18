const themeToggle = document.getElementById('theme-toggle'); const body = document.body; themeToggle.addEventListener('click', () => { body.classList.toggle('dark'); });

const status = document.getElementById('status'); const skinInput = document.getElementById('skin-input'); const downloadBtn = document.getElementById('download-btn'); const packNameInput = document.getElementById('pack-name'); const canvas = document.getElementById('totem-canvas'); const ctx = canvas.getContext('2d'); let templateImg = new Image(); let skinImg = new Image();

status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading template...'; templateImg.src = 'https://raw.githubusercontent.com/Pepe1502/mc-bedrock-totem-skin-generator/main/totem_template.png'; templateImg.onload = () => { ctx.drawImage(templateImg, 0, 0); status.innerHTML = '<i class="fas fa-check-circle"></i> Template loaded!'; };

skinInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function (event) { skinImg.onload = () => { ctx.drawImage(templateImg, 0, 0); ctx.drawImage(skinImg, 4, 4, 56, 56); }; skinImg.src = event.target.result; }; reader.readAsDataURL(file); });

downloadBtn.addEventListener('click', () => { const zip = new JSZip(); const name = packNameInput.value.trim() || 'MyTotemPack'; const textureFolder = zip.folder(${name}/textures/items); const manifest = { format_version: 2, header: { name: name, description: "Generated Totem Skin", uuid: crypto.randomUUID(), version: [1, 0, 0] }, modules: [ { type: "resources", uuid: crypto.randomUUID(), version: [1, 0, 0] } ] }; zip.file(${name}/manifest.json, JSON.stringify(manifest, null, 2)); canvas.toBlob((blob) => { textureFolder.file("totem_of_undying.png", blob); zip.generateAsync({ type: "blob" }).then(content => { saveAs(content, ${name}.mcpack); }); }); });

                             
