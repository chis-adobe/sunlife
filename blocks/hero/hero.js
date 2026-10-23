/**
 * Panel variant (`Hero (panel)`): splits the authored content into a media row and a
 * text-panel row so CSS can stack them on mobile and overlay the panel on desktop.
 * Accepts either one cell (picture + text) or separate image / text rows.
 * @param {Element} block The hero block
 */
function decoratePanel(block) {
  const picture = block.querySelector('picture');
  const cells = [...block.querySelectorAll(':scope > div > div')];
  let mediaRow = cells.find((cell) => cell.querySelector('picture') && !cell.textContent.trim())
    ?.parentElement;

  if (!mediaRow && picture) {
    // picture shares a cell with the text: move it (and an otherwise empty <p>) to its own row
    const holder = picture.parentElement;
    const node = holder.tagName === 'P' && holder.children.length === 1 && !holder.textContent.trim()
      ? holder : picture;
    mediaRow = document.createElement('div');
    const mediaCell = document.createElement('div');
    mediaCell.append(node);
    mediaRow.append(mediaCell);
    block.prepend(mediaRow);
  }
  if (mediaRow) mediaRow.classList.add('hero-media');

  [...block.children]
    .filter((row) => row !== mediaRow && row.textContent.trim())
    .forEach((row) => row.classList.add('hero-content'));
}

/**
 * Default hero is CSS-only; only option classes that change structure are decorated here.
 * @param {Element} block The hero block
 */
export default function decorate(block) {
  if (block.classList.contains('panel')) decoratePanel(block);
}
