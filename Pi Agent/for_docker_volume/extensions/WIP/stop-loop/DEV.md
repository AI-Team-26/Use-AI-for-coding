


Local models (especially 26B/35B) sometimes get stuck generating the same lines of code over and over, or they write broken JavaScript and don't know how to fix it. You need a Skill (a tool the model can call) to validate the code and break the loop.

A. The Loop Breaker Logic (Inside the Extension)
To prevent the model from getting stuck in an infinite generation loop (where it just outputs the same 500 tokens forever), add this heuristic check to your Extension:


B. The Self-Correction Skill (Code Validation)
Instead of guessing if the JS is correct, give Pi a Skill that actually runs the code.
Create a Skill in Pi called validate_js_syntax: