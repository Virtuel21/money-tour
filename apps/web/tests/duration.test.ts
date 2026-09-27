// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DurationPicker } from '../src/game/DurationPicker';
import { optionsSchema } from '../src/network/schema';
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
let root: Root;
afterEach(async () => {
  await act(() => root?.unmount());
  document.body.innerHTML = '';
});
it('edits a custom duration, displays invalid input and returns to a preset', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  function Form() {
    const [value, setValue] = useState(20);
    return createElement(DurationPicker, { value, onChange: setValue });
  }
  await act(() => root.render(createElement(Form)));
  const select = host.querySelector('select')!;
  expect([...select.options].map((o) => o.value)).not.toContain('1');
  await act(() => {
    select.value = 'custom';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const input = host.querySelector('input')!;
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '45');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(input.value).toBe('45');
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '0');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(host.querySelector('[role=alert]')).not.toBeNull();
  await act(() => {
    select.value = '10';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(host.querySelector('input')).toBeNull();
  expect(host.querySelector('[role=alert]')).toBeNull();
});
it.each([1, 45, 180])('accepts %i custom minutes in multiplayer', (minutes) => {
  const options = {
    players: [
      { id: 'a', name: 'A', bot: false },
      { id: 'b', name: 'B', bot: true },
    ],
    mode: 'free-for-all',
    durationMs: minutes * 60000,
  };
  expect(optionsSchema.parse(options).durationMs).toBe(minutes * 60000);
  expect(optionsSchema.safeParse({ ...options, durationMs: 181 * 60000 }).success).toBe(false);
});
