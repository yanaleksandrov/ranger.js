/**
 * Rounds the number taking into account the value
 *
 * @param value
 * @returns {number}
 */
export const roundValue = value => {
  const num = Math.abs(value);

  if (num < 1) {
    return Number(value.toFixed(2));
  } else {
    let power   = Math.floor(Math.log10(num)),
        divisor = Math.pow(10, power - 1);

    return parseFloat((Math.round(value / divisor) * divisor).toFixed(2));
  }
}

/**
 *
 * @param el
 * @param cls
 * @param dataAttr
 * @returns {ActiveX.IXMLDOMElement}
 */
export const createElement = (el, cls, dataAttr) => {
  let element = document.createElement(el);
  if (cls) {
    element.className = cls
  }
  if (dataAttr && dataAttr.length === 2) {
    element.setAttribute('data-' + dataAttr[0], dataAttr[1]);
  }
  return element;
}

/**
 *
 * @param el
 * @param ev
 * @param callback
 */
export const createEvents = (el, ev, callback) => {
  let events = ev.split(' ');
  for (let i = 0, iLen = events.length; i < iLen; i++) {
    el.addEventListener(events[i], callback);
  }
}

/**
 *
 * @param settings
 * @returns {*[]}
 */
export const prepareArrayValues = settings => {
  let { values, step } = settings,
      range  = values.max - values.min,
      result = [];

  if (!step) {
    return [values.min, values.max];
  }

  for (let i = 0; i <= range / step; i++) {
    const value = values.min + i * step;
    result.push(Number(value.toFixed(4)));
  }

  if (!result.includes(values.max)) {
    result.push(values.max);
  }

  return result;
}

/**
 *
 * @param settings
 * @returns {null|boolean}
 */
export const checkInitial = settings => {
  const { set, values, range } = settings;

  if (!set || set.length < 1 || values.indexOf(set[0]) < 0) {
    return null;
  }

  if (range && (set.length < 2 || values.indexOf(set[1]) < 0)) {
    return null;
  }

  return true;
}

/**
 *
 * @param ticksCount
 * @param values
 * @returns {number[]}
 */
export const calcScale = (ticksCount, values) => {
  if (!isNaN(ticksCount) && ticksCount < values.length) {
    let start  = values[0],
        end    = values[values.length - 1];
        values = Array.from({length: ticksCount + 1}, (_, i) => roundValue(start + (end - start) * i / ticksCount));
  }
  return values;
}
