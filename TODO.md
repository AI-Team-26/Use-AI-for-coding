# TODO

- test models
  [x] script.sh contains the "test_model" function that has to be completed.
  [x] Collect the ollama run output. Calling the API is nice but too laborious, and needs a lot of work to calculate some values (also UM is cumbersome).
  [ ] Correct the test_model script Time value
  [ ] Correct the test_model script to set Result based on tools capability and GPU usage + context size

- Test models on 16GB card
  Test the suggested models.

- Verify the "tools" capability
  It seems like some models that have the tools capability, return the JSON tool call instead of actually use it. (codegemma, qwen-coder-1.5)

- Organize Qwen Code settings to use different providers, if possible


- Customization
  Find a way to compare model results, customized vs original
