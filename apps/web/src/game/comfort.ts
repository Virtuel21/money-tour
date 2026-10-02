export interface ComfortPreferences {
  pace: 'normal' | 'fast';
  largeText: boolean;
}
export function loadComfort(): ComfortPreferences {
  try {
    const value = JSON.parse(localStorage.getItem('money-tour.comfort') ?? '{}');
    return {
      pace: value?.pace === 'fast' ? 'fast' : 'normal',
      largeText: value?.largeText === true,
    };
  } catch {
    return { pace: 'normal', largeText: false };
  }
}
export function saveComfort(value: ComfortPreferences) {
  try {
    localStorage.setItem('money-tour.comfort', JSON.stringify(value));
  } catch {
    /* Optional preference storage. */
  }
}
