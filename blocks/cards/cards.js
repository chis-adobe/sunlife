import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard, decorateCardSelect, markCardCta } from '../card/card.js';

/**
 * Cards per row for grid variants: 3 when the count fills rows of three (or is large),
 * otherwise 2.
 * @param {number} count
 * @returns {number}
 */
function cardsPerRow(count) {
  return count % 3 === 0 || count > 4 ? 3 : 2;
}

export default function decorate(block) {
  const blockId = getBlockId('cards');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `Cards for ${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Cards');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    ul.append(createCard(row));
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // vector icons are already optimal; re-encoding would break them
    if (new URL(img.src, window.location.href).pathname.endsWith('.svg')) return;
    // Dynamic Media pictures are already responsive renditions
    if (img.closest('picture[data-dm]')) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  const isIcon = block.classList.contains('icon');
  const isArticle = block.classList.contains('article');
  if (isIcon || isArticle) {
    block.classList.add(`cards-cols-${cardsPerRow(ul.children.length)}`);
  }
  if (isIcon) {
    [...ul.children].forEach((li, i) => {
      decorateCardSelect(li, `${blockId}-${i}`);
      markCardCta(li);
    });
  }

  block.textContent = '';
  block.append(ul);
}
