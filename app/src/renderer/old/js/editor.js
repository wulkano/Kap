import {remote, ipcRenderer} from 'electron'
import aspectRatio from 'aspectratio'
import moment from 'moment'

// note: `./` == `/app/dist/renderer/views`, not `js`
import {handleKeyDown, validateNumericInput} from '../js/input-utils'
import {handleTrafficLightsClicks, $, handleActiveButtonGroup} from '../js/utils'

// webpack stuff
/* eslint-disable import/no-unassigned-import */
require('../../css/editor.css')
require('./disable-zoom.js')
/* eslint-enable import/no-unassigned-import */

const {app} = remote

document.addEventListener('DOMContentLoaded', () => {
  const playBtn = $('.js-play-video')
  const pauseBtn = $('.js-pause-video')
  const maximizeBtn = $('.js-maximize-video')
  const unmaximizeBtn = $('.js-unmaximize-video')
  const previewTime = $('.js-video-time')
  const discardBtn = $('.discard')
  const inputHeight = $('.input-height')
  const inputWidth = $('.input-width')
  const fps15Btn = $('#fps-15')
  const fpsMaxBtn = $('#fps-max')
  const loopOffBtn = $('#loop-off')
  const loopOnBtn = $('#loop-on')
  const preview = $('#preview')
  const previewContainer = $('.video-preview')
  const progressBar = $('progress')
  const saveBtn = $('.save')
  const windowHeader = $('.window-header')

  let maxFps = app.kap.settings.get('fps')
  maxFps = maxFps > 30 ? 30 : maxFps
  let fps = 15
  let loop = true

  let lastValidInputWidth
  let lastValidInputHeight
  let aspectRatioBaseValues

  handleTrafficLightsClicks({hide: true})
  handleActiveButtonGroup({buttonGroup: fps15Btn.parentNode})
  handleActiveButtonGroup({buttonGroup: loopOffBtn.parentNode})

  fpsMaxBtn.children[0].innerText = maxFps

  preview.oncanplay = function () {
    aspectRatioBaseValues = [this.videoWidth, this.videoHeight];
    [inputWidth.value, inputHeight.value] = aspectRatioBaseValues;
    [lastValidInputWidth, lastValidInputHeight] = aspectRatioBaseValues

    progressBar.max = preview.duration
    setInterval(() => {
      progressBar.value = preview.currentTime
      previewTime.innerText = `${moment().startOf('day').seconds(preview.currentTime).format('m:ss')}`
    }, 1)

    // remove the listener since it's called
    // every time the video loops
    preview.oncanplay = undefined
  }

  pauseBtn.onclick = function () {
    this.classList.add('hidden')
    playBtn.classList.remove('hidden')
    preview.pause()
  }

  playBtn.onclick = function () {
    this.classList.add('hidden')
    pauseBtn.classList.remove('hidden')
    preview.play()
  }

  maximizeBtn.onclick = function () {
    this.classList.add('hidden')
    unmaximizeBtn.classList.remove('hidden')
    ipcRenderer.send('toggle-fullscreen-editor-window')
    $('body').classList.add('fullscreen')
  }

  unmaximizeBtn.onclick = function () {
    this.classList.add('hidden')
    maximizeBtn.classList.remove('hidden')
    ipcRenderer.send('toggle-fullscreen-editor-window')
    $('body').classList.remove('fullscreen')
  }

  function shake(el) {
    el.classList.add('shake')

    el.addEventListener('webkitAnimationEnd', () => {
      el.classList.remove('shake')
    })

    return true
  }

  inputWidth.oninput = function () {
    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputWidth,
      empty: true,
      max: preview.videoWidth,
      min: 1,
      onInvalid: shake
    })

    const tmp = aspectRatio.resize(...aspectRatioBaseValues, this.value)
    if (tmp[1]) {
      lastValidInputHeight = tmp[1]
      inputHeight.value = tmp[1]
    }

    lastValidInputWidth = this.value || lastValidInputWidth
  }

  inputWidth.onkeydown = handleKeyDown

  inputWidth.onblur = function () {
    this.value = this.value || (shake(this) && lastValidInputWidth) // prevent the input from staying empty
  }

  inputHeight.oninput = function () {
    this.value = validateNumericInput(this, {
      lastValidValue: lastValidInputHeight,
      empty: true,
      max: preview.videoHeight,
      min: 1,
      onInvalid: shake
    })

    const tmp = aspectRatio.resize(...aspectRatioBaseValues, undefined, this.value)
    if (tmp[0]) {
      lastValidInputWidth = tmp[0]
      inputWidth.value = tmp[0]
    }

    lastValidInputHeight = this.value || lastValidInputHeight
  }

  inputHeight.onkeydown = handleKeyDown

  inputHeight.onblur = function () {
    this.value = this.value || (shake(this) && lastValidInputHeight) // prevent the input from staying empty
  }

  fps15Btn.onclick = function () {
    this.classList.add('active')
    fpsMaxBtn.classList.remove('active')
    fps = 15
  }

  fpsMaxBtn.onclick = function () {
    this.classList.add('active')
    fps15Btn.classList.remove('active')
    fps = maxFps
  }

  loopOffBtn.onclick = function () {
    this.classList.add('active')
    loopOnBtn.classList.remove('active')
    loop = false
  }

  loopOnBtn.onclick = function () {
    this.classList.add('active')
    loopOffBtn.classList.remove('active')
    loop = true
  }

  function confirmDiscard() {
    remote.dialog.showMessageBox(remote.app.kap.editorWindow, {
      type: 'question',
      buttons: ['No', 'Yes'],
      message: 'Are you sure that you want to discard this recording?',
      detail: 'It will not be saved'
    }, response => {
      if (response === 1) { // `Yes`
        ipcRenderer.send('close-editor-window')
      }
    })
  }

  discardBtn.onclick = confirmDiscard
  window.onkeyup = event => {
    if (event.keyCode === 27) { // esc
      if (maximizeBtn.classList.contains('hidden')) {
        // exit fullscreen
        unmaximizeBtn.onclick()
      } else {
        confirmDiscard()
      }
    }
  }

  saveBtn.onclick = () => {
    ipcRenderer.send('export-to-gif', {
      filePath: preview.src,
      width: inputWidth.value,
      height: inputHeight.value,
      fps,
      loop
    })
    ipcRenderer.send('close-editor-window')
  }

  ipcRenderer.on('video-src', (event, src) => {
    preview.src = src
  })

  previewContainer.onmouseover = function () {
    windowHeader.classList.remove('is-hidden')
  }

  previewContainer.onmouseout = function (event) {
    if (!Array.from(windowHeader.querySelectorAll('*')).includes(event.relatedTarget)) {
      windowHeader.classList.add('is-hidden')
    }
  }
})

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
