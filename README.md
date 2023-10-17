This is a modern lightweight (~7kB) and zero dependencies JS library to create input range sliders with one or two drag handles.

![alt text](https://github.com/yanalexandrov1987/Ranger.js/blob/main/demo.png)

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

| Property                | Type          | Default value | Description |
|-------------------------|---------------|---------------| --- |
| `values.min` - required | number, float | null          | --- |
| `values.max` - required | number, float | null          | --- |
| `step`                  | number, float | 1             | --- |
| `set`                   | number        | null          | --- |
| `scale`                 | boolean       | true          | --- |
| `range`                 | boolean       | false         | --- |
| `ticksCount`            | number        | 10            | --- |
| `tickPrefix`            | string        | ''            | --- |
| `tickSuffix`            | string        | ''            | --- |
| `labels`                | boolean       | true          | --- |
| `labelPrefix`           | string        | ''            | --- |
| `labelSuffix`           | string        | ''            | --- |
| `tooltip`               | boolean       | true          | --- |
| `disabled`              | boolean       | false         | --- |
