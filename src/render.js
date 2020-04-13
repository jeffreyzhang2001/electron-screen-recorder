const { desktopCapturer, remote } = require('electron')
const { writeFile } = require('fs');
const { dialog, Menu } = remote

// Declare mediaRecorder and recordedChunks array for video storage
let mediaRecorder
const recordedChunks = []

const videoElement = document.querySelector('video')
const videoSelectButton = document.getElementById('videoSelectButton')
videoSelectButton.onclick = getVideoSources
    
const startButton = document.getElementById('startButton')
startButton.onclick = e => {
    mediaRecorder.start()
    startButton.classList.add('is-danger')
    startButton.innerText = 'Recording 🔴'
}

const stopButton = document.getElementById('stopButton')
stopButton.onclick = e => {
    mediaRecorder.stop()
    startButton.classList.remove('is-danger')
    startButton.innerText = 'Start'
}

// Get the available video sources using Electron's desktopCapturer
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    })

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            }
        })
    )

    videoOptionsMenu.popup()
}

async function selectSource(source) {
    videoSelectButton.innerText = "Source: " + source.name

    const streamSettings = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    }

    // Create and view preview
    const preview = await navigator.mediaDevices.getUserMedia(streamSettings)
    videoElement.srcObject = preview
    videoElement.play()

    const recordingSettings = { mimeType: 'video/webm; codeces=vp9' }
    mediaRecorder = new MediaRecorder(preview, recordingSettings)

    mediaRecorder.ondataavailable = handleDataAvailable
    mediaRecorder.onstop = handleStop
}

//
function handleDataAvailable(e) {
    recordedChunks.push(e.data)
}

// Save video using buffer
async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    })

    const buffer = Buffer.from(await blob.arrayBuffer())
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `screenrecording-${Date.now()}.webm`
    })

    if (filePath) {
        writeFile(filePath, buffer, () => console.log("Saved succesfully."))
    }
}