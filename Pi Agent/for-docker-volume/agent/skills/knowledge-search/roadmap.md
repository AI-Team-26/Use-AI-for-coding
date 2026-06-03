# Roadmap for Knowledge Search Skill

## Current State
- Uses DuckDuckGo Instant Answer API and Wikipedia REST API.
- Dependency-free (uses only Python built-ins).
- Provides summaries and quick definitions.

## Future Improvements

### 1. Upgrade to Full Web Search (High Priority)
Transition from "Instant Answers" to full web search results to allow for deep research.

**Recommended Provider: Brave Search API**
- **Why:** Bot-friendly, returns clean JSON (titles, URLs, snippets), generous free tier (2000 queries/month).
- **Implementation:**
  ```bash
  curl -s "https://api.search.brave.com/res/v1/web/search?q=query" \
    -H "Accept: application/json" \
    -H "X-Subscription-Token: YOUR_API_KEY"
  ```

**Other Options Considered:**
- **Serper.dev:** Google results via API (2500 free queries).
- **SerpAPI:** High quality but lower free tier (100 queries/month).
- **Google Custom Search:** 100 free/day, then paid.

### 2. Enhanced Scraping
- Implement better handling of JavaScript-heavy sites (might require a headless browser or a specialized scraping API).
- Improve text cleaning to remove boilerplate (headers, footers, ads) more effectively.

### 3. Multi-Source Verification
- Automatically cross-reference information from multiple search results to increase accuracy.
