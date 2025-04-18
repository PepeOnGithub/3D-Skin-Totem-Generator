const themeToggle = document.getElementById('theme-toggle')
const body = document.body
let templateZip = null
const status = document.getElementById('status')
const skinInput = document.getElementById('skin-input')
const downloadBtn = document.getElementById('download-btn')
const packNameInput = document.getElementById('pack-name')
const canvas = document.getElementById('totem-canvas')
const ctx = canvas.getContext('2d')
let skinImg = new Image()
let itemBaseImg = new Image()

themeToggle.addEventListener('click', ()=>body.classList.toggle('dark'))

function uuidv4(){return([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16))}

;(async function init(){
  const cached = localStorage.getItem('cachedTotemTemplate')
  if(cached){
    const buf = Uint8Array.from(atob(cached),c=>c.charCodeAt(0)).buffer
    templateZip = await JSZip.loadAsync(buf)
  } else {
    const res = await fetch('Totem_Template.zip')
    const buf = await res.arrayBuffer()
    templateZip = await JSZip.loadAsync(buf)
    localStorage.setItem('cachedTotemTemplate',btoa(String.fromCharCode(...new Uint8Array(buf))))
  }
  const itm = await templateZip.file('textures/items/totem.png').async('blob')
  itemBaseImg.src = URL.createObjectURL(itm)
  status.textContent = 'Ready to generate!'
})()

skinInput.addEventListener('change',e=>{
  const f = e.target.files[0]
  if(!f) return
  const r = new FileReader()
  r.onload = ev=>{
    skinImg.onload = ()=>{
      ctx.clearRect(0,0,64,64)
      ctx.drawImage(skinImg,4,4,56,56)
    }
    skinImg.src = ev.target.result
  }
  r.readAsDataURL(f)
})

downloadBtn.addEventListener('click',async()=>{
  if(!templateZip) return alert('Template still loading...')
  if(!skinImg.src) return alert('Please upload a skin image first.')
  try {
    const packName = packNameInput.value.trim()||'MyTotemPack'
    const safeFile = `${packName.replace(/[^a-z0-9]/gi,'_')}.mcpack`
    const clean = packName.replace(/_/g,' ')
    const newZip = templateZip.clone()
    const rawBlob = await fetch(skinImg.src).then(r=>r.blob())
    newZip.folder('textures/entity').file('totem.png',rawBlob)

    const iconCanvas = document.createElement('canvas')
    iconCanvas.width = 16
    iconCanvas.height = 16
    const iCtx = iconCanvas.getContext('2d')
    iCtx.drawImage(itemBaseImg,0,0,16,16)
    iCtx.drawImage(skinImg,8,8,8,8,4,0,8,8)
    iCtx.drawImage(skinImg,44,20,4,4,0,4,4,4)
    iCtx.drawImage(skinImg,44,20,4,4,12,4,4,4)
    iCtx.drawImage(skinImg,20,20,8,4,4,12,8,4)

    iconCanvas.toBlob(async iconBlob=>{
      newZip.folder('textures/items').file('totem.png',iconBlob)
      newZip.file('pack_icon.png',iconBlob)
      const mf = newZip.file('manifest.json')
      const manifest = JSON.parse(await mf.async('string'))
      manifest.header.name = clean
      manifest.header.description = `${clean} generated using Pepe's Totem Skin Generator`
      manifest.header.uuid = uuidv4()
      if(Array.isArray(manifest.modules)) manifest.modules.forEach(m=>m.uuid=uuidv4())
      newZip.file('manifest.json',JSON.stringify(manifest,null,4))
      const content = await newZip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:9}})
      saveAs(new File([content],safeFile,{type:'application/octet-stream'}))
    },'image/png')
  } catch(e){
    console.error(e)
    alert('Failed to create totem skin pack: '+e.message)
  }
})