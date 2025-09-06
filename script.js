document.getElementById("compareBtn").addEventListener("click", async () => {
  clearError();
  let oldFile = document.getElementById("fileOld").files[0];
  const newFile = document.getElementById("fileNew").files[0];
  
  
  if (!oldFile && !document.getElementById('fileOld')._autoLoaded) {
    const savedOldList = localStorage.getItem('instadrama-old-list');
    if (savedOldList) {
      const file = new File([savedOldList], 'followers_anterior.json', { type: 'application/json' });
      document.getElementById('fileOld')._autoLoaded = file;
      oldFile = file;
      updateOldFileInfo('followers_anterior.json (guardado automáticamente)');
    }
  }
  
  if (!oldFile && document.getElementById('fileOld')._autoLoaded) {
    oldFile = document.getElementById('fileOld')._autoLoaded;
  }
  
  if (!oldFile || !newFile) {
    showError("¡Querida, faltan archivos! ¿Nos abandonó el drama?");
    return;
  }
  
  
  if (!oldFile.name.endsWith('.json') || !newFile.name.endsWith('.json')) {
    showError("Ambos archivos deben ser .json originales de Instagram.");
    return;
  }
  
  showSpinner();
  try {
    const oldList = await extractUsernames(oldFile);
    const newList = await extractUsernames(newFile);
    
    
    const newListContent = await readFileAsText(newFile);
    localStorage.setItem('instadrama-old-list', newListContent);
    
    
    document.getElementById('autoSaveInfo').style.display = '';
    
    const lost = oldList.filter(oldUser => !newList.some(newUser => newUser.username === oldUser.username));
    const gained = newList.filter(newUser => !oldList.some(oldUser => oldUser.username === newUser.username));
    
    renderList("lostFollowers", lost, "Nadie te ha dejado... por ahora 😈");
    renderList("newFollowers", gained, "¿Nadie nuevo? Ellos se lo pierden 💅");
    document.getElementById("results").hidden = false;
    
    
    const followingFile = document.getElementById('fileFollowing').files[0];
    const notFollowBackSection = document.getElementById('notFollowBackSection');
    if (followingFile) {
      const followingList = await extractFollowing(followingFile);
      
      const notFollowBack = followingList.filter(followingUser => !newList.some(newUser => newUser.username === followingUser.username));
      renderNotFollowBackList(notFollowBack);
      notFollowBackSection.style.display = '';
    } else {
      notFollowBackSection.style.display = 'none';
    }
    
  } catch (err) {
    showError("Drama al leer el archivo. ¿Es el JSON original de Instagram?\n" + (err.message || err));
  } finally {
    hideSpinner();
  }
});


const dropZone = document.getElementById("dropZone");
["dragenter", "dragover"].forEach(evt => {
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("dragover");
  });
});
["dragleave", "drop"].forEach(evt => {
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("dragover");
  });
});
dropZone.addEventListener("drop", async e => {
  clearError();
  const files = Array.from(e.dataTransfer.files);
  let oldFile = null, newFile = null;
  files.forEach(f => {
    if (f.name.toLowerCase().includes("old") || f.name.toLowerCase().includes("anterior")) oldFile = f;
    else if (f.name.toLowerCase().includes("new") || f.name.toLowerCase().includes("actual")) newFile = f;
  });
  
  if (files.length === 2 && (!oldFile || !newFile)) {
    [oldFile, newFile] = files;
  }
  if (!oldFile || !newFile) {
    showError("Arrastra ambos archivos: anterior y actual. Nómbralos con 'old/anterior' y 'new/actual'.");
    return;
  }
  document.getElementById("fileOld").files = createFileList([oldFile]);
  document.getElementById("fileNew").files = createFileList([newFile]);
});
function createFileList(files) {
  const dt = new DataTransfer();
  files.forEach(f => dt.items.add(f));
  return dt.files;
}


