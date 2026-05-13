const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('api', {
  notify: (title, body) => {},
  setTray: (text) => {},
})
