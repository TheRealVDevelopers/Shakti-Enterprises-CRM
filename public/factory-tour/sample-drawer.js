// The visitor travels along the first shelf, back along the second, then out along the third.
window.createSampleDrawer = function createSampleDrawer(film, resinGuide, selectCard, display) {
  const columns = 5;
  const imagePath = display?.image || 'assets/resin-drawer.webp';
  // Optical centres and clear widths measured inside the steel drawer's outer frame.
  const columnCentres = [.121, .315, .505, .693, .882];
  const rowCentres = [.201, .499, .798];
  const cellWidth = display?.cellWidth || .19;
  const cellHeight = display?.cellHeight || .291;
  const samples = display?.items || resinGuide.map(([code, name], index) => {
    const row = Math.floor(index / columns);
    const column = row % 2 === 0 ? index % columns : columns - 1 - index % columns;
    return {code, name, x: columnCentres[column], y: rowCentres[row]};
  });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const mix = (a, b, weight) => a + (b - a) * weight;
  const stage = document.createElement('div');
  stage.className = 'sample-drawer';
  if(display) stage.classList.add('mould-bench');
  stage.hidden = true;
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', display?.name || 'Polymer sample drawer');
  const world = document.createElement('div');
  world.className = 'sample-drawer-world';
  if(display) world.style.backgroundImage='url("'+imagePath+'")';
  stage.append(world);
  film.append(stage);

  const plateButtons = samples.map((sample, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sample-drawer-plate';
    button.textContent = sample.code;
    button.setAttribute('aria-label', 'Inspect ' + sample.name + ' (' + sample.code + ')');
    button.style.left = sample.x * 100 + '%';
    button.style.top = (sample.y + (display?.plateOffset ?? .098)) * 100 + '%';
    button.addEventListener('click', () => selectCard(index));
    world.append(button);
    return button;
  });

  let imageAspect = display?.aspect || 1672 / 941;
  let lastProgress = 0;
  let lastOpacity = 1;
  const photo = new Image();
  photo.addEventListener('load', () => {
    imageAspect = photo.naturalWidth / photo.naturalHeight;
    if (!stage.hidden) update(lastProgress, lastOpacity);
  });
  photo.src = imagePath;

  function update(progress, opacity = 1) {
    lastProgress = progress;
    const bounded = clamp(progress, 0, samples.length - 1);
    lastOpacity = clamp(opacity, 0, 1);
    stage.hidden = false;
    stage.style.opacity = lastOpacity;
    const index = Math.round(bounded);
    const current = samples[index];
    const position = reducedMotion.matches ? index : bounded;
    const lower = Math.floor(position);
    const next = Math.min(samples.length - 1, lower + 1);
    // Hold briefly on the pellet texture before travelling to the next compartment.
    const fraction = clamp((position - lower - .14) / .72, 0, 1);
    const weight = fraction * fraction * (3 - 2 * fraction);
    const cameraX = mix(samples[lower].x, samples[next].x, weight);
    const cameraY = mix(samples[lower].y, samples[next].y, weight);
    const width = film.clientWidth || 1;
    const height = film.clientHeight || 1;
    const excursion = 4 * weight * (1 - weight);
    const portrait = height > width;
    const verticalScale = portrait ? 1.22 - excursion * .19 : 1.45;
    let closeWidth=Math.max(width * 1.85, height * imageAspect * verticalScale);
    if(display) closeWidth=portrait ? width*(2.08-excursion*.28) : Math.max(width*(1.55-excursion*.22),height*imageAspect*1.16);
    // Enter and leave through a wide view of the workbench, keeping the four tools together.
    const approach = display && !reducedMotion.matches
      ? clamp(Math.min(progress+.95,samples.length-.05-progress)/.85,0,1) : 1;
    const zoom=approach*approach*(3-2*approach);
    const photoWidth=mix(Math.min(width,height*imageAspect),closeWidth,zoom);
    const photoHeight = photoWidth / imageAspect;
    // Pull back during a narrow-screen pan so both adjoining compartments cross the view.
    const framingX = display && portrait ? .5 : mix(.21 + .54 * cameraX, .5, portrait ? excursion : 0);
    const left = mix((width-photoWidth)/2,clamp(width * framingX - cameraX * photoWidth, width - photoWidth, 0),zoom);
    const closeTop = display && portrait ? height*(.27+.16*cameraY)-cameraY*photoHeight
      : clamp(height * (.28 + .36 * cameraY) - cameraY * photoHeight, height - photoHeight, 0);
    const top = mix((height-photoHeight)/2,closeTop,zoom);
    world.style.width = photoWidth + 'px';
    world.style.height = photoHeight + 'px';
    world.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
    stage.dataset.sample = current.code;
    plateButtons.forEach((button, i) => {
      const sample = samples[i];
      const x = left + sample.x * photoWidth;
      const y = top + (sample.y + (display?.plateOffset ?? .098)) * photoHeight;
      button.tabIndex = lastOpacity > .5 && x > 30 && x < width - 30 && y > 70 && y < height - 55 ? 0 : -1;
      button.setAttribute('aria-pressed', String(i === index));
    });
    // The ring remains attached to the named compartment even between camera stops.
    return [(left + (current.pinX ?? current.x) * photoWidth) / width * 100, (top + (current.pinY ?? current.y) * photoHeight) / height * 100];
  }

  function hide() {
    if (!stage.hidden) stage.hidden = true;
  }

  function detail(index) {
    const sample = samples[index];
    if (!sample) return '';
    const figure = document.createElement('figure');
    figure.className = 'sample-drawer-detail';
    const crop = document.createElement('div');
    crop.className = 'sample-drawer-crop';
    crop.setAttribute('role', 'img');
    crop.setAttribute('aria-label', display ? sample.name : sample.name + ' sample compartment');
    if(display) crop.style.backgroundImage='url("'+imagePath+'")';
    crop.style.backgroundSize = (100 / cellWidth) + '% ' + (100 / cellHeight) + '%';
    crop.style.backgroundPosition = (100 * (sample.x - cellWidth / 2) / (1 - cellWidth)) + '% ' + (100 * (sample.y - cellHeight / 2) / (1 - cellHeight)) + '%';
    crop.style.aspectRatio = String(imageAspect * cellWidth / cellHeight);
    const caption = document.createElement('figcaption');
    caption.textContent = display ? sample.name+' · '+sample.code : sample.code + ' · ' + sample.name;
    figure.append(crop, caption);
    return figure.outerHTML;
  }

  return {update, hide, detail};
};
