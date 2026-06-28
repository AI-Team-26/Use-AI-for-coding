#!/usr/bin/env python3
"""Web search using EXA AI — answer and search endpoints."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import os
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# ── Config ──────────────────────────────────────────────────────────────────

EXA_API_KEY = os.environ.get("EXA_API_KEY", "")

# ── EXA Answer endpoint ─────────────────────────────────────────────────────

def call_answer(query):
    """Use EXA's /answer endpoint for synthesized answers with citations."""
    
    url = "https://api.exa.ai/answer"
    headers = {
        "x-api-key": EXA_API_KEY,
        "Content-Type": "application/json",
    }
    body = json.dumps({"query": query, "text": True}).encode()

    req = Request(url, data=body, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
    except HTTPError as e:
        print(f"EXA answer error: HTTP {e.code}")
        sys.exit(1)
    except Exception as e:
        print(f"EXA answer error: {e}")
        sys.exit(1)

    # Print the synthesized answer
    answer = data.get("answer", "")
    if answer:
        print(f"\n{'='*60}")
        print(f"  ANSWER")
        print(f"{'='*60}")
        print(answer)

    # Print citations/sources
    citations = data.get("citations", [])
    if citations:
        print(f"\n{'─'*60}")
        print(f"  SOURCES")
        print(f"{'─'*60}")
        for i, c in enumerate(citations, 1):
            title = c.get("title", "Untitled")
            url = c.get("url", "")
            published = c.get("publishedDate", "")
            pub_str = f" ({published})" if published else ""
            print(f"  {i}. {title}{pub_str}")
            if url:
                print(f"     {url}")


# ── EXA Search endpoint ─────────────────────────────────────────────────────

def call_search(query):
    """Use EXA's /search endpoint for ranked URL results."""

    url = "https://api.exa.ai/search"
    headers = {
        "x-api-key": EXA_API_KEY,
        "Content-Type": "application/json",
    }
    body = json.dumps({
        "query": query,
        "type": "auto",
        "numResults": 5,
    }).encode()

    req = Request(url, data=body, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
    except HTTPError as e:
        print(f"EXA search error: HTTP {e.code}")
        sys.exit(1)
    except Exception as e:
        print(f"EXA search error: {e}")
        sys.exit(1)

    results = data.get("results", [])
    if not results:
        print("\nNo results found.")
        return

    print(f"\n{'='*60}")
    print(f"  RESULTS ({len(results)} found)")
    print(f"{'='*60}")
    for i, r in enumerate(results, 1):
        title = r.get("title", "Untitled")
        url = r.get("url", "")
        published = r.get("publishedDate", "")
        pub_str = f" ({published})" if published else ""
        text = r.get("text", "")
        highlights = r.get("highlights", [])

        print(f"\n  {i}. {title}{pub_str}")
        if url:
            print(f"     {url}")
        if highlights:
            snippet = " ".join(h for h in highlights if isinstance(h, str) and h.strip())
            if snippet:
                print(f"     {snippet[:200]}")
        elif text:
            snippet = text.strip()[:300]
            if snippet:
                print(f"     {snippet}...")


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Web search using EXA AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 search.py --answer "Is Turboquant active on llama.cpp?"
  python3 search.py --search "MAUI best way to create a button"
  python3 search.py "your query"          # runs both modes
        """,
    )
    parser.add_argument("query", nargs="?", help="Search query")
    parser.add_argument("--answer", help="Use EXA Answer endpoint (synthesized answer)")
    parser.add_argument("--search", help="Use EXA Search endpoint (ranked URLs)")
    args = parser.parse_args()

    if not args.query and not args.answer and not args.search:
        parser.print_help()
        sys.exit(1)


    # Determine which mode(s) to run
    use_answer = bool(args.answer or (args.query and not args.search))
    use_search = bool(args.search or (args.query and not args.answer))

    query = args.answer or args.search or args.query

    # Run both calls in parallel when both modes are requested
    if use_answer and use_search:
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_answer = executor.submit(call_answer, query)
            future_search = executor.submit(call_search, query)
            
            # Wait for both to complete
            future_answer.result()
            future_search.result()
    elif use_answer:
        call_answer(query)
    elif use_search:
        call_search(query)


if __name__ == "__main__":
    main()
