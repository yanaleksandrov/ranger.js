import { createElement, roundToStep } from './helpers';

/**
 * Create scale.
 *
 * @param instance
 * @returns {HTMLAnchorElement|HTMLElement|HTMLAreaElement|HTMLAudioElement|HTMLBaseElement|HTMLQuoteElement|HTMLBodyElement|HTMLBRElement|HTMLButtonElement|HTMLCanvasElement|HTMLTableCaptionElement|HTMLTableColElement|HTMLDataElement|HTMLDataListElement|HTMLModElement|HTMLDetailsElement|HTMLDialogElement|HTMLDivElement|HTMLDListElement|HTMLEmbedElement|HTMLFieldSetElement|HTMLFormElement|HTMLHeadingElement|HTMLHeadElement|HTMLHRElement|HTMLHtmlElement|HTMLIFrameElement|HTMLImageElement|HTMLInputElement|HTMLLabelElement|HTMLLegendElement|HTMLLIElement|HTMLLinkElement|HTMLMapElement|HTMLMenuElement|HTMLMetaElement|HTMLMeterElement|HTMLObjectElement|HTMLOListElement|HTMLOptGroupElement|HTMLOptionElement|HTMLOutputElement|HTMLParagraphElement|HTMLPictureElement|HTMLPreElement|HTMLProgressElement|HTMLScriptElement|HTMLSelectElement|HTMLSlotElement|HTMLSourceElement|HTMLSpanElement|HTMLStyleElement|HTMLTableElement|HTMLTableSectionElement|HTMLTableCellElement|HTMLTemplateElement|HTMLTextAreaElement|HTMLTimeElement|HTMLTitleElement|HTMLTableRowElement|HTMLTrackElement|HTMLUListElement|HTMLVideoElement}
 */
export const createScale = (instance) => {
  let steps = calcScale(instance);

  let scale = createElement('div', instance.classes.scale);

  for (let i = 0, iLen = steps.length; i < iLen; i++) {
    let span = createElement('span', instance.classes.scaleTick),
        step = roundToStep(steps[i], instance.fromSlider.step || 1),
        ins  = createElement('ins', '', `${instance.scaleTickPrefix}${step}${instance.scaleTickSuffix}`);

    span.appendChild(ins);
    scale.appendChild(span);
  }
  instance.wrapper.appendChild(scale);

  return scale;
}

/**
 * Calc tick values.
 *
 * @param instance
 * @returns {*[]}
 */
const calcScale = instance => {
  let slider = instance.fromSlider;

  let min = Number(slider.min);
  let max = Number(slider.max);

  return Array.from({ length: instance.scaleTicksCount + 1 }, (_, index) => {
    return min + ((max - min) / instance.scaleTicksCount) * index;
  });
}
