# Plan Subscriptions


| Provider    | $/m (min)     | PAYG | Min top up | Free models | Models            | Pricing                           |  
| ---         |            ---| ---  | ---        | ---         | ---               |                                   |               
| DeepSeek    |               | Ok   |            | ❔          | Few and cheap     |                                   |
| Xiaomi      |         6.00  | Ok   |         50 | ❔          |                   |                                   |
| AliBaba     |               |      |            | ❌         |                   |                                   |
| Google      |               |      |            | ❔          |                   |                                   | 
| Z.ai        |         14.40 |      |            | ❔          |                   |                                   |
| Mistral     |               |      |            | ❔          |                   |                                   |
| Openrouter  |               |      |            | ✔️         |                   |                                   |
| Ofox.ai     |               |      |         10 | ✔️         |                   |                                   |
| Eden.ai     |               |      |          5 | ❔          |                   |                                   |
| TokenMix    |               |      |          5 | ❔          |                   |                                   |
| Novita.ai   |         20.00 | Yes  |          5 |             | many, cheap       | good                              |
| Kiro.dev    |               |      |            | ❔          |                   |                                   | 


## Mono-provider

### DeepSeek 

Few models to pick.  
Cheapest models, expecially **deepseef4-flash**.  

- Models: 
- Pricing: https://api-docs.deepseek.com/quick_start/pricing/ 

### Xiaomi 🥇

https://platform.xiaomimimo.com/token-plan 

+ Cheap

- Models: ...
- Plans: https://z.ai/subscribe 
- Pricing: does it have PAYG ?


### AliBaba


### Z.ai

### Google



### Mistral


## Multi-provider

### Ofox.ai

Models: https://ofox.ai/models?utm=app_ofox
Pricing: 
 


### Openrouter

```bash
  curl https://openrouter.ai/api/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENROUTER_API_KEY_PI_AGENT" \
    -d '{
    "model": "poolside/laguna-m.1:free",
    "messages": [
      {
        "role": "user",
        "content": "How many r`s are in the word `strawberry?`"
      }
    ],
    "reasoning": {
      "enabled": true
    }
}'
```



### Eden.ai 


### TokenMix


### Novita.ai

Models:  https://novita.ai/pricing
Pricing: https://novita.ai/pricing
Plan:    https://novita.ai/billing/coding-plan   "Lite" / -20 USD/m  /  50M / no restictions
Sandbox: https://novita.ai/pricing?sandbox=1
