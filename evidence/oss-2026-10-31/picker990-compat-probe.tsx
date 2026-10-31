import { resetWarned } from '@rc-component/util';
import { cleanup, render } from '@testing-library/react';
import MockDate from 'mockdate';
import React from 'react';
import { DayPicker, DayRangePicker, getDay } from './util/commonUtil';

const Legacy = (props: any) => <button {...props} data-renderer="legacy" />;
const CustomNow = (props: any) => <button {...props} data-renderer="now" />;
const CustomOk = (props: any) => <button {...props} data-renderer="ok" />;
const cases = [
  ['native', {}, null, null],
  ['legacy OK only', { button: Legacy }, null, 'legacy'],
  ['custom Now plus legacy OK', { button: Legacy, nowButton: CustomNow }, 'now', 'legacy'],
  ['custom OK plus native Now', { button: Legacy, okButton: CustomOk }, null, 'ok'],
  ['both explicit overrides', { button: Legacy, nowButton: CustomNow, okButton: CustomOk }, 'now', 'ok'],
] as const;

describe('review: Footer legacy compatibility', () => {
  beforeAll(() => MockDate.set(getDay('1990-09-03 00:00:00').toDate()));
  afterAll(() => MockDate.reset());
  afterEach(cleanup);
  for (const [kind, Picker] of [['Picker', DayPicker], ['RangePicker', DayRangePicker]] as const) {
    for (const [name, components, nowMarker, okMarker] of cases) {
      it(`${kind}: ${name}`, () => {
        resetWarned();
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
          render(<Picker components={components as any} picker="time" showNow open />);
          for (const [selector, marker] of [['.rc-picker-now', nowMarker], ['.rc-picker-ok', okMarker]] as const) {
            const el = document.querySelector(selector)!;
            expect(el.tagName).toBe('BUTTON');
            expect(el.getAttribute('data-renderer')).toBe(marker);
            if (marker === null) expect(el).toHaveAttribute('type', 'button');
            else expect(el).not.toHaveAttribute('type');
          }
        } finally { error.mockRestore(); }
      });
    }
  }
});
