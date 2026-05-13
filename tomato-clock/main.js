const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage, powerMonitor } = require('electron')
const path = require('path')

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win = null
let tray = null

function createWindow() {
  win = new BrowserWindow({
    width: 360,
    height: 480,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })
  win.loadFile('index.html')

  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
  })
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setTitle('🍅')
  tray.setToolTip('Tomato Clock')

  const menu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => { win.show(); win.focus() } },
    { type: 'separator' },
    { label: '退出', click: () => { app.exit(0) } },
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => { win.show(); win.focus() })
}

ipcMain.on('notify', (_e, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
})

ipcMain.on('set-tray', (_e, text) => {
  if (tray) tray.setTitle(text)
})

app.on('second-instance', () => {
  if (win) { win.show(); win.focus() }
})

app.whenReady().then(() => {
  createWindow()
  createTray()

  powerMonitor.on('resume', () => {
    if (win) win.webContents.send('system-resume')
  })
})

app.on('activate', () => {
  if (win) { win.show(); win.focus() }
})
