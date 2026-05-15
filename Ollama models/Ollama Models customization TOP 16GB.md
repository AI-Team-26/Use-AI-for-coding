# Ciustomization of TOP Models for 16GB VRAM


Models:
- second_constantine/deepseek-coder-v2:16b
- deepseek-coder-v2:16b-lite-instruct-q4_K_M


mistral-nemo:12b-instruct-2407-q4_0
## second_constantine/deepseek-coder-v2:16b

⚠️ With this model if the context is too bit id doesn't simply split on RAM, it actually crash! 

16K or 20K is the max context here.

```bash
create_model_Q4 "second_constantine/deepseek-coder-v2:16b" 20
```

## deepseek-coder-v2:16b-lite-instruct-q4_K_M

```sh
create_model_Q4 deepseek-coder-v2:16b-lite-instruct-q4_K_M 16
```


## codestral:22b-v0.1-q4_K_M

```bash
create_model_Q4 "codestral:22b-v0.1-q4_K_M" 16
```

## gemma4:e4b-it-q8_0
```bash
create_model_Q4 "gemma4:e4b-it-q8_0" 24
```

## granite4.1:30b-q3_K_S
```bash
create_model_Q3 "granite4.1:30b-q3_K_S" 4
```

