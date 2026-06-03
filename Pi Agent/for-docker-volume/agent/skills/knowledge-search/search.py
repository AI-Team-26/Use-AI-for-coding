import urllib.request
import json
import sys
import urllib.parse

def search_wikipedia(query):
    print(f"--- Wikipedia Summary for: {query} ---")
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(query)}"
    headers = {'User-Agent': 'PiAgent/1.0 (contact: user@example.com)'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                print(f"Title: {data.get('title')}")
                print(f"Summary: {data.get('extract')}")
                if data.get('thumbnail'):
                    print(f"Image: {data.get('thumbnail', {}).get('source')}")
            elif response.status == 404:
                print("No Wikipedia page found for this topic.")
            else:
                print(f"Wikipedia error: Status {response.status}")
    except Exception as e:
        print(f"Error searching Wikipedia: {e}")

def search_duckduckgo_instant(query):
    print(f"--- DuckDuckGo Instant Answer for: {query} ---")
    url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json"
    headers = {'User-Agent': 'PiAgent/1.0 (contact: user@example.com)'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
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
    except Exception as e:
        print(f"Error searching DuckDuckGo: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 search.py <query>")
        sys.exit(1)
    
    query = sys.argv[1]
    search_duckduckgo_instant(query)
    print("\n")
    search_wikipedia(query)