async function extractUsernames(file) {
  if (file.name.endsWith('.zip')) {
    return await extractFromZip(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        let content = JSON.parse(reader.result);
        
        if (!Array.isArray(content)) {
          const arrProp = Object.values(content).find(v => Array.isArray(v));
          if (arrProp) content = arrProp;
        }
        if (!Array.isArray(content) || !content[0] || !content[0].string_list_data) {
          reject(new Error("El archivo no tiene la estructura esperada de Instagram."));
          return;
        }
        const usernames = content.map(entry => {
          try {
            return {
              username: entry.string_list_data[0].value.trim().toLowerCase(),
              href: entry.string_list_data[0].href
            };
          } catch {
            return null;
          }
        }).filter(Boolean);
        resolve(usernames);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
async function extractFromZip(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const zip = await JSZip.loadAsync(reader.result);
        let found = false;
        for (const fname of Object.keys(zip.files)) {
          if (fname.endsWith('.json')) {
            const text = await zip.files[fname].async('string');
            try {
              const content = JSON.parse(text);
              if (Array.isArray(content) && content[0] && content[0].string_list_data) {
                const usernames = content.map(entry => {
                  try {
                    return {
                      username: entry.string_list_data[0].value.trim().toLowerCase(),
                      href: entry.string_list_data[0].href
                    };
                  } catch { return null; }
                }).filter(Boolean);
                resolve(usernames);
                found = true;
                break;
              }
            } catch {}
          }
        }
        if (!found) reject(new Error("No se encontró un .json válido en el .zip."));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}


function downloadList(list, filename, type) {
  let content = "";
  if (type === "csv") {
    content = list.map(userObj => `"${userObj.username}"`).join("\n");
  } else {
    content = list.map(userObj => userObj.username).join("\n");
  }
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


function filterList(inputId, listId, originalList) {
  const q = document.getElementById(inputId).value.trim().toLowerCase();
  const filtered = originalList.filter(userObj => userObj.username.includes(q));
  renderList(listId, filtered, "No hay coincidencias");
}


let lastLost = [], lastGained = [];


function renderList(id, items, emptyMsg) {
  if (id === "lostFollowers") lastLost = items;
  if (id === "newFollowers") lastGained = items;
  const container = document.getElementById(id);
  container.innerHTML = "";
  if (items.length === 0) {
    const li = document.createElement("li");
    li.textContent = emptyMsg;
    container.appendChild(li);
    return;
  }
  items.forEach(userObj => {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = getAvatarUrl(userObj.username);
    img.alt = `Avatar de ${userObj.username}`;
    img.className = "avatar";
    
    
    img.onerror = function() {
      this.src = createFallbackAvatar(userObj.username);
    };
    
    li.appendChild(img);
    const link = document.createElement("a");
    link.href = userObj.href;
    link.textContent = userObj.username;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    li.appendChild(link);
    container.appendChild(li);
  });
}


["searchLost", "searchNew"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    if (id === "searchLost") filterList(id, "lostFollowers", lastLost);
    else filterList(id, "newFollowers", lastGained);
  });
});
document.getElementById("downloadLostTxt").addEventListener("click", () => downloadList(lastLost, "unfollows.txt", "txt"));
document.getElementById("downloadLostCsv").addEventListener("click", () => downloadList(lastLost, "unfollows.csv", "csv"));
document.getElementById("downloadNewTxt").addEventListener("click", () => downloadList(lastGained, "nuevos_seguidores.txt", "txt"));
document.getElementById("downloadNewCsv").addEventListener("click", () => downloadList(lastGained, "nuevos_seguidores.csv", "csv"));


let lastNotFollowBack = [];
async function extractFollowing(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        let content = JSON.parse(reader.result);
        if (!Array.isArray(content)) {
          const arrProp = Object.values(content).find(v => Array.isArray(v));
          if (arrProp) content = arrProp;
        }
        const usernames = content.map(entry => {
          try {
            return {
              username: entry.string_list_data[0].value.trim().toLowerCase(),
              href: entry.string_list_data[0].href
            };
          } catch {
            return null;
          }
        }).filter(Boolean);
        resolve(usernames);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
function renderNotFollowBackList(items) {
  lastNotFollowBack = items;
  const container = document.getElementById('notFollowBackList');
  container.innerHTML = '';
  if (items.length === 0) {
    const li = document.createElement('li');
    li.textContent = '¡Todos te siguen de vuelta! 💖';
    container.appendChild(li);
    return;
  }
  items.forEach(userObj => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = getAvatarUrl(userObj.username);
    img.alt = `Avatar de ${userObj.username}`;
    img.className = 'avatar';
    
    
    img.onerror = function() {
      this.src = createFallbackAvatar(userObj.username);
    };
    
    li.appendChild(img);
    const link = document.createElement('a');
    link.href = userObj.href;
    link.textContent = userObj.username;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    li.appendChild(link);
    container.appendChild(li);
  });
}
document.getElementById('downloadNotFollowBackTxt').addEventListener('click', () => downloadList(lastNotFollowBack, 'no_te_siguen_de_vuelta.txt', 'txt'));
document.getElementById('downloadNotFollowBackCsv').addEventListener('click', () => downloadList(lastNotFollowBack, 'no_te_siguen_de_vuelta.csv', 'csv'));


function showError(msg) {
  const errorDiv = document.getElementById("errorMsg");
  errorDiv.textContent = msg;
  errorDiv.hidden = false;
}
function clearError() {
  const errorDiv = document.getElementById("errorMsg");
  errorDiv.textContent = "";
  errorDiv.hidden = true;
}

function showSpinner() {
  document.getElementById("spinnerOverlay").removeAttribute("hidden");
}
function hideSpinner() {
  document.getElementById("spinnerOverlay").setAttribute("hidden", "");
}

hideSpinner();


const themeToggle = document.getElementById("themeToggle");
function setTheme(dark) {
  document.body.classList.toggle("dark", dark);
  localStorage.setItem("instadrama-theme", dark ? "dark" : "light");
  themeToggle.innerHTML = dark ? "☀️" : "🌙";
}
function getThemePref() {
  return localStorage.getItem("instadrama-theme") === "dark";
}
themeToggle.addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));
setTheme(getThemePref());


