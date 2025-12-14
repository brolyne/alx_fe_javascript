// Quotes array with sample quotes
const quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspirational" },
  { text: "Simplicity is the soul of efficiency.", category: "Productivity" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

const LOCAL_STORAGE_KEY = 'quotes';
const SESSION_LAST_VIEWED = 'lastViewedQuoteIndex';
const SELECTED_CATEGORY_KEY = 'selectedCategory';
const SERVER_POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';
const SYNC_INTERVAL_MS = 30000; // 30s polling
let lastLocalSnapshot = null; // used to allow reverting after server overwrite

function showNotification(message, options = {}) {
  const container = document.getElementById('syncNotification');
  if (!container) return;
  container.style.display = 'block';
  container.innerHTML = '';
  const msg = document.createElement('span');
  msg.textContent = message;
  container.appendChild(msg);

  const btnContainer = document.createElement('span');
  btnContainer.style.marginLeft = '12px';

  if (options.revert) {
    const keepBtn = document.createElement('button');
    keepBtn.textContent = 'Keep Local';
    keepBtn.style.marginLeft = '8px';
    keepBtn.addEventListener('click', () => {
      if (lastLocalSnapshot) {
        try {
          const parsed = JSON.parse(lastLocalSnapshot);
          quotes.length = 0;
          parsed.forEach((q) => quotes.push(q));
          saveQuotesToLocalStorage();
          populateCategories();
          filterQuotes();
          showNotification('Local data restored.', { autoHide: 2000 });
        } catch (e) {
          console.error('Could not revert local snapshot', e);
        }
      }
    });
    btnContainer.appendChild(keepBtn);
  }

  const dismiss = document.createElement('button');
  dismiss.textContent = 'Dismiss';
  dismiss.style.marginLeft = '8px';
  dismiss.addEventListener('click', () => {
    container.style.display = 'none';
  });
  btnContainer.appendChild(dismiss);

  container.appendChild(btnContainer);

  if (options.autoHide) {
    setTimeout(() => (container.style.display = 'none'), options.autoHide);
  }
}

async function fetchServerQuotes() {
  try {
    const res = await fetch(SERVER_POSTS_URL + '?_limit=10');
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    // Map posts to quote objects: use title as text and userId as category
    const mapped = data.map((p) => ({ text: String(p.title), category: `Server-${p.userId}` }));
    return mapped;
  } catch (e) {
    console.error('Failed fetching server quotes', e);
    return null;
  }
}

// Sync logic: server takes precedence; store local snapshot to allow reverting
async function syncWithServer() {
  const serverQuotes = await fetchServerQuotes();
  if (!serverQuotes) {
    showNotification('Server sync failed (network).', { autoHide: 3000 });
    return;
  }

  // Compare serialized versions to detect differences
  const localSer = JSON.stringify(quotes);
  const serverSer = JSON.stringify(serverQuotes);
  if (localSer === serverSer) {
    showNotification('Already up-to-date with server.', { autoHide: 2000 });
    return;
  }

  // Server wins: save local snapshot, then overwrite
  lastLocalSnapshot = localSer;
  quotes.length = 0;
  serverQuotes.forEach((q) => quotes.push(q));
  saveQuotesToLocalStorage();
  populateCategories();
  filterQuotes();
  showNotification('Server changes applied. You can revert.', { revert: true });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Displays a random quote from the quotes array
function showRandomQuote() {
  const display = document.getElementById('quoteDisplay');
  if (!display) return;
  if (quotes.length === 0) {
    display.textContent = 'No quotes available.';
    return;
  }

  // respect category filter when choosing a random quote
  const select = document.getElementById('categoryFilter');
  const selectedCategory = select ? select.value : 'all';
  const candidates = (selectedCategory && selectedCategory !== 'all')
    ? quotes.filter((q) => q.category === selectedCategory)
    : quotes.slice();
  if (candidates.length === 0) {
    display.textContent = 'No quotes in the selected category.';
    return;
  }

  const idxInCandidates = getRandomInt(candidates.length);
  const q = candidates[idxInCandidates];
  display.innerHTML = '';

  const quoteEl = document.createElement('p');
  quoteEl.textContent = q.text;
  quoteEl.style.fontStyle = 'italic';
  quoteEl.style.fontSize = '1.1rem';

  const catEl = document.createElement('small');
  catEl.textContent = `Category: ${q.category}`;
  catEl.style.display = 'block';
  catEl.style.marginTop = '6px';
  catEl.style.color = '#555';

  display.appendChild(quoteEl);
  display.appendChild(catEl);

  // Save last viewed quote index to session storage
  try {
    // store index relative to the full quotes array if possible
    const fullIndex = quotes.indexOf(q);
    sessionStorage.setItem(SESSION_LAST_VIEWED, String(fullIndex));
  } catch (e) {
    // sessionStorage may be unavailable in some contexts
  }
}

// Return unique categories from quotes
function getUniqueCategories() {
  const set = new Set();
  quotes.forEach((q) => {
    if (q && q.category) set.add(q.category);
  });
  return Array.from(set).sort();
}

// Populate the category select with options based on current quotes
function populateCategories() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;
  // remember existing selection
  const previous = localStorage.getItem(SELECTED_CATEGORY_KEY) || 'all';

  // clear existing options
  select.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'All Categories';
  select.appendChild(optAll);

  const cats = getUniqueCategories();
  cats.forEach((cat) => {
    const o = document.createElement('option');
    o.value = cat;
    o.textContent = cat;
    select.appendChild(o);
  });

  // restore previous selection if present and valid
  const valid = previous === 'all' || cats.indexOf(previous) !== -1;
  select.value = valid ? previous : 'all';
}

// Filter quotes by currently selected category and display matching quotes
function filterQuotes() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;
  const selected = select.value;
  try {
    localStorage.setItem(SELECTED_CATEGORY_KEY, selected);
  } catch (e) {
    // ignore
  }

  const display = document.getElementById('quoteDisplay');
  if (!display) return;
  display.innerHTML = '';

  const matched = selected === 'all' ? quotes.slice() : quotes.filter((q) => q.category === selected);
  if (matched.length === 0) {
    display.textContent = 'No quotes match the selected category.';
    return;
  }
  matched.forEach((q) => {
    const quoteEl = document.createElement('p');
    quoteEl.textContent = q.text;
    quoteEl.style.fontStyle = 'italic';
    quoteEl.style.margin = '8px 0 0 0';
    const catEl = document.createElement('small');
    catEl.textContent = `Category: ${q.category}`;
    catEl.style.display = 'block';
    catEl.style.color = '#555';
    display.appendChild(quoteEl);
    display.appendChild(catEl);
  });
}

