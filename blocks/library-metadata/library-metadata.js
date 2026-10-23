import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Library metadata feeds the Document Authoring Library panel (name + description).
 * When the library page itself is viewed, it renders as a caption for the example above it.
 * @param {Element} block The library-metadata block element
 */
export default function decorate(block) {
  const { name, description } = readBlockConfig(block);
  block.textContent = '';
  if (name) {
    const title = document.createElement('p');
    title.className = 'library-metadata-name';
    title.textContent = name;
    block.append(title);
  }
  if (description) {
    const text = document.createElement('p');
    text.className = 'library-metadata-description';
    text.textContent = description;
    block.append(text);
  }
  // caption first: move it ahead of the example it describes
  const section = block.closest('.section');
  const wrapper = block.parentElement;
  if (section && wrapper && wrapper !== section.firstElementChild) section.prepend(wrapper);
}
