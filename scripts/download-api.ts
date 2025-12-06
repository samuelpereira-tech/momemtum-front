import { writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Script para baixar/atualizar arquivo de API de autenticação
 * 
 * Uso:
 *   yarn download:auth <url>
 *   yarn download:auth http://localhost:3000/api-json
 */
async function downloadApiFile(url: string, outputPath: string) {
  try {
    console.log(`📥 Baixando arquivo de: ${url}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type') || ''
    let content: string
    
    if (contentType.includes('application/json')) {
      const json = await response.json()
      content = JSON.stringify(json, null, 2)
    } else {
      content = await response.text()
    }
    
    // Garantir que o diretório existe
    const dir = dirname(outputPath)
    await mkdir(dir, { recursive: true })
    
    // Salvar arquivo
    await writeFile(outputPath, content, 'utf-8')
    
    console.log(`✅ Arquivo salvo com sucesso em: ${outputPath}`)
    console.log(`📊 Tamanho: ${(content.length / 1024).toFixed(2)} KB`)
    
  } catch (error) {
    console.error('❌ Erro ao baixar arquivo:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Obter URL dos argumentos da linha de comando
const url = process.argv[2]

if (!url) {
  console.error('❌ Por favor, forneça uma URL como argumento')
  console.log('Uso: yarn download:auth <url>')
  console.log('Exemplo: yarn download:auth http://localhost:3000/api-json')
  process.exit(1)
}

// Validar URL
try {
  new URL(url)
} catch {
  console.error('❌ URL inválida:', url)
  process.exit(1)
}

// Caminho de saída na pasta de autenticação
const outputPath = join(__dirname, '..', 'docs', 'apis', 'authentication', 'api.json')

// Executar download
downloadApiFile(url, outputPath)