// Creates and inserts an add-quote form into the DOM
function createAddQuoteForm() {
  const container = document.createElement('div');
  container.id = 'addQuoteContainer';
  container.style.marginTop = '16px';

  const inputText = document.createElement('input');
  inputText.id = 'newQuoteText';
  inputText.type = 'text';
  inputText.placeholder = 'Enter a new quote';
  inputText.style.width = '60%';
  inputText.style.marginRight = '8px';

  const inputCategory = document.createElement('input');
  inputCategory.id = 'newQuoteCategory';
  inputCategory.type = 'text';
  inputCategory.placeholder = 'Enter quote category';
  inputCategory.style.marginRight = '8px';

  const addBtn = document.createElement('button');
  addBtn.id = 'addQuoteBtn';
  addBtn.textContent = 'Add Quote';
  addBtn.addEventListener('click', addQuote);

  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.id = 'exportJsonBtn';
  exportBtn.textContent = 'Export Quotes';
  exportBtn.style.marginLeft = '8px';
  exportBtn.addEventListener('click', exportToJson);

  // Import file input
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.id = 'importFile';
  importInput.accept = '.json,application/json';
  importInput.style.marginLeft = '8px';
  importInput.addEventListener('change', importFromJsonFile);

  container.appendChild(inputText);
  container.appendChild(inputCategory);
  container.appendChild(addBtn);
  container.appendChild(exportBtn);
  container.appendChild(importInput);

  const existing = document.getElementById('quoteDisplay');
  if (existing && existing.parentNode) {
    existing.parentNode.insertBefore(container, existing.nextSibling);
  } else {
    document.body.appendChild(container);
  }
}

