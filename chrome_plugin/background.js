// background.js
// 自动运行的图标动画脚本



let spriteFrames = null;
let useSpriteFrames = false;
let currentFrame = 1;
let frameStart = 1;
let frameEnd = 12;
let animSpeed = 120;
let timer = null;

function updateIcon() {
  if (useSpriteFrames && spriteFrames && spriteFrames.frames && spriteFrames.frames.length > 0) {
    // 使用 base64 数据
    const idx = currentFrame - 1;
    const iconPath = { "32": spriteFrames.frames[idx] };
    chrome.action.setIcon({ path: iconPath });
    currentFrame++;
    if (currentFrame > frameEnd || currentFrame > spriteFrames.frames.length) currentFrame = frameStart;
  } else {
    // 使用默认文件
    const framePrefix = "Images/Run (32x32)_";
    const frameSuffix = ".png";
    const iconPath = {};
    iconPath["32"] = framePrefix + currentFrame + frameSuffix;
    chrome.action.setIcon({ path: iconPath });
    currentFrame++;
    if (currentFrame > frameEnd) currentFrame = frameStart;
  }
}

function startAnimation() {
  if (timer) clearInterval(timer);
  timer = setInterval(updateIcon, animSpeed);
}

function loadConfigAndStart() {
  chrome.storage.sync.get(['animSpeed', 'animStart', 'animEnd'], (data) => {
    animSpeed = data.animSpeed || 120;
    frameStart = data.animStart || 1;
    frameEnd = data.animEnd || 12;
    currentFrame = frameStart;
    startAnimation();
  });
}

function tryLoadSpriteFramesAndStart() {
  chrome.storage.local.get('spriteFrames', (result) => {
    if (result && result.spriteFrames && result.spriteFrames.frames && result.spriteFrames.frames.length > 0) {
      spriteFrames = result.spriteFrames;
      useSpriteFrames = true;
      console.log('使用 spriteFrames 数据进行动画');
    } else {
      spriteFrames = null;
      useSpriteFrames = false;
      //console.log('spriteFrames 不存在，使用默认文件动画');
    }

    loadConfigAndStart();
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'updateAnimConfig') {
    if (timer) clearInterval(timer);
    tryLoadSpriteFramesAndStart();
  }
  if (msg && msg.type === 'startAnimation') {
    startAnimation();
  }
});

// 初始化
tryLoadSpriteFramesAndStart();
