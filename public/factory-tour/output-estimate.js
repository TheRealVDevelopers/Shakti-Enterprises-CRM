'use strict';

// The cycle and cavity count are supplied for a particular mould and material.
function hourlyPressOutput(cycleSeconds, cavities, efficiencyPercent = 100) {
  if (!Number.isFinite(cycleSeconds) || cycleSeconds <= 0 ||
      !Number.isSafeInteger(cavities) || cavities < 1 ||
      !Number.isFinite(efficiencyPercent) || efficiencyPercent < 0 || efficiencyPercent > 100) {
    return null;
  }
  const rate = (3600 / cycleSeconds) * cavities * (efficiencyPercent / 100);
  return Number.isFinite(rate) ? rate : null;
}

function createOutputEstimate() {
  const form = document.createElement('form');
  form.className = 'output-estimate';
  form.setAttribute('aria-label', 'Production estimate');
  form.addEventListener('submit', event => event.preventDefault());

  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = 'Estimate production';
  const instructions = document.createElement('p');
  instructions.textContent = 'Enter the cycle time and number of filled cavities for your mould.';
  fieldset.append(legend, instructions);

  const fields = document.createElement('div');
  fields.className = 'estimate-fields';
  fieldset.append(fields);
  function addInput(text, name, attributes) {
    const label = document.createElement('label');
    label.textContent = text;
    const input = document.createElement('input');
    input.type = 'number';
    input.name = name;
    Object.assign(input, attributes);
    label.append(input);
    fields.append(label);
    return input;
  }

  const cycle = addInput('Cycle time (seconds)', 'cycle', {
    min: '0', step: 'any', required: true, placeholder: 'e.g. 30', inputMode: 'decimal'
  });
  const cavities = addInput('Filled cavities per cycle', 'cavities', {
    min: '1', step: '1', required: true, placeholder: 'e.g. 2', inputMode: 'numeric'
  });
  const efficiency = addInput('Production efficiency (%)', 'efficiency', {
    min: '0', max: '100', step: 'any', value: '100', placeholder: '100', inputMode: 'decimal'
  });

  const result = document.createElement('output');
  result.className = 'estimate-result';
  result.setAttribute('aria-live', 'polite');
  result.setAttribute('aria-atomic', 'true');
  const format = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });

  function refresh() {
    if ([cycle, cavities, efficiency].some(input => input.validity.badInput)) {
      result.value = 'Use a number in each field.';
      return;
    }
    if (cycle.value === '' || cavities.value === '') {
      result.value = 'Enter both values to see estimated parts per hour.';
      return;
    }
    const percent = efficiency.value === '' ? 100 : efficiency.valueAsNumber;
    const rate = hourlyPressOutput(cycle.valueAsNumber, cavities.valueAsNumber, percent);
    result.value = rate === null
      ? 'Use a positive cycle time, a whole cavity count of at least one and an efficiency from 0 to 100%.'
      : 'Estimated production · ' + format.format(rate) + ' parts per hour';
  }
  form.addEventListener('input', refresh);
  fieldset.append(result);
  form.append(fieldset);
  refresh();
  return form;
}
