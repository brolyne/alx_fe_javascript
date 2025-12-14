// Quotes array with sample quotes
const quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspirational" },
  { text: "Simplicity is the soul of efficiency.", category: "Productivity" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

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
  const idx = getRandomInt(quotes.length);
  const q = quotes[idx];
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

  container.appendChild(inputText);
  container.appendChild(inputCategory);
  container.appendChild(addBtn);

  const existing = document.getElementById('quoteDisplay');
  if (existing && existing.parentNode) {
    existing.parentNode.insertBefore(container, existing.nextSibling);
  } else {
    document.body.appendChild(container);
  }
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

  showRandomQuote();
}

// Initialization: wire up existing button and create the form
document.addEventListener('DOMContentLoaded', () => {
  const newQuoteBtn = document.getElementById('newQuote');
  if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);

  createAddQuoteForm();
  showRandomQuote();
});
