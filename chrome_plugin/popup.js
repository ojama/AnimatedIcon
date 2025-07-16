  const startAnimBtn = document.getElementById('startAnimBtn');
  startAnimBtn.onclick = () => {
    chrome.runtime.sendMessage({ type: 'startAnimation' });
    statusDiv.textContent = chrome.i18n ? chrome.i18n.getMessage('start_anim_status') || 'Animation started' : 'Animation started';
    setTimeout(() => statusDiv.textContent = '', 1200);
  };
// popup.js: 动画设置界面逻辑和精灵图切分
function i18nReplace() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = chrome.i18n.getMessage(key);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  i18nReplace();
  // 动画设置部分
  const speedInput = document.getElementById('speed');
  const startFrameInput = document.getElementById('startFrame');
  const endFrameInput = document.getElementById('endFrame');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  chrome.storage.sync.get(['animSpeed', 'animStart', 'animEnd'], (data) => {
    if (data.animSpeed) speedInput.value = data.animSpeed;
    if (data.animStart) startFrameInput.value = data.animStart;
    if (data.animEnd) endFrameInput.value = data.animEnd;
  });

  saveBtn.onclick = () => {
    const speed = Math.max(20, parseInt(speedInput.value, 10) || 120);
    const start = Math.max(1, parseInt(startFrameInput.value, 10) || 1);
    const end = Math.max(start, parseInt(endFrameInput.value, 10) || 12);
    chrome.storage.sync.set({
      animSpeed: speed,
      animStart: start,
      animEnd: end
    }, () => {
      statusDiv.textContent = '设置已保存';
      setTimeout(() => statusDiv.textContent = '', 1200);
      chrome.runtime.sendMessage({ type: 'updateAnimConfig' });
    });
  };

  // 精灵图切分部分
  const spriteFileInput = document.getElementById('spriteFile');
  const frameWidthInput = document.getElementById('frameWidth');
  const frameHeightInput = document.getElementById('frameHeight');
  const splitBtn = document.getElementById('splitBtn');
  const splitStatus = document.getElementById('splitStatus');
  const resetBtn = document.getElementById('resetBtn');
  // 重置按钮逻辑
  resetBtn.onclick = () => {
    chrome.storage.local.remove('spriteFrames', () => {
      splitStatus.textContent = '已重置为默认动画';
      chrome.runtime.sendMessage({ type: 'updateAnimConfig' });
    });
  };

  splitBtn.onclick = () => {
    const file = spriteFileInput.files[0];
    const frameW = parseInt(frameWidthInput.value, 10);
    const frameH = parseInt(frameHeightInput.value, 10);
    if (!file) {
      splitStatus.textContent = '请先选择图片文件';
      return;
    }
    if (!frameW || !frameH) {
      splitStatus.textContent = '请输入有效的帧宽和帧高';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const cols = Math.floor(img.width / frameW);
        const rows = Math.floor(img.height / frameH);
        const total = cols * rows;
        if (total === 0) {
          splitStatus.textContent = '图片尺寸或帧尺寸不正确';
          return;
        }
        let saved = 0;
        const frames = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const canvas = document.createElement('canvas');
            canvas.width = frameW;
            canvas.height = frameH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, c * frameW, r * frameH, frameW, frameH, 0, 0, frameW, frameH);
            const dataUrl = canvas.toDataURL('image/png');
            frames.push(dataUrl);
            saved++;
            if (saved === total) {
              // 保存到插件本地（chrome.storage.local）
              const spriteJson = {
                cols,
                rows,
                frameW,
                frameH,
                frames
              };
              chrome.storage.local.set({ spriteFrames: spriteJson }, () => {
                splitStatus.textContent = `已切分并保存 ${total} 张图片到插件内`;
                // 通知后台重新加载 spriteFrames 并重启动画
                chrome.runtime.sendMessage({ type: 'updateAnimConfig' });
              });
            }
          }
        }
      };
      img.onerror = function() {
        splitStatus.textContent = '图片加载失败';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    splitStatus.textContent = '正在切分...';
  };
});


