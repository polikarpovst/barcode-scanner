import { uuid } from '../utils/uuid.js';
import { getHistory, setHistory, getSettings } from '../services/storage.js';

const styles = /* css */ `
  :host {
    --empty-history-button-color: #ffffff;

    display: block;
    box-sizing: border-box;
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --empty-history-button-color: #000000;
    }
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
  }

  :host([hidden]),
  [hidden],
  ::slotted([hidden]) {
    display: none !important;
  }

  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  ul {
    max-width: 36.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  ul li {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
    color: var(--text-main);
  }

  ul li:last-of-type {
    border-bottom: none;
  }

  ul li a {
    color: var(--links);
  }

  ul li a,
  ul li span {
    word-break: break-all;
  }

  @supports (-webkit-line-clamp: 1) and (display: -webkit-box) and (-webkit-box-orient: vertical) {
    ul li a,
    ul li span {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    }
  }

  .empty-message {
    display: none;
  }

  ul:empty + .empty-message {
    display: block;
  }

  .history-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--border-radius);
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #ffffff;
    transition: background-color 0.3s ease;
  }

  .btn-danger {
    background-color: var(--error-color);
  }

  .btn-danger:hover {
    background-color: darken(var(--error-color), 10%);
  }

  .btn-success {
    background-color: var(--success-color);
  }

  .btn-success:hover {
    background-color: darken(var(--success-color), 10%);
  }

  .btn-export {
    background-color: #4CAF50;
  }

  .btn-export:hover {
    background-color: #45a049;
  }

  .btn svg {
    width: 1.125em;
    height: 1.125em;
  }
`;

const template = document.createElement('template');

template.innerHTML = /* html */ `
  <style>${styles}</style>
  <ul id="historyList"></ul>
  <footer>
    <div class="empty-message">There are no saved items in history.</div>
    <div class="history-actions">
      <button type="button" id="emptyHistoryBtn" class="btn btn-danger">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
          <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z"/>
        </svg>
        Empty history
      </button>
      <button type="button" id="exportCsvBtn" class="btn btn-export">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        Export CSV
      </button>
    </div>
  </footer>
`;

class BSHistory extends HTMLElement {
  #historyListEl = null;
  #emptyHistoryBtn = null;

