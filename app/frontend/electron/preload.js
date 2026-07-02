const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform:    process.platform,
  onUpdate:    (cb) => ipcRenderer.on('update-available', cb),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
})
