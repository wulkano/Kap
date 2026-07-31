import {settings} from './settings';

const simplifiedChinese: Record<string, string> = {
  'Preferences…': '偏好设置…',
  'About Kap': '关于 Kap',
  'Open Video…': '打开视频…',
  Videos: '视频',
  'Export History': '导出历史',
  'Send Feedback…': '发送反馈…',
  Help: '帮助',
  File: '文件',
  Edit: '编辑',
  Window: '窗口',
  Plugins: '插件',
  Microphone: '麦克风',
  None: '无',
  'System Default': '系统默认',
  Stop: '停止',
  Pause: '暂停',
  Resume: '继续',
  Preferences: '偏好设置',
  Exports: '导出记录',
  'Save Original…': '保存原文件…',
  Discard: '丢弃',
  Close: '关闭',
  Minimize: '最小化',
  Zoom: '缩放',
  'Bring All to Front': '全部置于顶层',
  'Open System Preferences': '打开系统设置',
  Cancel: '取消',
  Continue: '继续',
  'Are you sure that you want to discard this recording?': '确定要丢弃此录制吗？',
  'You will no longer be able to edit and export the original recording.': '丢弃后将无法再编辑或导出原始录制。',
  'Kap cannot access the microphone.': 'Kap 无法访问麦克风。',
  'Kap requires microphone access to be able to record audio. You can grant this in the System Preferences. Afterwards, launch Kap for the changes to take effect.': 'Kap 需要麦克风权限才能录制音频。请在系统设置中授予权限，然后重新启动 Kap。',
  'Kap cannot record the screen.': 'Kap 无法录制屏幕。',
  'Kap requires screen capture access to be able to record the screen. You can grant this in the System Preferences. Afterwards, launch Kap for the changes to take effect.': 'Kap 需要屏幕录制权限。请在系统设置中授予权限，然后重新启动 Kap。',
  'Audio recording is enabled but Kap does not have access to the microphone. Continue without audio or grant Kap access to the microphone the System Preferences.': '已启用音频录制，但 Kap 没有麦克风权限。你可以继续进行无声录制，或前往系统设置授予麦克风权限。'
};

export const t = (text: string) => {
  if (settings.get('language') !== 'zh-CN') {
    return text;
  }

  const systemDefaultMatch = /^System Default(\s*\(.+\))?$/.exec(text);
  if (systemDefaultMatch) {
    return `系统默认${systemDefaultMatch[1] ?? ''}`;
  }

  return simplifiedChinese[text] ?? text;
};
