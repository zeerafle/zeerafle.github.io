# temaram

Personal site of Sam Fareez: writing, portfolio and college notes. Jekyll 4 with a custom theme (dark/light, ASCII-rendered images, Monaspace fonts). Live at https://samfareez.is-a.dev.

## Stack

Jekyll ~> 4.4, `jekyll-paginate`, `jekyll-sitemap`, `jekyll-feed`, `jekyll-seo-tag`, `jekyll-toc`. Plain CSS/JS, no build step.

## Writing

- **Post**: `_posts/YYYY-MM-DD-slug.md`. Front matter: `title`, optional `toc: true`, `tags`, `excerpt`.
- **Portfolio**: `_portfolio/slug.md`. Front matter: `title`, `excerpt` (summary), `header.teaser` (cover image), `number` (order; items without it or with `hidden: true` are not listed). Optional `year`, `role`, `stack`, `link`.
- **College note**: `_college-notes/season-N/course/NN-slug.md`. Only `title` is needed; season and course come from the path. Files are ordered by filename. `hidden: true` keeps a note off the index.

## Run locally

```sh
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve   # http://localhost:4000
```

Profile links (home row and footer) live in `_data/links.yml`; icons are Font Awesome Free SVGs in `_includes/icons/` (CC BY 4.0, see `LICENSE.txt` there).

## Deploy

GitHub Actions (`.github/workflows/pages.yml`) builds and deploys on every push to `master`. Repo Settings > Pages > Source must be "GitHub Actions". `CNAME` carries the custom domain.

## TODO

- Chatbot: `$ ask` drawer (`_includes/ask.html`, `assets/js/ask.js`) calls the RAG backend at `chatbot.url` in `_config.yml` (`POST /chat {message, history}`). The LLM key (`FREELLMAPI_KEY`) lives in that backend. `sync_pinecone.py` feeds its index.
- Typesense search.
- Image ascii rendering
- portfolio layout
