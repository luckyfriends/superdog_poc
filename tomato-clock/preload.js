const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  setTray: (text) => ipcRenderer.send('set-tray', text),
  onResume: (cb) => ipcRenderer.on('system-resume', cb),
})
