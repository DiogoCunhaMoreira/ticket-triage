# Ticket Triage Agent - Documentação Completa

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Arquitetura do Sistema](#-arquitetura-do-sistema)
3. [Estrutura do Projeto](#-estrutura-do-projeto)
4. [Ficheiros TypeScript - Análise Detalhada](#-ficheiros-typescript---análise-detalhada)
5. [Conceitos Técnicos Avançados](#-conceitos-técnicos-avançados)
6. [Fluxo de Execução Completo](#-fluxo-de-execução-completo)
7. [Schema e Validação](#-schema-e-validação)
8. [Setup e Utilização](#-setup-e-utilização)
9. [Tecnologias e Dependências](#-tecnologias-e-dependências)
10. [Melhores Práticas](#-melhores-práticas)
11. [Extensões Futuras](#-extensões-futuras)
12. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

O **Ticket Triage Agent** é um sistema automatizado que usa **Google Gemini AI** para analisar, classificar e rotear tickets de suporte técnico de uma equipa de produto web frontend.

### Funcionalidades Principais

- ✅ Classificação automática de tickets (bug/question/task)
- ✅ Atribuição de prioridade (P0-P3)
- ✅ Identificação de componentes afetados
- ✅ Roteamento para equipas especializadas
- ✅ Deteção de informação em falta
- ✅ Geração de comentários rascunho para resposta ao cliente
- ✅ Decisão automática de escalação

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Interface                        │
│                         (cli.ts)                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Triage Logic Engine                       │
│                       (triage.ts)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Construção de Prompt                               │   │
│  │ • Conversão Zod → JSON Schema                        │   │
│  │ • Chamada API Gemini                                 │   │
│  │ • Validação de Resposta                              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ Gemini   │ │ Schema   │ │ Rules    │
         │ Client   │ │ (Zod)    │ │ (future) │
         │          │ │          │ │          │
         └──────────┘ └──────────┘ └──────────┘
              │
              ▼
    ┌──────────────────┐
    │  Google Gemini   │
    │  API (3-Flash)   │
    └──────────────────┘
```

---

## 📁 Estrutura do Projeto

```
ticket-agent/
├── src/
│   ├── cli.ts              # Interface CLI - ponto de entrada
│   ├── gemini.ts           # Cliente API Google Gemini
│   ├── schema.ts           # Schemas Zod para validação
│   ├── triage.ts           # Lógica principal de triagem
│   ├── rules.ts            # [Vazio] Placeholder para regras futuras
│   └── list-models.ts      # Utilitário para listar modelos disponíveis
├── data/
│   └── tickets/
│       └── TCK-001.json    # Exemplo de ticket
├── .env                    # Configuração API key
├── package.json
├── tsconfig.json
├── README.md
└── DOCUMENTATION.md        # Este ficheiro
```

---

## 📄 Ficheiros TypeScript - Análise Detalhada

### 1. `src/cli.ts` - Interface de Linha de Comandos

**Propósito:** Ponto de entrada da aplicação. Lê ficheiros JSON de tickets e orquestra o processo de triagem.

```typescript
import { readFileSync } from "node:fs";
import { triageTicket } from "./triage.js";
```

**Importações:**
- `readFileSync`: Função do Node.js para leitura síncrona de ficheiros
- `triageTicket`: Função principal que executa a análise de IA

#### Função Principal

```typescript
async function main() {
  const file = process.argv[2];
```

**Validação de Argumentos:**
```typescript
  if (!file) {
    console.error("Usage: npx ts-node src/cli.ts data/tickets/TCK-001.json");
    process.exit(1);
  }
```
- `process.argv[2]`: Captura o terceiro argumento da linha de comandos (caminho do ficheiro)
- Exemplo: `npm run triage data/tickets/TCK-001.json` → `file = "data/tickets/TCK-001.json"`
- Se não houver ficheiro, mostra mensagem de erro e termina com código de erro (1)

**Leitura e Parsing do Ticket:**
```typescript
  const ticket = JSON.parse(readFileSync(file, "utf-8"));
```
- `readFileSync(file, "utf-8")`: Lê o conteúdo do ficheiro como string UTF-8
- `JSON.parse()`: Converte a string JSON num objeto JavaScript
- Resultado: `ticket` contém os dados estruturados do ticket

**Processamento:**
```typescript
  const out = await triageTicket(ticket);
```
- `await`: Espera pela conclusão da função assíncrona (a chamada à API demora tempo)
- `triageTicket()`: Envia o ticket para análise de IA
- `out`: Objeto com o resultado da triagem (prioridade, tipo, comentário, etc.)

**Exibição dos Resultados:**
```typescript
  console.log("\n=== TRIAGE JSON ===\n");
  console.log(JSON.stringify(out, null, 2));

  console.log("\n=== DRAFT COMMENT ===\n");
  console.log(out.draft_comment);
```
- Mostra o resultado completo formatado em JSON com 2 espaços de indentação
- Mostra o comentário rascunho isolado (parte mais relevante para suporte ao cliente)

**Tratamento de Erros:**
```typescript
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```
- Captura qualquer erro que ocorra durante a execução
- Mostra o erro no console e termina com código de erro

---

### 2. `src/gemini.ts` - Cliente API Google Gemini

**Propósito:** Inicializa e exporta o cliente da API do Google Gemini para uso em toda a aplicação.

```typescript
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({}); 
```

**Análise Linha a Linha:**

1. **`import "dotenv/config"`**
   - Carrega automaticamente variáveis de ambiente do ficheiro `.env`
   - Executa `dotenv.config()` durante a importação
   - Torna `process.env.GEMINI_API_KEY` disponível

2. **`import { GoogleGenAI }`**
   - Importa a classe principal do SDK oficial do Google Gemini
   - Biblioteca: `@google/genai`

3. **`export const ai = new GoogleGenAI({})`**
   - Cria instância do cliente com objeto de configuração vazio
   - **Comportamento:** O SDK lê automaticamente `process.env.GEMINI_API_KEY` quando a config está vazia
   - `export`: Torna a instância `ai` disponível para outros ficheiros importarem
   - **Pattern:** Singleton - uma única instância partilhada em todo o projeto

**Nota Técnica:** Este ficheiro centraliza a configuração da API. Outros módulos simplesmente importam `ai` sem se preocupar com autenticação.

---

### 3. `src/list-models.ts` - Utilitário para Listar Modelos

**Propósito:** Script auxiliar para listar todos os modelos Gemini disponíveis na conta.

```typescript
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
```

**Diferença de `gemini.ts`:**
- Passa a API key **explicitamente** no construtor
- `!` (non-null assertion): Diz ao TypeScript "confia, esta variável existe"

```typescript
async function main() {
  const models = await ai.models.list({});
  for await (const m of models) {
    console.log(m.name);
  }
}

main().catch(console.error);
```

**Análise:**
- `ai.models.list({})`: Chama o endpoint da API para listar modelos
- `for await`: Loop assíncrono (porque `models` é um AsyncIterable)
- Itera sobre cada modelo e mostra o seu nome

**Exemplo de Output:**
```
gemini-3-flash-preview
gemini-2.0-flash-exp
gemini-1.5-pro
gemini-1.5-flash
```

**Uso:**
```bash
npx tsx src/list-models.ts
```

---

### 4. `src/schema.ts` - Schemas de Validação com Zod

**Propósito:** Define a estrutura de dados e regras de validação usando Zod.

```typescript
import { z } from "zod";
```

#### Definição dos Enums

```typescript
export const TicketType = z.enum(["bug", "question", "task"]);
```
- Define os 3 tipos possíveis de ticket
- `z.enum()`: Cria um schema que só aceita estes valores exatos

```typescript
export const Priority = z.enum(["P0", "P1", "P2", "P3"]);
```
- **P0**: Crítico (sistema em baixo, pagamentos quebrados)
- **P1**: Alto (funcionalidade importante afetada)
- **P2**: Médio (problema menor mas visível)
- **P3**: Baixo (questões não urgentes)

```typescript
export const Component = z.enum([
  "checkout",
  "auth",
  "navigation",
  "ui",
  "performance",
  "forms",
  "payments",
  "search",
  "unknown",
]);
```
- Identifica qual componente/área do produto está afetado
- "unknown" para casos onde não é claro

```typescript
export const Team = z.enum([
  "frontend-core",
  "web-platform",
  "growth",
  "payments",
  "unknown"
]);
```
- Define as equipas disponíveis para roteamento

#### Schema Principal do Output

```typescript
export const TriageOutputSchema = z.object({
  ticket_id: z.string(),
```
- ID do ticket (string obrigatória)

```typescript
  ticket_type: TicketType,
  priority: Priority,
  component: Component,
```
- Usa os enums definidos anteriormente
- Garante valores consistentes

```typescript
  labels: z.array(z.string()).max(12),
```
- Array de strings com **máximo de 12 elementos**
- `.max(12)`: Validação que rejeita arrays maiores

```typescript
  routing: z.object({
    team: Team,
    reason: z.string().min(5),
  }),
```
- **Objeto aninhado** com informação de roteamento
- `team`: Equipa para encaminhar (usa enum Team)
- `reason`: Justificação com **mínimo 5 caracteres**

```typescript
  missing_info_questions: z.array(z.string()).max(8),
```
- Array de perguntas sobre informação em falta
- **Máximo 8 perguntas**

```typescript
  draft_comment: z.string().min(20),
```
- Comentário rascunho para responder ao utilizador
- **Mínimo 20 caracteres** (evita respostas vazias/inúteis)

```typescript
  should_escalate: z.boolean(),
  escalate_reason: z.string().optional(),
```
- `should_escalate`: Flag booleana para escalação
- `escalate_reason`: Razão da escalação (campo **opcional**)

```typescript
  confidence: z.number().min(0).max(1),
});
```
- Nível de confiança da IA (de 0.0 a 1.0)
- `.min(0).max(1)`: Valida que está neste intervalo

#### Type Inference

```typescript
export type TriageOutput = z.infer<typeof TriageOutputSchema>;
```

**O que faz `z.infer`?**
- Extrai automaticamente o tipo TypeScript a partir do schema Zod
- Evita duplicação de código

**Exemplo do que acontece internamente:**
```typescript
// Zod infere automaticamente:
type TriageOutput = {
  ticket_id: string;
  ticket_type: "bug" | "question" | "task";
  priority: "P0" | "P1" | "P2" | "P3";
  component: "checkout" | "auth" | ... | "unknown";
  labels: string[];
  routing: {
    team: "frontend-core" | "web-platform" | ... | "unknown";
    reason: string;
  };
  missing_info_questions: string[];
  draft_comment: string;
  should_escalate: boolean;
  escalate_reason?: string | undefined; // .optional() vira '?'
  confidence: number;
};
```

**Vantagens do `z.infer`:**
- ✅ **Single Source of Truth:** Define schema UMA vez, tipo vem de graça
- ✅ **Sempre sincronizado:** Se mudares o schema, o tipo muda automaticamente
- ✅ **Menos código:** Não precisas escrever interface + schema separadamente
- ✅ **Type-safety garantida:** TypeScript e validação runtime usam a mesma definição

---

### 5. `src/rules.ts` - Regras de Negócio

**Estado Atual:** Ficheiro vazio ou não existente - serve como placeholder.

**Propósito Futuro:** Pode conter:
- Regras de priorização hardcoded
- Lógica de roteamento baseada em keywords
- Validações específicas de negócio
- Filtros pré/pós processamento

**Exemplo de uso futuro:**
```typescript
export function shouldEscalate(ticket: Ticket): boolean {
  if (ticket.title.includes("payment failed")) return true;
  if (ticket.severity_hint === "critical") return true;
  return false;
}

export const PRIORITY_KEYWORDS = {
  P0: ["down", "broken", "critical", "emergency"],
  P1: ["bug", "error", "not working"],
  P2: ["issue", "problem"],
  P3: ["question", "how to", "help"],
};
```

---

### 6. `src/triage.ts` - Lógica Principal de Triagem

**Propósito:** Contém a lógica central que coordena a análise de tickets usando IA.

```typescript
import { zodToJsonSchema } from "zod-to-json-schema";
import { ai } from "./gemini.js";
import { TriageOutputSchema, type TriageOutput } from "./schema.js";
```

**Importações:**
- `zodToJsonSchema`: Converte schemas Zod para formato JSON Schema (standard)
- `ai`: Instância do cliente Gemini já configurada
- `TriageOutputSchema`: Schema de validação
- `TriageOutput`: Tipo TypeScript inferido

#### Função Principal

```typescript
export async function triageTicket(ticket: any): Promise<TriageOutput> {
```
- Função assíncrona que recebe um ticket (tipo `any` por segurança)
- Retorna uma Promise que resolve para `TriageOutput` validado

#### Construção do Prompt

```typescript
  const prompt = `
You are a ticket triage assistant for a frontend web product team.

Ticket JSON:
${JSON.stringify(ticket, null, 2)}

Return ONLY JSON that matches the provided JSON Schema.
Rules:
- If ticket indicates checkout/payment is broken in production or users can't complete purchase => priority P0/P1 and should_escalate=true.
- Ask for missing info: steps to reproduce, expected vs actual, browser/os/device, screenshots, console errors, network HAR, feature-flag state, regression (when started).
- Labels should be consistent kebab-case (e.g., "needs-repro", "safari", "checkout", "regression").
- Draft comment must be polite, actionable, and structured with bullet points.
- Do NOT invent logs/metrics. If evidence is missing, say so and ask for it.
`;
```

**Estrutura do Prompt:**

1. **Papel da IA:** "ticket triage assistant for a frontend web product team"
2. **Dados:** Ticket serializado em JSON formatado
3. **Instrução principal:** "Return ONLY JSON that matches the provided JSON Schema"
4. **Regras específicas:**
   - **Priorização crítica:** Checkout/payment quebrados → P0/P1 + escalação
   - **Informação em falta:** Lista específica (steps, browser, console errors, HAR, feature flags, regression timeline)
   - **Labels consistentes:** Formato kebab-case
   - **Comentário profissional:** Polido, acionável, estruturado
   - **Anti-alucinação:** NÃO inventar logs/métricas, pedir quando em falta

#### Preparação do Schema

```typescript
  // Tenta usar o método nativo do Zod v4
  const zodSchema = TriageOutputSchema.toJSONSchema();
```
- **Zod v4:** Usa o método nativo `.toJSONSchema()` do próprio Zod
- Converte o schema Zod para formato JSON Schema (standard OpenAPI/JSON Schema Draft 2020-12)

```typescript
  // Remove propriedades incompatíveis
  delete (zodSchema as any).$schema;
  delete (zodSchema as any).additionalProperties;
```
- **Limpeza:** Remove propriedades que podem causar problemas com a API Gemini
  - `$schema`: Metadado do JSON Schema não necessário para a API
  - `additionalProperties`: Pode conflitar com validação da API

```typescript
  console.log("\n=== SCHEMA GERADO POR ZOD ===");
  console.log(JSON.stringify(zodSchema, null, 2));
  console.log("===============================\n");
```
- **Debug:** Mostra o schema JSON gerado no console
- Útil para verificar se o schema está correto antes de enviar à API
- Ajuda a diagnosticar problemas de estrutura

#### Chamada à API Gemini

```typescript
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
```
- Especifica o modelo Gemini a usar
- **gemini-3-flash-preview:** Versão preview com melhor suporte a structured output
- Alternativas: `gemini-2.0-flash-exp`, `gemini-1.5-pro`

```typescript
    contents: prompt,
```
- Passa o prompt construído anteriormente como conteúdo da mensagem

```typescript
    config: {
      responseMimeType: "application/json",
```
- **Força resposta em JSON:** Garante que o modelo retorna JSON válido (não texto livre ou markdown)
- O modelo é configurado para SEMPRE retornar JSON puro

```typescript
      responseJsonSchema: zodSchema,
```
- **Schema estruturado:** Diz ao modelo EXATAMENTE que estrutura JSON deve gerar
- O modelo tentará seguir este schema rigorosamente durante a geração

**Porque usar `responseJsonSchema` em vez de só pedir JSON no prompt?**

| Abordagem | Resultado |
|-----------|-----------|
| **Só prompt** | ❌ Modelo pode inventar campos<br>❌ Pode faltar campos obrigatórios<br>❌ Valores fora do esperado<br>❌ JSON envolvido em markdown |
| **responseJsonSchema** | ✅ Garante JSON válido<br>✅ Segue estrutura exata<br>✅ Não inventa campos<br>✅ Respeita enums<br>✅ Parsing direto |

**Analogia:** É como dar um **formulário** com campos específicos vs. pedir "escreve em JSON". O formulário garante consistência.

```typescript
    },
  });
```

#### Processamento da Resposta

```typescript
  const parsed = JSON.parse(response.text || '{}');
```
- `response.text`: Extrai o texto da resposta (será JSON porque configurámos `responseMimeType`)
- `|| '{}'`: Fallback para objeto vazio se `text` for undefined/null
- `JSON.parse()`: Converte string JSON em objeto JavaScript

```typescript
  return TriageOutputSchema.parse(parsed);
```
- **Validação crítica com Zod:** Valida o objeto parseado contra o schema
- **Se passar:** Retorna o objeto validado e type-safe
- **Se falhar:** Lança `ZodError` com detalhes do que está errado:
  - Campos em falta
  - Tipos incorretos
  - Valores fora do enum
  - Limites excedidos (ex: mais de 12 labels, menos de 20 chars no comment)

---

## 🔬 Conceitos Técnicos Avançados

### Schema como Input vs. JSON como Output

**Fluxo Completo:**

```
┌─────────────────────────────────────────────┐
│ 1. DEFINES O SCHEMA ZOD                     │
│                                             │
│ const Schema = z.object({                   │
│   priority: z.enum(["P0", "P1", "P2", "P3"]),│
│   draft_comment: z.string().min(20),        │
│   labels: z.array(z.string()).max(12),      │
│ });                                         │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 2. CONVERSÃO PARA JSON SCHEMA               │
│                                             │
│ const jsonSchema = Schema.toJSONSchema();   │
│ Resultado:                                  │
│ {                                           │
│   "type": "object",                         │
│   "properties": {                           │
│     "priority": {                           │
│       "enum": ["P0", "P1", "P2", "P3"]      │
│     },                                      │
│     "draft_comment": {                      │
│       "type": "string",                     │
│       "minLength": 20                       │
│     },                                      │
│     "labels": {                             │
│       "type": "array",                      │
│       "items": {"type": "string"},          │
│       "maxItems": 12                        │
│     }                                       │
│   },                                        │
│   "required": ["priority", ...]             │
│ }                                           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 3. ENVIA PARA GEMINI                        │
│                                             │
│ config: { responseJsonSchema: jsonSchema }  │
│                                             │
│ Gemini recebe INSTRUÇÕES ESTRUTURADAS:      │
│ "Gera um objeto JSON onde:                  │
│  - priority DEVE ser P0|P1|P2|P3            │
│  - draft_comment DEVE ter >= 20 chars       │
│  - labels DEVE ser array com <= 12 strings" │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 4. GEMINI GERA JSON                         │
│                                             │
│ O modelo PREENCHE os campos seguindo regras │
│                                             │
│ Se tentar valores inválidos:                │
│   "priority": "SUPER_HIGH" → REJEITADO      │
│   "draft_comment": "Hi" → REJEITADO (< 20)  │
│   labels: [13 items] → REJEITADO (> 12)     │
│                                             │
│ Output válido:                              │
│ {                                           │
│   "priority": "P1",                         │
│   "draft_comment": "Thank you for...",      │
│   "labels": ["safari", "checkout"]          │
│ }                                           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 5. RETORNA STRING JSON                      │
│                                             │
│ response.text = '{"priority":"P1",...}'     │
│ É SEMPRE JSON válido (nunca markdown)       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 6. PARSE E VALIDAÇÃO FINAL                  │
│                                             │
│ const parsed = JSON.parse(response.text);   │
│ return Schema.parse(parsed); // Zod valida  │
└─────────────────────────────────────────────┘
```

**Resumo:**
- ✅ **Schema é INPUT:** Defines a estrutura que queres
- ✅ **String JSON é OUTPUT:** Modelo retorna texto formatado
- ✅ **Modelo preenche** seguindo regras (obrigatórios, enums, limites)

---

### Validação em Dois Níveis

**Há 2 momentos de validação:**

#### Nível 1: Validação IMPLÍCITA pela API Gemini (durante geração)

```typescript
config: {
  responseJsonSchema: zodSchema,  // ← Schema enviado AQUI
}
```

**O que acontece:**
1. Gemini recebe o JSON Schema
2. **Durante a geração**, o modelo tenta seguir as regras
3. Se gerar algo inválido, **auto-corrige** antes de retornar
4. Output já vem "quase validado" (segue estrutura)

**Limitações:**
- Não é 100% garantido
- Modelos podem ocasionalmente gerar valores fora de bounds
- Pode ter bugs no parsing interno

#### Nível 2: Validação EXPLÍCITA com Zod (após receber)

```typescript
const parsed = JSON.parse(response.text || '{}');
return TriageOutputSchema.parse(parsed);  // ← Validação AQUI
```

**O que acontece:**

1. **`JSON.parse()`:** Converte string → objeto JavaScript
   - Pode falhar se JSON malformado

2. **`TriageOutputSchema.parse(parsed)`:** 
   - ✅ Verifica que TODOS os campos obrigatórios existem
   - ✅ Valida tipos (string, number, boolean)
   - ✅ Verifica enums (valores permitidos)
   - ✅ Valida min/max (caracteres, array length, números)
   - ✅ Valida objetos aninhados
   - ❌ **Se falhar:** Lança `ZodError` detalhado

**Exemplo de Falha Detectada:**

```typescript
// Gemini retornou (hipotético):
{
  "priority": "SUPER_HIGH",  // ❌ Não está no enum
  "draft_comment": "Hi",     // ❌ Menos de 20 chars
  "confidence": 1.5,         // ❌ Maior que 1
  // "labels" em falta        // ❌ Campo obrigatório
}

// Zod detecta e lança ZodError:
// - priority: Expected 'P0'|'P1'|'P2'|'P3', received 'SUPER_HIGH'
// - draft_comment: String must contain at least 20 characters
// - confidence: Number must be less than or equal to 1
// - labels: Required
```

**Resumo da Validação em Dois Níveis:**

| Momento | Onde | Tipo | Propósito |
|---------|------|------|-----------|
| **1º** | Gemini API | Soft (guia geração) | Estrutura inicial do JSON (~95% correto) |
| **2º** | `TriageOutputSchema.parse()` | **Rígida (bloqueia erros)** | **Garantia final 100%** |

**Analogia:** É como **dupla verificação de segurança** em sistemas críticos:
- 1º filtro: Gemini tenta gerar correto
- 2º filtro: Zod garante que está correto antes de usar

---

## 🔄 Fluxo de Execução Completo

```
┌─────────────────────────────────────────────┐
│ 1. Utilizador executa:                      │
│    npm run triage data/tickets/TCK-001.json │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 2. cli.ts                                   │
│    • Lê ficheiro JSON do ticket             │
│    • Converte string → objeto JavaScript    │
│    • Chama triageTicket(ticket)             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 3. triage.ts (preparação)                   │
│    • Constrói prompt com regras             │
│    • Serializa ticket em JSON formatado     │
│    • Converte TriageOutputSchema → JSON     │
│    • Remove propriedades incompatíveis      │
│    • Mostra schema no console (debug)       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 4. Chamada API Gemini                       │
│    • Modelo: gemini-3-flash-preview         │
│    • Input: prompt + ticket data            │
│    • Config:                                │
│      - responseMimeType: "application/json" │
│      - responseJsonSchema: zodSchema        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 5. Gemini processa (IA)                     │
│    • Analisa conteúdo do ticket             │
│    • Aplica regras de priorização           │
│    • Identifica componente afetado          │
│    • Determina equipa apropriada            │
│    • Gera perguntas sobre info em falta     │
│    • Cria comentário rascunho polido        │
│    • Decide se deve escalar                 │
│    • Calcula nível de confiança             │
│    • Gera JSON estruturado                  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 6. triage.ts (resposta)                     │
│    • Recebe response.text (string JSON)     │
│    • Faz JSON.parse() → objeto JS           │
│    • Valida com TriageOutputSchema.parse()  │
│    • Se válido: retorna TriageOutput        │
│    • Se inválido: lança ZodError            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 7. cli.ts (output final)                    │
│    • Mostra JSON completo formatado         │
│    • Mostra draft_comment isolado           │
└─────────────────────────────────────────────┘
```

---

## 📊 Schema e Validação - Referência Completa

### Estrutura do TriageOutput

```typescript
type TriageOutput = {
  // Identificação
  ticket_id: string;

  // Classificação
  ticket_type: "bug" | "question" | "task";
  priority: "P0" | "P1" | "P2" | "P3";
  component: "checkout" | "auth" | "navigation" | "ui" | 
             "performance" | "forms" | "payments" | "search" | "unknown";

  // Labels (máximo 12)
  labels: string[];

  // Roteamento
  routing: {
    team: "frontend-core" | "web-platform" | "growth" | "payments" | "unknown";
    reason: string; // mínimo 5 caracteres
  };

  // Informação em falta (máximo 8 perguntas)
  missing_info_questions: string[];

  // Comentário rascunho (mínimo 20 caracteres)
  draft_comment: string;

  // Escalação
  should_escalate: boolean;
  escalate_reason?: string; // opcional

  // Confiança (0.0 a 1.0)
  confidence: number;
};
```

### Regras de Validação Detalhadas

| Campo | Tipo | Validação | Descrição |
|-------|------|-----------|-----------|
| `ticket_id` | `string` | Obrigatório | Identificador único do ticket |
| `ticket_type` | `enum` | Obrigatório | bug, question ou task |
| `priority` | `enum` | Obrigatório | P0, P1, P2 ou P3 |
| `component` | `enum` | Obrigatório | Componente afetado (9 opções + unknown) |
| `labels` | `string[]` | `max(12)` | Array de labels em kebab-case |
| `routing.team` | `enum` | Obrigatório | Equipa destino (5 opções) |
| `routing.reason` | `string` | `min(5)` | Justificação do roteamento |
| `missing_info_questions` | `string[]` | `max(8)` | Perguntas sobre informação em falta |
| `draft_comment` | `string` | `min(20)` | Comentário rascunho para cliente |
| `should_escalate` | `boolean` | Obrigatório | Flag de escalação |
| `escalate_reason` | `string` | Opcional | Razão da escalação (se `should_escalate = true`) |
| `confidence` | `number` | `min(0), max(1)` | Nível de confiança da IA |

### Prioridades - Diretrizes

| Prioridade | Critérios | Exemplos |
|-----------|-----------|----------|
| **P0 (Crítico)** | • Sistema em baixo<br>• Pagamentos quebrados<br>• Perda de dados | "Checkout não funciona", "Site inacessível" |
| **P1 (Alto)** | • Funcionalidade principal afetada<br>• Afeta muitos utilizadores | "Login falha em Safari", "Carrinho não adiciona items" |
| **P2 (Médio)** | • Bugs menores de UI<br>• Afeta alguns utilizadores | "Botão desalinhado", "Tooltip cortado" |
| **P3 (Baixo)** | • Questões<br>• Melhorias<br>• Documentação | "Como configurar X?", "Sugestão de funcionalidade" |

### Componentes e Teams - Mapeamento

| Componente | Equipa Típica | Descrição |
|-----------|---------------|-----------|
| `checkout` | `payments` | Fluxo de compra, carrinho |
| `payments` | `payments` | Integração Stripe, processamento |
| `auth` | `frontend-core` | Login, registo, sessões |
| `navigation` | `frontend-core` | Menu, routing, breadcrumbs |
| `ui` | `frontend-core` | Componentes visuais gerais |
| `forms` | `frontend-core` | Inputs, validação, submissão |
| `performance` | `web-platform` | Velocidade, rendering, bundle size |
| `search` | `growth` | Pesquisa, filtros, resultados |
| `unknown` | `unknown` | Quando não é claro |

---

## 🚀 Setup e Utilização

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd ticket-agent

# Instalar dependências
npm install
```

### Configuração

1. **Criar ficheiro `.env`:**
```bash
GEMINI_API_KEY=your_api_key_here
```

2. **Obter API Key:**
   - Aceder a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Criar nova API key
   - Copiar para `.env`

### Build

```bash
npm run build
```

### Executar Triagem

```bash
# Modo produção (após build)
npm run triage data/tickets/TCK-001.json

# Modo desenvolvimento (sem build)
npm run dev data/tickets/TCK-001.json
```

### Listar Modelos Disponíveis

```bash
npx tsx src/list-models.ts
```

### Exemplo de Ticket (JSON)

```json
{
  "ticket_id": "TCK-001",
  "title": "Can't complete checkout on Safari",
  "description": "When I try to checkout, the payment button appears disabled. I've tried refreshing multiple times.",
  "reported_by": "customer-support",
  "environment": {
    "browser": "Safari 16.6",
    "os": "macOS Ventura",
    "device": "Desktop"
  },
  "severity_hint": "high",
  "attachments": ["screen-recording.mov"],
  "created_at": "2026-01-25T10:20:00Z"
}
```

### Exemplo de Output

```json
{
  "ticket_id": "TCK-001",
  "ticket_type": "bug",
  "priority": "P1",
  "component": "checkout",
  "labels": ["safari", "checkout", "payments", "needs-repro"],
  "routing": {
    "team": "payments",
    "reason": "Safari-specific checkout/payment issue requiring investigation"
  },
  "missing_info_questions": [
    "Can you open Safari DevTools (Develop menu) and share console errors?",
    "Does this happen on every checkout attempt or intermittently?",
    "Are you logged in when attempting checkout?",
    "Can you try in Safari's Private Browsing mode?"
  ],
  "draft_comment": "Thank you for reporting this issue. We understand checkout problems are frustrating.\n\n**What we know:**\n• Issue occurs in Safari 16.6 on macOS\n• Payment button appears disabled\n• Affects checkout completion\n\n**To help us investigate, could you provide:**\n• Browser console errors (Safari DevTools → Console tab)\n• Whether this happens every time or sometimes\n• If you're logged in during checkout\n• Test result in Safari Private Browsing mode\n\nThis will help us identify if it's a browser-specific bug or configuration issue. We'll prioritize this for our payments team.",
  "should_escalate": true,
  "escalate_reason": "P1 payment/checkout blocker affecting customer transactions",
  "confidence": 0.85
}
```

---

## 🛠️ Tecnologias e Dependências

### Core

- **TypeScript** (v5.9.3) - Linguagem principal
- **Node.js** (v18+) - Runtime
- **@google/genai** (v1.38.0) - SDK Google Gemini

### Validação

- **Zod** (v4.3.6) - Schema validation com suporte nativo a JSON Schema
- **zod-to-json-schema** (v3.25.1) - Conversão Zod → JSON Schema (backup)

### Utilities

- **dotenv** (v17.2.3) - Gestão de variáveis de ambiente
- **tsx** (v4.21.0) - Execução TypeScript em desenvolvimento

### Configuração TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  }
}
```

---

## 🎯 Melhores Práticas

### Estrutura de Prompts

✅ **DO:**
- Definir papel claro da IA ("You are a ticket triage assistant...")
- Fornecer contexto específico do produto
- Listar regras explícitas de priorização
- Incluir exemplos de formatos esperados
- Adicionar advertências anti-alucinação

❌ **DON'T:**
- Prompts vagos ou ambíguos
- Assumir conhecimento implícito do domínio
- Pedir múltiplas tarefas num único prompt
- Esquecer de validar a resposta

### Validação

✅ **DO:**
- Usar schema estruturado na API (`responseJsonSchema`)
- Validar resposta com Zod após receber
- Definir limites explícitos (min/max)
- Usar enums para valores fixos

❌ **DON'T:**
- Confiar cegamente na resposta da IA
- Usar tipos genéricos (`any`, `unknown`) sem validação
- Ignorar erros de parsing

### Gestão de API Keys

✅ **DO:**
- Guardar keys em `.env` (nunca commitadas)
- Usar `dotenv` para carregar variáveis
- Validar presença da key no arranque

❌ **DON'T:**
- Hardcoded keys no código
- Commitar `.env` para o repositório
- Partilhar keys em logs/mensagens de erro

---

## 📈 Extensões Futuras

### Possíveis Melhorias

1. **Base de Dados:**
   - Persistir triagens para análise histórica
   - Cache de resultados similares
   - Métricas de performance do agente

2. **Integração Contínua:**
   - Webhook para receber tickets automaticamente
   - Integração com Jira/Linear/GitHub Issues
   - Atualização automática de status

3. **Regras Customizáveis:**
   - Ficheiro `rules.ts` com lógica de negócio
   - Configuração por equipa/projeto
   - A/B testing de prompts

4. **Análise Avançada:**
   - Detecção de duplicados
   - Clustering de tickets similares
   - Análise de sentiment

5. **Multi-Modal:**
   - Análise de screenshots anexados
   - Extração de logs de vídeos
   - OCR de erro screens

---

## 🐛 Troubleshooting

### Erro: "GEMINI_API_KEY environment variable is required"

**Solução:**
```bash
# Verificar se .env existe
cat .env

# Criar/editar .env
echo "GEMINI_API_KEY=your_key_here" > .env
```

### Erro: ZodError ao validar resposta

**Possíveis causas:**
- Modelo gerou JSON inválido
- Schema incompatível com capabilities do modelo
- Prompt ambíguo levou a resposta inesperada

**Solução:**
1. Ver output do schema JSON gerado
2. Testar com modelo diferente (`gemini-1.5-pro`)
3. Simplificar schema ou prompt

### Erro: JSON parsing failed

**Solução:**
```typescript
// Adicionar fallback robusto
const text = response.text || '{}';
const cleaned = text.replace(/```json\n?|\n?```/g, '');
const parsed = JSON.parse(cleaned);
```

### Performance lenta

**Soluções:**
- Usar modelo mais rápido (`gemini-3-flash-preview` vs `gemini-1.5-pro`)
- Reduzir tamanho do prompt
- Implementar cache para tickets similares
- Usar batch processing para múltiplos tickets

---

## 📚 Referências

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Zod Documentation](https://zod.dev)
- [JSON Schema Specification](https://json-schema.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

## 📝 Notas de Versão

### v1.0.0 (Fevereiro 2026)

**Features:**
- ✅ Triagem automática com Google Gemini 3 Flash Preview
- ✅ Validação rigorosa com Zod v4
- ✅ Structured output com JSON Schema
- ✅ CLI simples e eficaz
- ✅ Debug output para troubleshooting

**Limitações Conhecidas:**
- Não persiste triagens (apenas output em console)
- Não integra automaticamente com sistemas de ticketing
- Regras hardcoded no prompt (não customizáveis via config)
- Sem suporte multi-idioma

**Próximos Passos:**
- Implementar persistência em base de dados
- Webhook para integração automática
- Ficheiro de configuração para regras customizáveis
- Suporte para análise de screenshots

---

**Última atualização:** Fevereiro 4, 2026  
**Versão:** 1.0.0  
**Licença:** MIT
