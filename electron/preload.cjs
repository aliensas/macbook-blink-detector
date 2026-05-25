const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("alsAacSpeech", {
  speak(payload) {
    return ipcRenderer.invoke("speech:speak", payload);
  },
  cancel() {
    return ipcRenderer.invoke("speech:cancel");
  },
  status() {
    return ipcRenderer.invoke("speech:status");
  },
});
