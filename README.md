## :boom: About

This is a modern lightweight (~7kB) and zero dependencies JS library to create input range sliders with one or two drag handles.

![alt text](https://github.com/yanaleksandrov/ranger.js/blob/main/img.png)

## :+1: Features

- High CSS customizable
- Touch accessible
- Supports negative & fractional values
- Zero dependencies
- Supported by all major browsers

## :sparkles: Usage

Add an `<input type="range">`. To get a **range** slider (two handles), add a `data-max-value`
attribute holding the starting value of the upper handle — otherwise you get a single handle.

```html
<!-- single handle -->
<input class="ranger-input" type="range" min="0" max="100" step="1" value="40" />

<!-- two handles -->
<input class="ranger-input" type="range" min="0" max="100" step="1" value="20" data-max-value="80" />
```

Init the library on each slider (`target` can be a CSS selector or the element itself):

```js
document.querySelectorAll('.ranger-input').forEach((slider) => {
  new Ranger(slider, {
    scaleTicksCount: 10,
    scaleTickPrefix: '',
    scaleTickSuffix: '',
    labelIsVisible: true,
    labelPrefix: '',
    labelSuffix: '',
    disabled: false,
  });
});
```

## :sparkles: API

| Option            | Type              | Default                                                                          | Description                                                                             |
|--------------------|-------------------|-----------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `classes`          | object            | `{ container: 'ranger', fill: 'ranger-fill', scale: 'ranger-scale', scaleTick: 'ranger-scale-tick', scaleTickMinor: 'ranger-scale-tick ranger-scale-tick--minor', label: 'ranger-label', labelTick: 'ranger-label-item' }` | Class names used for the generated wrapper/fill/scale/label elements. |
| `scaleTicksCount`  | number            | `10`                                                                             | Number of labeled (major) ticks in the scale line. Set to `0` to hide the scale entirely. |
| `scaleMinorTicksCount` | number        | `0`                                                                              | Unlabeled minor ticks inserted between each pair of major ticks, evenly splitting that gap. |
| `scaleAnimatedTicksCount` | number     | `1`                                                                              | How many ticks on *each* side of a handle get a nonzero `--ranger-scale` (below), tapering to 0 past that distance. One shared radius, applied symmetrically. |
| `scaleTickPrefix`  | string            | `''`                                                                             | Content shown before each tick's value.                                                   |
| `scaleTickSuffix`  | string            | `''`                                                                             | Content shown after each tick's value.                                                    |
| `labelIsVisible`   | boolean           | `true`                                                                           | Show/hide the floating value label(s) above the handle(s).                                |
| `labelPrefix`      | string            | `''`                                                                             | Text shown before each label's value.                                                     |
| `labelSuffix`      | string            | `''`                                                                             | Text shown after each label's value.                                                      |
| `labelOnDragOnly`  | boolean           | `false`                                                                          | Keep the label hidden except while a handle is actively being dragged or nudged via keyboard. |
| `disabled`         | boolean           | `false`                                                                          | Disable dragging on the slider.                                                           |
| `fromInput`        | HTMLInputElement  | `null`                                                                           | External `<input>` kept in sync with the lower/only handle.                               |
| `toInput`          | HTMLInputElement  | `null`                                                                           | External `<input>` kept in sync with the upper handle (range mode only).                  |
| `values`           | array              | `null`                                                                          | Display values (labels, dates, price tiers, ...) to pick an index from — `min`/`max`/`step` are derived automatically, and `scaleTicksCount` defaults to one tick per value (both only unless explicitly overridden). Sets a default `format` unless one is given. |
| `format`           | `(value) => string` | `null`                                                                        | Overrides `labelPrefix`/`labelSuffix` and `scaleTickPrefix`/`scaleTickSuffix` everywhere a value is shown. |
| `logScale`         | boolean            | `false`                                                                         | Maps the displayed/formatted value exponentially between `min` and `max` (which must be `> 0`); dragging stays linear. Sets a default `format` unless one is given. |
| `snapPoints`       | number[]           | `[]`                                                                            | Values that magnetically pull a handle in once dragged within `snapThreshold` of them. |
| `snapThreshold`    | number             | `0.02`                                                                          | Snap pull radius, as a fraction of the `min`–`max` range.                                 |
| `fineStep`         | number             | `null`                                                                          | Step used for Shift+Arrow nudges; defaults to `step / 10`.                                |
| `minGap`           | number             | `0`                                                                             | Minimum distance the two handles must keep apart (range mode only).                       |

A few interactions work automatically, with no option to turn on:

- **Double-click/tap a handle** to reset it to the value it started at.
- **Drag the filled bar itself** (range mode only) to slide both handles together, keeping their
  distance fixed — like moving a whole date-range window instead of resizing it.
- **Hold Shift while pressing an arrow key** on a focused handle to nudge it by `fineStep` instead of
  the normal `step`. A plain arrow press is left to the browser's native Home/End/arrow handling.

Every tick — major or minor — also carries a live `--ranger-scale` CSS custom property (`0`–`1`, how
close the nearest handle currently is), so plain CSS can animate it. `.ranger-scale-tick--animated` ships
with the library as a ready-made example of this — add it via `classes.scaleTick`/`classes.scaleTickMinor`
to grow a tick's height and fade its opacity in as a handle passes by:

```js
new Ranger(slider, {
  classes: {
    scaleTick: 'ranger-scale-tick ranger-scale-tick--animated',
    scaleTickMinor: 'ranger-scale-tick ranger-scale-tick--minor ranger-scale-tick--animated',
  },
});
```

Or write your own reaction to `--ranger-scale` instead:

```css
.ranger-scale-tick::before {
  height: calc(4px + var(--ranger-scale, 0) * 12px);
  transition: height 0.15s ease-out;
}
```

Major-tick labels also thin themselves out automatically — whenever the slider's own rendered width
changes (tracked via `ResizeObserver`, not just on page load), the widest label is measured and every
Nth one is hidden, just enough that none overlap.

## :hammer_and_wrench: Development

```bash
npm install
npm start    # dev server with live demos at src/view/index.html
npm run build # production bundle in dist/
```
