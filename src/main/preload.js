// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loading...');

// Expose Electron API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectDirectory: () => {
    console.log('selectDirectory called from renderer');
    return ipcRenderer.invoke('select-directory');
  },
  readFile: (filePath) => {
    console.log('readFile called:', filePath);
    return ipcRenderer.invoke('read-file', filePath);
  },
  writeFile: (filePath, content) => {
    console.log('writeFile called:', filePath);
    return ipcRenderer.invoke('write-file', filePath, content);
  },
  createDirectory: (dirPath) => {
    console.log('createDirectory called:', dirPath);
    return ipcRenderer.invoke('create-directory', dirPath);
  },
  readDirectory: (dirPath) => {
    console.log('readDirectory called:', dirPath);
    return ipcRenderer.invoke('read-directory', dirPath);
  },
  deleteFile: (filePath) => {
    console.log('deleteFile called:', filePath);
    return ipcRenderer.invoke('delete-file', filePath);
  },

  // Menu event listeners
  onMenuNewProject: (callback) => {
    ipcRenderer.on('menu-new-project', callback);
  },
  onMenuOpenProject: (callback) => {
    ipcRenderer.on('menu-open-project', callback);
  },
  onMenuSave: (callback) => {
    ipcRenderer.on('menu-save', callback);
  },

  // Cleanup listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

console.log('Preload script loaded successfully, electronAPI exposed to window');