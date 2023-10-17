## :sparkles: Usage

This is a modern lightweight (~7kB) and zero dependencies JS library to create input range sliders with one or two drag handles.

![alt text](https://github.com/yanalexandrov1987/Ranger.js/blob/main/img.png)

## :sparkles: Features

- High CSS customizable
- Touch accessible
- Supports negative & fractional values
- Zero dependencies
- Supported by all major browsers

## :sparkles: Usage

Add input field.

```html
<input class="rs-input" />
```

Init library.

```js
new Ranger('.rs-input', {
  values: { min: -1, max: 1 },
  step: 0.01,
  set: [0.2, 0.6],
  scale: true,
  range: true,
  ticksCount: 10,
  tickPrefix: '',
  tickSuffix: '',
  labels: true,
  labelPrefix: '',
  labelSuffix: '',
  tooltip: true,
  disabled: false,
});
```

## :sparkles: API

| Property                | Type          | Default value | Description                                                                                                                                                                                      |
|-------------------------|---------------|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `values.min` - required | number, float | null          | Number that specifies the lowest value in the range of permitted values. Its value must be less than that of `values.max`.                                                                       |
| `values.max` - required | number, float | null          | Number that specifies the greatest value in the range of permitted values. Its value must be greater than that of `values.min`.                                                                  |
| `step`                  | number, float | 1             | Number that specifies the amount by which the slider value(s) will change upon user interaction.                                                                                                 |
| `set`                   | number        | null          | Array of two numbers that specify the values of the lower and upper offsets of the range slider element respectively. If omitted, the library will try to get values from the `value` attribute. |
| `scale`                 | boolean       | true          | Show/hide grid of values.                                                                                                                                                                        |
| `range`                 | boolean       | false         | ---                                                                                                                                                                                              |
| `ticksCount`            | number        | 10            | Count of ticks in scale line.                                                                                                                                                                    |
| `tickPrefix`            | string        | ''            | Any content before value of each ticks.                                                                                                                                                          |
| `tickSuffix`            | string        | ''            | Any content after value of each ticks.                                                                                                                                                           |
| `labels`                | boolean       | true          | Show/hide label under handles.                                                                                                                                                                   |
| `labelPrefix`           | string        | ''            | Any text before value of each handles.                                                                                                                                                           |
| `labelSuffix`           | string        | ''            | Any text after value of each handles.                                                                                                                                                            |
| `tooltip`               | boolean       | true          | ---                                                                                                                                                                                              |
| `disabled`              | boolean       | false         | ---                                                                                                                                                                                              |