// Save quotes array to localStorage
function saveQuotesToLocalStorage() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
  } catch (e) {
    // localStorage may be unavailable or quota exceeded
    console.error('Could not save quotes to localStorage', e);
  }
}

// Load quotes from localStorage (overwrites defaults if present)
function loadQuotesFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      quotes.length = 0; // clear defaults
      parsed.forEach((q) => {
        if (q && q.text) {
          quotes.push({ text: String(q.text), category: q.category || 'Uncategorized' });
        }
      });
    }
  } catch (e) {
    console.error('Could not load quotes from localStorage', e);
  }
}

// Export current quotes to a downloadable JSON file
function exportToJson() {
  try {
    const data = JSON.stringify(quotes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export failed', e);
    alert('Export failed. See console for details.');
  }
}

// Import quotes from a JSON file selected by the user
function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) {
        alert('Imported JSON must be an array of quotes');
        return;
      }
      let added = 0;
      imported.forEach((q) => {
        if (q && q.text) {
          quotes.push({ text: String(q.text), category: q.category || 'Uncategorized' });
          added++;
        }
      });
      if (added > 0) {
        saveQuotesToLocalStorage();
        populateCategories();
        alert(`Imported ${added} quotes successfully!`);
        filterQuotes();
      } else {
        alert('No valid quotes found in the imported file.');
      }
    } catch (err) {
      console.error('Import failed', err);
      alert('Failed to import JSON file. See console for details.');
    }
  };
  reader.readAsText(file);
  // clear the input so the same file can be re-imported if desired
  event.target.value = '';
}

// Adds a new quote from the form to the quotes array and updates the DOM
function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const catInput = document.getElementById('newQuoteCategory');
  if (!textInput || !catInput) return;

  const text = textInput.value.trim();
  const category = catInput.value.trim() || 'Uncategorized';

  if (text.length === 0) {
    alert('Please enter a quote text.');
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);

  textInput.value = '';
  catInput.value = '';

  // persist the new quote and show one (random)
  saveQuotesToLocalStorage();
  populateCategories();
  // select the new category and persist the filter
  const select = document.getElementById('categoryFilter');
  if (select) {
    try {
      select.value = category;
      localStorage.setItem(SELECTED_CATEGORY_KEY, category);
    } catch (e) {}
  }
  filterQuotes();
}

// Initialization: wire up existing button and create the form
document.addEventListener('DOMContentLoaded', () => {
  const newQuoteBtn = document.getElementById('newQuote');
  if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);

  const syncBtn = document.getElementById('syncNow');
  if (syncBtn) syncBtn.addEventListener('click', () => syncWithServer());

  // Load persisted quotes first
  loadQuotesFromLocalStorage();

  createAddQuoteForm();
  populateCategories();

  // Restore last viewed from sessionStorage if available
  try {
    const last = sessionStorage.getItem(SESSION_LAST_VIEWED);
    if (last !== null) {
      const idx = Number(last);
      if (!Number.isNaN(idx) && idx >= 0 && idx < quotes.length) {
        const display = document.getElementById('quoteDisplay');
        const q = quotes[idx];
        if (display && q) {
          display.innerHTML = '';
          const quoteEl = document.createElement('p');
          quoteEl.textContent = q.text;
          quoteEl.style.fontStyle = 'italic';
          quoteEl.style.fontSize = '1.1rem';
          const catEl = document.createElement('small');
          catEl.textContent = `Category: ${q.category}`;
          catEl.style.display = 'block';
          catEl.style.marginTop = '6px';
          catEl.style.color = '#555';
          display.appendChild(quoteEl);
          display.appendChild(catEl);
        }
      } else {
        showRandomQuote();
      }
    } else {
      filterQuotes();
    }
  } catch (e) {
    filterQuotes();
  }

});

// Start periodic polling for server updates
try {
  setInterval(() => {
    syncWithServer();
  }, SYNC_INTERVAL_MS);
} catch (e) {
  console.error('Could not start sync interval', e);
}
