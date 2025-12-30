/**
 * IPC Utilities for Main Process
 */
import { ipcMain, type IpcMainInvokeEvent, type IpcMainEvent } from 'electron';
import type { IpcInvokeEvents, IpcRendererToMainEvents } from '../shared/types';

/**
 * Type-safe ipcMain.handle wrapper
 */
export function handleIpc<K extends keyof IpcInvokeEvents>(
  channel: K,
  handler: (event: IpcMainInvokeEvent, ...args: Parameters<IpcInvokeEvents[K]>) => ReturnType<IpcInvokeEvents[K]>
): void {
  ipcMain.handle(channel, handler as any);
}

/**
 * Type-safe ipcMain.on wrapper
 */
export function onIpc<K extends keyof IpcRendererToMainEvents>(
  channel: K,
  handler: (event: IpcMainEvent, ...args: Parameters<IpcRendererToMainEvents[K]>) => void
): void {
  ipcMain.on(channel, handler as any);
}
