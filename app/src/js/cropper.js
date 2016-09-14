const {ipcRenderer} = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const body = document.querySelector('body');
  const ONE_EM = parseInt(getComputedStyle(body).fontSize, 10);
  let rect;
  let mouseIsDownOnRect = false;
  let mouseIsDownOnTLBtn = false; // top left
  let mouseIsDownOnTRBtn = false; // top right
  let mouseIsDownOnBLBtn = false; // bottom left
  let mouseIsDownOnBRBtn = false; // bottom right
  let clickWasInsideOfTheRect = false;
  const cornerBtns = {
    topLeft: undefined,
    topRight: undefined,
    bottomLeft: undefined,
    bottomRight: undefined
  };

  function autoDestroy() {
    ipcRenderer.send('close-cropper-window');
  }

  function mouseDownRect() {
    mouseIsDownOnRect = true;
    clickWasInsideOfTheRect = true;
  }

  function mouseDownTLBtn() { // top left
    mouseIsDownOnTLBtn = true;
    clickWasInsideOfTheRect = true;
  }

  function mouseDownTRBtn() { // top right
    mouseIsDownOnTRBtn = true;
    clickWasInsideOfTheRect = true;
  }

  function mouseDownBLBtn() { // bottom left
    mouseIsDownOnBLBtn = true;
    clickWasInsideOfTheRect = true;
  }
  function mouseDownBRBtn() { // bottom right
    mouseIsDownOnBRBtn = true;
    clickWasInsideOfTheRect = true;
  }

  function mouseUp() {
    console.log(clickWasInsideOfTheRect);
    mouseIsDownOnRect = false;
    mouseIsDownOnTLBtn = false;
    mouseIsDownOnTRBtn = false;
    mouseIsDownOnBLBtn = false;
    mouseIsDownOnBRBtn = false;

    if (!clickWasInsideOfTheRect) {
      return autoDestroy();
    }
    clickWasInsideOfTheRect = false;
  }

  function initializeRect() {
    rect = document.createElement('div');
    rect.id = 'rect';
    body.appendChild(rect);

    const {top, left, width, height} = getComputedStyle(rect);
    rect.style.top = top;
    rect.style.left = left;
    rect.style.width = width;
    rect.style.height = height;
    // ^ so we can use it later if the user drags the rect before resizing it
  }

  function updateCornerButtons() {
    const ids = ['top-left-btn', 'top-right-btn', 'bottom-left-btn', 'bottom-right-btn'];
    if (cornerBtns.topLeft === undefined) { // first draw
      for (const btn in cornerBtns) {
        if ({}.hasOwnProperty.call(cornerBtns, btn)) {
          cornerBtns[btn] = document.createElement('div');
          cornerBtns[btn].id = ids.shift();
          cornerBtns[btn].className = 'corner-btn';
          body.appendChild(cornerBtns[btn]);
        }
      }
    }
    let el;

    el = cornerBtns.topLeft;
    el.style.left = `${rect.offsetLeft - (ONE_EM * 0.5)}px`;
    el.style.top = `${rect.offsetTop - (ONE_EM * 0.5)}px`;

    el = cornerBtns.topRight;
    el.style.left = `${(rect.offsetWidth + rect.offsetLeft) - (ONE_EM * 0.5)}px`;
    el.style.top = `${rect.offsetTop - (ONE_EM * 0.5)}px`;

    el = cornerBtns.bottomLeft;
    el.style.left = `${rect.offsetLeft - (ONE_EM * 0.5)}px`;
    el.style.top = `${(rect.offsetHeight + rect.offsetTop) - (ONE_EM * 0.5)}px`;

    el = cornerBtns.bottomRight;
    el.style.left = `${(rect.offsetWidth + rect.offsetLeft) - (ONE_EM * 0.5)}px`;
    el.style.top = `${(rect.offsetHeight + rect.offsetTop) - (ONE_EM * 0.5)}px`;
  }

  function mouseMove(event) { // TODO: https://cdn.meme.am/instances/500x/58848550.jpg
    if (mouseIsDownOnTLBtn) {
      console.log('top left');
      rect.style.top = `${parseInt(rect.style.top, 10) + event.movementY}px`;
      rect.style.left = `${parseInt(rect.style.left, 10) + event.movementX}px`;
      rect.style.width = `${parseInt(rect.style.width, 10) - event.movementX}px`;
      rect.style.height = `${parseInt(rect.style.height, 10) - event.movementY}px`;
    } else if (mouseIsDownOnTRBtn) {
      console.log('top right');
      rect.style.top = `${parseInt(rect.style.top, 10) + event.movementY}px`;
      rect.style.width = `${parseInt(rect.style.width, 10) + event.movementX}px`;
      rect.style.height = `${parseInt(rect.style.height, 10) - event.movementY}px`;
    } else if (mouseIsDownOnBLBtn) {
      console.log('bottom left');
      rect.style.left = `${parseInt(rect.style.left, 10) + event.movementX}px`;
      rect.style.width = `${parseInt(rect.style.width, 10) - event.movementX}px`;
      rect.style.height = `${parseInt(rect.style.height, 10) + event.movementY}px`;
    } else if (mouseIsDownOnBRBtn) {
      console.log('bottom right');
      rect.style.width = `${Math.abs(rect.offsetLeft - event.pageX)}px`;
      rect.style.height = `${Math.abs(rect.offsetTop - event.pageY)}px`;
    } else if (mouseIsDownOnRect) {
      rect.style.top = `${parseInt(rect.style.top, 10) + event.movementY}px`;
      rect.style.left = `${parseInt(rect.style.left, 10) + event.movementX}px`;
    }
    updateCornerButtons();
  }

  function keyPress(event) {
    if (event.keyCode === 27) { // esc
      autoDestroy();
    }
  }

  window.addEventListener('mouseup', mouseUp, false);
  window.addEventListener('mousemove', mouseMove, false);
  window.addEventListener('keyup', keyPress, false);

  initializeRect();
  updateCornerButtons();

  rect.addEventListener('mousedown', mouseDownRect, false);
  cornerBtns.topLeft.addEventListener('mousedown', mouseDownTLBtn);
  cornerBtns.topRight.addEventListener('mousedown', mouseDownTRBtn);
  cornerBtns.bottomLeft.addEventListener('mousedown', mouseDownBLBtn);
  cornerBtns.bottomRight.addEventListener('mousedown', mouseDownBRBtn);
});
