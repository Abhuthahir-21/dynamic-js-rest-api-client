# Foundry — Dynamic JavaScript DOM Logic & RESTful API Client

A responsive product explorer built for the supplied internship task brief.

## Features implemented
- Async/await REST API requests using the public DummyJSON products API.
- Modular JavaScript split into `api.js` (network/cache layer) and `app.js` (DOM/state layer).
- Live search across product title, description, brand and category.
- Dynamically generated category tabs.
- Sorting by featured order, price ascending/descending, rating and product name.
- Client-side cart state with quantity controls and `localStorage` persistence.
- Five-minute API response cache in `localStorage`.
- Loading skeletons, retryable error banner, network timeout and empty search state.
- Responsive product grid, accessible labels and reduced-motion support.

## Run
Because the JavaScript uses ES modules, run through a local server rather than opening the HTML file directly:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## API
- Base URL: `https://dummyjson.com`
- Products: `/products?limit=100&select=id,title,description,category,price,rating,thumbnail,images,brand`
- Categories: `/products/category-list`

The application requires an internet connection for the first live API request. Cached product/category responses can be reused for five minutes.

## Files
- `index.html` — semantic page structure
- `style.css` — design tokens and responsive styling
- `api.js` — REST client, timeout, error normalization and API cache
- `app.js` — UI rendering, filtering, sorting, cart and local persistence
- `screenshots/task-brief.png` — supplied task brief reference

## GitHub submission
1. Create a public repository named `dynamic-js-rest-api-client`.
2. Upload the contents of this folder to the repository root.
3. Commit the files.
4. Submit `https://github.com/YOUR-USERNAME/dynamic-js-rest-api-client` as the public proof link.

To publish a live demo, enable GitHub Pages in **Settings → Pages**, deploy from branch `main` and folder `/(root)`. Note: the project uses ES modules and fetch; test through the published Pages URL after deployment.
