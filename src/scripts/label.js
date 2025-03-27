import { createElement } from './helpers.js';

/**
 * Create label section.
 *
 * @param instance
 * @returns {HTMLAnchorElement|HTMLElement|HTMLAreaElement|HTMLAudioElement|HTMLBaseElement|HTMLQuoteElement|HTMLBodyElement|HTMLBRElement|HTMLButtonElement|HTMLCanvasElement|HTMLTableCaptionElement|HTMLTableColElement|HTMLDataElement|HTMLDataListElement|HTMLModElement|HTMLDetailsElement|HTMLDialogElement|HTMLDivElement|HTMLDListElement|HTMLEmbedElement|HTMLFieldSetElement|HTMLFormElement|HTMLHeadingElement|HTMLHeadElement|HTMLHRElement|HTMLHtmlElement|HTMLIFrameElement|HTMLImageElement|HTMLInputElement|HTMLLabelElement|HTMLLegendElement|HTMLLIElement|HTMLLinkElement|HTMLMapElement|HTMLMenuElement|HTMLMetaElement|HTMLMeterElement|HTMLObjectElement|HTMLOListElement|HTMLOptGroupElement|HTMLOptionElement|HTMLOutputElement|HTMLParagraphElement|HTMLPictureElement|HTMLPreElement|HTMLProgressElement|HTMLScriptElement|HTMLSelectElement|HTMLSlotElement|HTMLSourceElement|HTMLSpanElement|HTMLStyleElement|HTMLTableElement|HTMLTableSectionElement|HTMLTableCellElement|HTMLTemplateElement|HTMLTextAreaElement|HTMLTimeElement|HTMLTitleElement|HTMLTableRowElement|HTMLTrackElement|HTMLUListElement|HTMLVideoElement}
 */
export const createLabel = (instance) => {
  let label = createElement('div', instance.classes.label);

  if (instance.labelIsVisible) {
    let labelStart = createElement('div', instance.classes.labelTick);
    let labelEnd   = createElement('div', instance.classes.labelTick);

    instance.labelMin = label.appendChild(labelStart);
    instance.labelMax = label.appendChild(labelEnd);
  }
  instance.wrapper.appendChild(label);

  calcPositions(instance);

  [instance.fromSlider, instance.toSlider].forEach(el => el.addEventListener('input', () => calcPositions(instance)));

  return label;
}

const calcPositions = ({ fromSlider, toSlider, labelMin, labelMax, labelPrefix, labelSuffix }) => {
  const setLabelStyle = (label, value, percent) => {
    label.innerText  = `${labelPrefix}${value}${labelSuffix}`;
    label.style.left = `calc(${percent}% - ${label.offsetWidth / 2}px)`;
  };

  const calcMin = calculatePercent(+fromSlider.min, +fromSlider.max, +fromSlider.value);
  const calcMax = calculatePercent(+toSlider.min, +toSlider.max, +toSlider.value);

  setLabelStyle(labelMin, fromSlider.value, calcMin);
  setLabelStyle(labelMax, toSlider.value, calcMax);

  const distanceX = labelMax.getBoundingClientRect().left - labelMin.getBoundingClientRect().right;

  if (distanceX < 10) {
    const adjustedCalcMax = calcMin + (labelMin.offsetWidth / fromSlider.offsetWidth) * 100;
    setLabelStyle(labelMax, toSlider.value, adjustedCalcMax);

    labelMin.innerText = fromSlider.value === toSlider.value
      ? `${labelPrefix}${fromSlider.value}${labelSuffix}`
      : `${labelPrefix}${fromSlider.value}${labelSuffix} – ${labelPrefix}${toSlider.value}${labelSuffix}`;

    labelMin.style.left = `calc(${calcMin}% + ${(calcMax - calcMin) / 2}% - ${labelMin.offsetWidth / 2}px)`;
    labelMax.style.visibility = 'hidden';
  } else {
    labelMax.style.visibility = 'visible';
  }
};

const calculatePercent = (start, end, value) => ((value - start) / (end - start)) * 100;
