import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize } from '@tauri-apps/api/dpi';

const WIDTH = 415;
const HEIGHT = 674;
const ASPECT = WIDTH / HEIGHT;

export async function resizeWindow({ dx, dy, corner }: { dx: number; dy: number; corner: string }) {
  const win = getCurrentWindow();
  const physicalSize = await win.innerSize();
  const scaleFactor = await win.scaleFactor();
  const bounds = { width: physicalSize.width / scaleFactor, height: physicalSize.height / scaleFactor };

  const isRight = corner.includes('right');
  const isBottom = corner.includes('bottom');

  const effectiveDx = isRight ? dx : -dx;
  const effectiveDy = isBottom ? dy : -dy;

  let delta;
  if (Math.abs(effectiveDx) > Math.abs(effectiveDy)) {
    delta = effectiveDx;
  } else {
    delta = effectiveDy;
  }

  const dw = Math.round(delta);
  const newWidth = bounds.width + dw;
  const newHeight = Math.round(newWidth / ASPECT);

  if (newWidth >= 200 && newHeight >= 200) {
    await win.setSize(new LogicalSize(newWidth, newHeight));
  }
}

export async function minimizeWindow() {
  await getCurrentWindow().minimize();
}

export async function closeWindow() {
  await getCurrentWindow().close();
}

export async function toggleMaximizeWindow() {
  const win = getCurrentWindow();
  if (await win.isMaximized()) {
    await win.unmaximize();
  } else {
    await win.maximize();
  }
}
