
/* JS code to allow navbar colour change from transparent to opaque upon scrolling */

window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 10) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // Search bar suggestions functionality

  const searchInput = document.getElementById('search-input');
  const suggestionsBox = document.getElementById('search-suggestions');
  const searchForm = document.getElementById('search-form');
  let currentFocus = -1;
  
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    suggestionsBox.innerHTML = '';
    currentFocus = -1; // Reset selection index
  
    // Hide suggestions if input is empty
    if (query.length === 0) {
      suggestionsBox.classList.add('d-none');
      return;
    }
  
    try {
      const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
      const results = await res.json();
  
      if (results.length > 0) {
        results.forEach(book => {
          const li = document.createElement('li');
          li.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'align-items-center', 'gap-3');
  
          const coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-S.jpg`;
  
          li.innerHTML = `
            <img src="${coverUrl}" alt="Cover for ${book.title}" class="rounded" style="width: 40px; height: auto;"
              onerror="this.onerror=null; this.src='/images/fallbackcover.png';">
            <div>
              <strong>${book.title}</strong><br>
              <small class="text-muted">by ${book.author}</small>
            </div>
          `;
  
          li.addEventListener('click', () => {
            window.location.href = `/reviews/${book.id}`;
          });
  
          suggestionsBox.appendChild(li);
        });
  
        // Show the dropdown after results are added
        suggestionsBox.classList.remove('d-none');
      } else {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'text-muted');
        li.textContent = 'No books found';
        suggestionsBox.appendChild(li);
  
        // Still show the dropdown even if no results (to show "No books found")
        suggestionsBox.classList.remove('d-none');
      }
    } catch (err) {
      console.error('Error fetching search results:', err);
      suggestionsBox.classList.add('d-none'); // Hide on error
    }
  });
  
  // Hide suggestions when user clicks outside the search area
  document.addEventListener('click', (e) => {
    if (!searchForm.contains(e.target)) {
      suggestionsBox.classList.add('d-none');
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsBox.querySelectorAll('.list-group-item');
  
    if (items.length === 0) return;
  
    if (e.key === 'ArrowDown') {
      currentFocus++;
      highlightActive(items);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      currentFocus--;
      highlightActive(items);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) {
        items[currentFocus].click();
      }
    }
  });

  function highlightActive(items) {
    items.forEach(item => item.classList.remove('active'));
  
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
  
    items[currentFocus].classList.add('active');
    items[currentFocus].scrollIntoView({ block: 'nearest' });
  }