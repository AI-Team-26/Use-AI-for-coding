#!/usr/bin/env python3
"""Web search using EXA AI — answer and search endpoints."""

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# ── Config ──────────────────────────────────────────────────────────────────

EXA_API_KEY = os.environ.get("EXA_API_KEY", "")
#CONFIG_PATH = Path.home() / ".pi" / "web-search.json"
CONFIG_PATH = Path(__file__).parent / "config.json"
EXA_MCP_URL = "https://mcp.exa.ai/mcp"


def get_api_key():
    """Get EXA API key from env var or config file."""
    if EXA_API_KEY:
        return EXA_API_KEY
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH) as f:
                config = json.load(f)
            return config.get("exaApiKey", "")
        except (json.JSONDecodeError, IOError):
            pass
    return None


def has_api_key():
    """Check if an EXA API key is available."""
    return get_api_key() is not None


# ── EXA MCP client (zero-config) ────────────────────────────────────────────

def call_exa_mcp(query):
    """Call EXA MCP tool and return parsed text result."""

    tool_name = "web_search_exa"
    args = {
        "query": query,
        "numResults": 5,
        "livecrawl": "fallback",
        "type": "auto",
        "contextMaxCharacters": 3000,
    }

    '''

    # No API key → use MCP as fallback (zero-config)
    if not api_key:
        print("  [Using EXA MCP — zero config, no API key needed]\n")
        try:
            mcp_text = call_exa_mcp("web_search_exa", {
                "query": query,
                "numResults": 5,
                "livecrawl": "fallback",
                "type": "auto",
                "contextMaxCharacters": 3000,
            })
            # Parse MCP output into structured results
            blocks = mcp_text.split("(?=^Title: )") if "(?=^Title: )" in mcp_text else [mcp_text]
            # Try to parse Title:/URL:/Text: format
            results = []
            current = {}
            for line in mcp_text.split("\n"):
                if line.startswith("Title: "):
                    if current.get("url"):
                        results.append(current)
                    current = {"title": line[7:].strip()}
                elif line.startswith("URL: "):
                    current["url"] = line[5:].strip()
                elif line.startswith("Text: ") or line.startswith("Highlights:"):
                    current["text"] = line.split(":", 1)[1].strip() if ":" in line else ""
            if current.get("url"):
                results.append(current)

            if not results:
                print(f"\n{'='*60}")
                print(f"  RESULTS (via EXA MCP)")
                print(f"{'='*60}")
                print(mcp_text)
                return

            print(f"\n{'='*60}")
            print(f"  RESULTS ({len(results)} found, via EXA MCP)")
            print(f"{'='*60}")
            for i, r in enumerate(results, 1):
                title = r.get("title", "Untitled")
                url = r.get("url", "")
                text = r.get("text", "")
                print(f"\n  {i}. {title}")
                if url:
                    print(f"     {url}")
                if text:
                    print(f"     {text[:200]}")
        except RuntimeError as e:
            print(f"ERROR: {e}")
            print("Set EXA_API_KEY or create ~/.pi/web-search.json for direct API access.")
        return
    '''

    body = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": args},
    }).encode()

    req = Request(EXA_MCP_URL, data=body,
                  headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(req, timeout=60) as resp:
            raw = resp.read().decode()
    except HTTPError as e:
        raise RuntimeError(f"EXA MCP error: HTTP {e.code}")
    except Exception as e:
        raise RuntimeError(f"EXA MCP error: {e}")

    # Parse SSE stream or plain JSON
    for line in raw.split("\n"):
        if line.startswith("data:"):
            payload = line[5:].strip()
            if not payload:
                continue
            try:
                data = json.loads(payload)
            except json.JSONDecodeError:
                continue
            if data.get("error"):
                msg = data["error"].get("message", "Unknown error")
                raise RuntimeError(f"EXA MCP error: {msg}")
            result = data.get("result", {})
            content = result.get("content", [])
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    text = item["text"].strip()
                    if text:
                        #print(f"\n{'='*60}")
                        #print(f"  ANSWER (via EXA MCP)")
                        #print(f"{'='*60}")
                        print(text)
                        
    raise RuntimeError("EXA MCP returned empty response")


# ── EXA Answer endpoint ─────────────────────────────────────────────────────

def search_answer(query):
    """Use EXA's /answer endpoint for synthesized answers with citations."""
    api_key = get_api_key()

    url = "https://api.exa.ai/answer"
    headers = {
        "x-api-key": api_key,
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

def search_search(query):
    """Use EXA's /search endpoint for ranked URL results."""
    api_key = get_api_key()

    url = "https://api.exa.ai/search"
    headers = {
        "x-api-key": api_key,
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

    # No API key → use MCP as fallback (zero-config)
    if not has_api_key():
        print("[Using EXA MCP]\n")
        call_exa_mcp(args.query)
    
    else:
        print("[Using EXA API]\n")
        # Determine which mode(s) to run
        use_answer = bool(args.answer or (args.query and not args.search))
        use_search = bool(args.search or (args.query and not args.answer))

        query = args.answer or args.search or args.query

        if use_answer:
            search_answer(query)

        if use_search:
            search_search(query)


if __name__ == "__main__":
    main()
