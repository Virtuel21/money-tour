import { normalizeBoardZoom } from '../board/camera';

export interface ComfortPreferences {
  pace: 'normal' | 'fast';
  largeText: boolean;
  boardZoom: number;
}
export function loadComfort(): ComfortPreferences {
  try {
    const value = JSON.parse(localStorage.getItem('money-tour.comfort') ?? '{}');
    return {
      pace: value?.pace === 'fast' ? 'fast' : 'normal',
      largeText: value?.largeText === true,
      boardZoom: normalizeBoardZoom(value?.boardZoom),
    };
  } catch {
    return { pace: 'normal', largeText: false, boardZoom: 100 };
  }
}
export function saveComfort(value: ComfortPreferences) {
  try {
    localStorage.setItem('money-tour.comfort', JSON.stringify(value));
  } catch {
    /* Optional preference storage. */
  }
}
