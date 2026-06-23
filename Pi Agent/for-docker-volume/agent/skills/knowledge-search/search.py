import urllib.request
import urllib.error
import json
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor


def search_wikipedia(query):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(query)}"
    headers = {'User-Agent': 'PiAgent/1.0 (contact: user@example.com)'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                print(f"--- Wikipedia Summary for: {query} ---")
                print(f"Title: {data.get('title')}")
                print(f"Summary: {data.get('extract')}")
                if data.get('thumbnail'):
                    print(f"Image: {data.get('thumbnail', {}).get('source')}")
            else:
                print(f"--- Wikipedia Summary for: {query} ---")
                print(f"Wikipedia error: Status {response.status}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"--- Wikipedia Summary for: {query} ---")
            print("No Wikipedia page found for this topic.")
        else:
            # Try to read the response body for more context
            body = e.read().decode('utf-8', errors='ignore')
            print(f"--- Wikipedia Summary for: {query} ---")
            print(f"Wikipedia error: Status {e.code}")
            if body:
                print(f"Response body: {body}")
    except Exception as e:
        print(f"--- Wikipedia Summary for: {query} ---")
        print(f"Error searching Wikipedia: {e}")


def search_duckduckgo_instant(query):
    url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json"
    headers = {'User-Agent': 'PiAgent/1.0 (contact: user@example.com)'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            print(f"--- DuckDuckGo Instant Answer for: {query} ---")
            if data.get('AbstractText'):
                print(f"Abstract: {data['AbstractText']}")
            elif data.get('Definition'):
                print(f"Definition: {data['Definition']}")
            else:
                print("No instant answer found.")
            
            if data.get('RelatedTopics'):
                print("\nRelated Topics:")
                for topic in data['RelatedTopics'][:3]:
                    print(f"- {topic.get('Text')} ({topic.get('FirstURL')})")
    except urllib.error.HTTPError as e:
        print(f"--- DuckDuckGo Instant Answer for: {query} ---")
        if e.code == 404:
            print("No DuckDuckGo result found for this query.")
        else:
            print(f"DuckDuckGo error: Status {e.code}")
    except Exception as e:
        print(f"--- DuckDuckGo Instant Answer for: {query} ---")
        print(f"Error searching DuckDuckGo: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 search.py <query>")
        sys.exit(1)
    
    query = sys.argv[1]
    print(f"Searching on DuckDuckGo and Wikipedia for: {query}...\n")
    
    # Run both searches in parallel
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_ddg = executor.submit(search_duckduckgo_instant, query)
        future_wiki = executor.submit(search_wikipedia, query)
        
        # Wait for both to complete
        future_ddg.result()
        future_wiki.result()