  constructor() {
    super();

    if (!this.shadowRoot) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  async connectedCallback() {
    this.#historyListEl = this.shadowRoot?.getElementById('historyList');
    this.#emptyHistoryBtn = this.shadowRoot?.getElementById('emptyHistoryBtn');
    const exportCsvBtn = this.shadowRoot?.getElementById('exportCsvBtn');

    this.#renderHistoryList((await getHistory())[1] || []);

    this.#historyListEl?.addEventListener('click', this.#handleHistoryListClick);
    this.#emptyHistoryBtn?.addEventListener('click', this.#handleEmptyHistoryClick);
    exportCsvBtn?.addEventListener('click', this.#handleExportCsvClick);
  }

  disconnectedCallback() {
    this.#historyListEl?.removeEventListener('click', this.#handleHistoryListClick);
    this.#emptyHistoryBtn?.removeEventListener('click', this.#handleEmptyHistoryClick);
  }

  /**
   * Adds an item to the history.
   * If the item is already in history, it will not be added.
   *
   * @param {string} item - Item to add to history
   */
  async add(historyItem) {
    const [, settings] = await getSettings();

    if (!historyItem?.item || !settings?.addToHistory) {
      return;
    }

    const [getHistoryError, history = []] = await getHistory();

    if (
      !getHistoryError &&
      Array.isArray(history) &&
      !history.find(h => h.item === historyItem.item)
    ) {
      const data = [...history, historyItem];

      const [setHistoryError] = await setHistory(data);

      if (!setHistoryError) {
        this.#renderHistoryList(data);
      }
    }
  }

  /**
   * Removes an item from the history.
   *
   * @param {string} item - Item to remove from history
   */
  async remove(item) {
    if (!item) {
      return;
    }

    const [getHistoryError, history = []] = await getHistory();

    if (!getHistoryError && Array.isArray(history)) {
      const data = history.filter(h => h.item !== item);
      const [setHistoryError] = await setHistory(data);

      if (!setHistoryError) {
        const historyItem = this.#historyListEl.querySelector(`li[data-value="${item}"]`);

        if (historyItem) {
          historyItem.remove();
        }
      }
    }
  }

  /**
   * Removes all items from the history.
   */
  async empty() {
    const [setHistoryError] = await setHistory([]);

    if (!setHistoryError) {
      this.#historyListEl.replaceChildren();
    }
  }

  /**
   * Renders the history list. If there are no items in history, it will show a message.
   *
   * @param {Array<Object>} data - History data as an array of objects with item and comment
   */
  #renderHistoryList(data) {
    if (!this.#historyListEl) {
      return;
    }

    this.#historyListEl.replaceChildren();

    const fragment = document.createDocumentFragment();

    data.forEach(historyItem => {
      fragment.appendChild(this.#createHistoryItemElement(historyItem));
    });

    this.#historyListEl.appendChild(fragment);
  }

  /**
   * Creates a history item element with an optional comment.
   * If the item is a URL, it will be an anchor element, otherwise a span element.
   *
   * @param {Object} historyItem - The history item object containing item and comment
   * @returns {HTMLLIElement} The history item element
   */
  #createHistoryItemElement(historyItem) {
    const { item, comment } = historyItem;
    const itemId = uuid();
    const li = document.createElement('li');
    li.setAttribute('data-value', item);

    let itemElement;

    try {
      new URL(item);
      itemElement = document.createElement('a');
      itemElement.href = item;
      itemElement.setAttribute('target', '_blank');
      itemElement.setAttribute('rel', 'noreferrer noopener');
    } catch {
      itemElement = document.createElement('span');
    }

    itemElement.textContent = item;
    itemElement.setAttribute('id', `historyItem-${itemId}`);

    const commentEl = document.createElement('span');
    commentEl.textContent = comment;
    commentEl.className = 'comment';

    const actionsEl = document.createElement('div');
    actionsEl.className = 'actions';

    const copyBtn = document.createElement('custom-clipboard-copy');
    copyBtn.setAttribute('id', `copyHistoryItem-${itemId}`);
    copyBtn.setAttribute('aria-label', 'Copy to clipboard');
    copyBtn.setAttribute('aria-labelledby', `copyHistoryItem-${itemId} historyItem-${itemId}`);
    copyBtn.setAttribute('only-icon', '');
    copyBtn.setAttribute('value', item);
    actionsEl.appendChild(copyBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'delete-action';
    removeBtn.setAttribute('data-action', 'delete');
    removeBtn.setAttribute('id', `removeHistoryItem-${itemId}`);
    removeBtn.setAttribute('aria-label', 'Remove from history');
    removeBtn.setAttribute('aria-labelledby', `removeHistoryItem-${itemId} historyItem-${itemId}`);
    removeBtn.innerHTML = /* html */ `
      <svg xmlns="http://www.w3.org/2000/svg" width="1.125em" height="1.125em" fill="currentColor" viewBox="0 0 16 16">
        <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z"/>
      </svg>
    `;
    actionsEl.appendChild(removeBtn);

    li.appendChild(itemElement);
    li.appendChild(commentEl);
    li.appendChild(actionsEl);

    return li;
  }

  /**
   * Handles the click event on the history list.
   *
   * @param {Event} evt - The event object
   */
  #handleHistoryListClick = evt => {
    const target = evt.target;

    if (target.closest('[data-action="delete"]')) {
      const value = target.closest('li').dataset.value;

      if (window.confirm(`Delete history item ${value}?`)) {
        this.remove(value);
      }
    }
  };

  /**
   * Handles the click event on the empty history button.
   */
  #handleEmptyHistoryClick = () => {
    if (window.confirm('Empty history? This action cannot be undone.')) {
      this.empty();
    }
  };

  /**
   * Handles the click event on the export CSV button.
   */
  #handleExportCsvClick = async () => {
    const [getHistoryError, history = []] = await getHistory();

    if (getHistoryError || !Array.isArray(history)) {
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      history.map(item => `${item.item},${item.comment}`).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'barcode_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Updates the comment of the latest history item.
   *
   * @param {string} newComment - The new comment to set for the latest history item
   */
  async updateLatestComment(newComment) {
    const [getHistoryError, history = []] = await getHistory();

    if (getHistoryError || !Array.isArray(history) || history.length === 0) {
      return;
    }

    // Replace the comment of the latest item
    const latestItem = history[history.length - 1];
    latestItem.comment = newComment;

    const [setHistoryError] = await setHistory(history);

    if (!setHistoryError) {
      // Update the UI
      const latestListItem = this.#historyListEl.lastElementChild;
      if (latestListItem) {
        const commentEl = latestListItem.querySelector('.comment');
        if (commentEl) {
          commentEl.textContent = newComment;
        }
      }
    }
  }

  static defineCustomElement(elementName = 'bs-history') {
    if (typeof window !== 'undefined' && !window.customElements.get(elementName)) {
      window.customElements.define(elementName, BSHistory);
    }
  }
}

BSHistory.defineCustomElement();

export { BSHistory };
