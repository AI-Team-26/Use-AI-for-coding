# This is a Tool/Skill available to the LLM in Pi
def validate_js_syntax(html_code: str) -> str:
    import subprocess, tempfile, os, re
    
    # Extract JS from the HTML
    match = re.search(r'<script>(.*?)</script>', html_code, re.DOTALL)
    if not match:
        return "No script tag found."
        
    js_code = match.group(1)
    
    # Write to temp file and use Node.js to check syntax without executing
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
        f.write(js_code)
        temp_name = f.name
        
    try:
        result = subprocess.run(['node', '--check', temp_name], capture_output=True, text=True)
        if result.returncode != 0:
            return f"SYNTAX ERROR DETECTED:\n{result.stderr}\n\nPlease fix this specific error in the code."
        return "Syntax is valid. No errors."
    finally:
        os.unlink(temp_name)