function getAvatarUrl(username) {
  
  return `https:
}


function createFallbackAvatar(username) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  
  ctx.fillStyle = '#f8bbd0';
  ctx.fillRect(0, 0, 32, 32);
  
  
  ctx.fillStyle = '#d81b60';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(username.charAt(0).toUpperCase(), 16, 16);
  
  return canvas.toDataURL();
}

function resetAll() {
  document.getElementById("fileOld").value = "";
  document.getElementById("fileNew").value = "";
  document.getElementById("results").hidden = true;
  document.getElementById("lostFollowers").innerHTML = "";
  document.getElementById("newFollowers").innerHTML = "";
  
  localStorage.removeItem('instadrama-old-list');
  document.getElementById('fileOld')._autoLoaded = null;
  document.getElementById('oldFileInfo').style.display = 'none';
  document.getElementById('autoSaveInfo').style.display = 'none';
  document.getElementById('fileOld').style.display = '';
  document.getElementById('changeOldFileBtn').style.display = 'none';
  clearError();
  hideSpinner();
}

document.getElementById("resetBtn").addEventListener("click", resetAll);


window.addEventListener('DOMContentLoaded', async () => {
  
  const savedOldList = localStorage.getItem('instadrama-old-list');
  if (savedOldList) {
    const file = new File([savedOldList], 'followers_anterior.json', { type: 'application/json' });
    const fileOld = document.getElementById('fileOld');
    fileOld._autoLoaded = file;
    updateOldFileInfo('followers_anterior.json (guardado automáticamente)');
  } else {
    
    try {
      const resp = await fetch('followers_original.json');
      if (resp.ok) {
        const content = await resp.text();
        const file = new File([content], 'followers_original.json', { type: 'application/json' });
        const fileOld = document.getElementById('fileOld');
        fileOld._autoLoaded = file;
        
        document.getElementById('oldFileInfo').innerHTML = '<span class="icon">✔️</span> followers_original.json <span style="font-size:0.92em;opacity:0.7;">(cargado automáticamente)</span>';
        document.getElementById('oldFileInfo').style.display = '';
        fileOld.style.display = 'none';
        document.getElementById('changeOldFileBtn').style.display = '';
      }
    } catch {}
  }
});

const changeOldFileBtn = document.getElementById('changeOldFileBtn');
changeOldFileBtn.addEventListener('click', () => {
  document.getElementById('fileOld').style.display = '';
  document.getElementById('oldFileInfo').style.display = 'none';
  changeOldFileBtn.style.display = 'none';
  document.getElementById('fileOld').value = '';
  document.getElementById('fileOld')._autoLoaded = null;
});

const fileOldInput = document.getElementById('fileOld');
fileOldInput.addEventListener('change', () => {
  document.getElementById('oldFileInfo').style.display = 'none';
  changeOldFileBtn.style.display = 'none';
});


function showSavedListsInfo() {
  const savedOldList = localStorage.getItem('instadrama-old-list');
  if (savedOldList) {
    try {
      const parsed = JSON.parse(savedOldList);
      const count = Array.isArray(parsed) ? parsed.length : 
                   (parsed.followers ? parsed.followers.length : 0);
      console.log('📊 Lista anterior guardada con ${count} seguidores');
    } catch (e) {
      console.log('📊 Lista anterior guardada (formato no reconocido)');
    }
  } else {
    console.log('📊 No hay lista anterior guardada');
  }
}


showSavedListsInfo();


function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}


function updateOldFileInfo(info) {
  const oldFileInfo = document.getElementById('oldFileInfo');
  const fileOld = document.getElementById('fileOld');
  const changeOldFileBtn = document.getElementById('changeOldFileBtn');
  
  oldFileInfo.innerHTML = '<span class="icon">✔️</span> ${info}';
  oldFileInfo.style.display = '';
  fileOld.style.display = 'none';
  changeOldFileBtn.style.display = '';
`}
