import { createEvent, fireEvent, render, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { ColorBlock } from '../src';
afterEach(cleanup);
for (const key of ['Enter', ' ']) {
  it(`composes consumer then click for ${JSON.stringify(key)}`, () => {
    const calls: string[] = [];
    const { getByRole } = render(<ColorBlock color="red" onKeyDown={() => calls.push('consumer')} onClick={() => calls.push('click')} />);
    const el = getByRole('button');
    const event = createEvent.keyDown(el, { key });
    fireEvent(el, event);
    expect(calls).toEqual(['consumer', 'click']);
    expect(event.defaultPrevented).toBe(true);
  });
  it(`honors consumer cancellation for ${JSON.stringify(key)}`, () => {
    const click = vi.fn();
    const { getByRole } = render(<ColorBlock color="red" onClick={click} onKeyDown={e => e.preventDefault()} />);
    fireEvent.keyDown(getByRole('button'), { key });
    expect(click).not.toHaveBeenCalled();
  });
}
