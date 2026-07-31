import electron from 'electron';

const simplifiedChinese: Record<string, string> = {
  Preferences: '偏好设置',
  Exports: '导出记录',
  Editor: '编辑器',
  general: '通用',
  plugins: '插件',
  Language: '语言',
  'Choose the interface language': '选择界面显示语言',
  'Show cursor': '显示鼠标指针',
  'Display the mouse cursor in your Kaptures': '在录屏中显示鼠标指针',
  'Highlight clicks': '高亮鼠标点击',
  'Keyboard shortcuts': '键盘快捷键',
  'Toggle and customise keyboard shortcuts': '启用并自定义键盘快捷键',
  'Loop exports': '循环播放导出内容',
  'Infinitely loop exports when supported': '在支持时无限循环播放',
  'Audio recording': '音频录制',
  'Record audio from input device': '从输入设备录制音频',
  'Select input device': '选择输入设备',
  'Select Device': '选择设备',
  'No input devices': '没有输入设备',
  'Capture frame rate': '录制帧率',
  'Increased FPS impacts performance and file size': '更高帧率会影响性能和文件大小',
  'Allow analytics': '允许匿名分析',
  'Help us improve Kap by sending anonymous usage stats': '发送匿名使用数据以帮助改进 Kap',
  'Start automatically': '自动启动',
  'Launch Kap on system startup': '系统启动时运行 Kap',
  'Save to…': '保存到…',
  Choose: '选择',
  'Lossy GIF compression': '有损 GIF 压缩',
  'Smaller file size for a minor quality degradation.': '以轻微画质损失换取更小文件。',
  Discover: '发现',
  Installed: '已安装',
  'Oops!': '出错了！',
  'Something went wrong…': '发生了一些问题…',
  Refresh: '刷新',
  'No plugins yet': '尚未安装插件',
  'Customize Kap to your liking with plugins.': '使用插件按你的喜好定制 Kap。',
  Browse: '浏览',
  Install: '安装',
  Uninstall: '卸载',
  Configure: '配置',
  'This plugin requires configuration': '此插件需要配置',
  'Open config file': '打开配置文件',
  'View plugin on GitHub': '在 GitHub 查看插件',
  Done: '完成',
  Size: '尺寸',
  Original: '原始尺寸',
  Custom: '自定义',
  Snapshot: '截图',
  Convert: '转换',
  Export: '导出',
  Copy: '复制',
  'Show in Finder': '在访达中显示',
  'Open Original': '打开原文件',
  'Your export will continue in the background. You can access it through the Export History window.': '导出将在后台继续，可在“导出记录”窗口中查看。',
  OK: '确定',
  Retry: '重试',
  Cancel: '取消',
  Discard: '丢弃',
  'Are you sure you want to discard this conversion?': '确定要丢弃此次转换吗？',
  'Any progress will be lost.': '当前进度将会丢失。',
  'Drag and drop to copy the recording to your desktop or an application. Click to open its parent directory': '拖放录制文件可复制到桌面或其他应用；点击可打开所在文件夹',
  'System Default': '系统默认',
  'No options': '没有可用选项',
  Select: '选择'
};

const translateDynamicText = (text: string) => {
  const systemDefaultMatch = /^System Default(\s*\(.+\))?$/.exec(text);
  if (systemDefaultMatch) {
    return `系统默认${systemDefaultMatch[1] ?? ''}`;
  }

  const installPluginMatch = /^Do you want to install the “(.+)” plugin\?$/.exec(text);
  if (installPluginMatch) {
    return `是否安装“${installPluginMatch[1]}”插件？`;
  }

  const originalSizeMatch = /^(.+)\s+\(Original\)$/.exec(text);
  if (originalSizeMatch) {
    return `${originalSizeMatch[1]}（原始尺寸）`;
  }

  return simplifiedChinese[text] ?? text;
};

export const translate = (text: string) => {
  const match = /^(\s*)(.*?)(\s*)$/s.exec(text);
  if (!match || !match[2]) {
    return text;
  }

  return `${match[1]}${translateDynamicText(match[2])}${match[3]}`;
};

const getLanguage = () => {
  const {settings} = electron.remote.require('./common/settings');
  return settings.get('language');
};

export const t = (text: string) => getLanguage() === 'zh-CN' ? translate(text) : text;

const translateElement = (element: Element) => {
  for (const attribute of ['title', 'placeholder', 'aria-label', 'data-tip']) {
    const value = element.getAttribute(attribute);
    if (value) {
      const translatedValue = translate(value);
      if (translatedValue !== value) {
        element.setAttribute(attribute, translatedValue);
      }
    }
  }
};

const translateTree = (root: Node) => {
  if (root.nodeType === Node.TEXT_NODE) {
    const parentName = root.parentElement?.tagName;
    if (parentName !== 'STYLE' && parentName !== 'SCRIPT') {
      const value = root.nodeValue ?? '';
      const translatedValue = translate(value);
      if (translatedValue !== value) {
        root.nodeValue = translatedValue;
      }
    }

    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateElement(root as Element);
  }

  for (const child of Array.from(root.childNodes)) {
    translateTree(child);
  }
};

export const startLocalization = () => {
  if (getLanguage() !== 'zh-CN') {
    document.documentElement.lang = 'en';
    return () => undefined;
  }

  document.documentElement.lang = 'zh-CN';
  translateTree(document.documentElement);

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        translateTree(mutation.target);
      }

      for (const node of Array.from(mutation.addedNodes)) {
        translateTree(node);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    characterData: true,
    subtree: true
  });

  return () => observer.disconnect();
};
