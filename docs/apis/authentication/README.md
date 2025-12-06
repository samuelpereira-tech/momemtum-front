# API de Autenticação

Esta pasta contém a especificação da API de autenticação baixada automaticamente.

## Como atualizar o arquivo da API

Para baixar/atualizar o arquivo da API de autenticação, execute:

```bash
yarn download:auth <url>
```

### Exemplos:

```bash
# Baixar da API local
yarn download:auth http://localhost:3000/api-json

# Baixar de outra URL
yarn download:auth https://api.exemplo.com/swagger.json
```

O arquivo será salvo automaticamente em `docs/apis/authentication/api.json`.

## Arquivo gerado

- `api.json` - Especificação da API de autenticação (OpenAPI/Swagger)

