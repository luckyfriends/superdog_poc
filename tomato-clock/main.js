const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage, powerMonitor } = require('electron')
const path = require('path')

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win = null
let tray = null
const notificationsSupported = Notification.isSupported()

function showWindow() {
  if (win) { win.show(); win.focus() }
}

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
    { label: '显示窗口', click: showWindow },
    { type: 'separator' },
    { label: '退出', click: () => { app.exit(0) } },
  ])
  tray.setContextMenu(menu)
  tray.on('click', showWindow)
}

ipcMain.on('notify', (_e, { title, body }) => {
  if (notificationsSupported) new Notification({ title, body }).show()
})

ipcMain.on('set-tray', (_e, text) => {
  if (tray) tray.setTitle(text)
})

app.on('second-instance', showWindow)

app.whenReady().then(() => {
  createWindow()
  createTray()

  powerMonitor.on('resume', () => {
    if (win) win.webContents.send('system-resume')
  })
})

app.on('activate', showWindow)
