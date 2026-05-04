## Diagnóstico

No `src/components/portal/PortalDiario.tsx`, linha 60:

```tsx
useState(() => { loadRegistros(); });
```

Isso é um **bug**: foi usado `useState` no lugar de `useEffect`. Consequências:

1. O initializer do `useState` roda **durante a renderização**, não como efeito. Disparar uma chamada assíncrona que faz `setLoading(false)` durante a render pode gerar warnings/comportamento instável no React 18 (StrictMode dispara duas vezes).
2. Se `loadRegistros()` lançar erro (ex.: RLS bloqueia, paciente.id ainda não disponível, falha de rede), **não há try/catch** → `setLoading(false)` nunca é chamado → componente fica travado em `"Carregando..."` → usuário vê tela branca/em branco.
3. Não há dependência de `paciente?.id`. Se `paciente` chegar como `null` na primeira render, a query roda com `paciente_id=eq.undefined` e silenciosamente falha.

Os erros nas pacientes (não em todas) batem com esse padrão: depende de timing de carregamento da sessão/paciente e do retorno da query.

## Correções em `src/components/portal/PortalDiario.tsx`

1. Substituir `useState(() => { loadRegistros(); })` por um `useEffect` adequado, dependente de `paciente?.id`.
2. Envolver `loadRegistros` em try/catch/finally para garantir que `setLoading(false)` sempre seja executado, mesmo em erro.
3. Guardar contra `paciente?.id` ausente (early return + setLoading false).
4. Mostrar toast amigável caso a carga falhe (em vez de tela presa).
5. Garantir que `useEffect` que gera signed URLs também não quebre (já tem fallback ok, apenas adicionar try/catch defensivo).

## Resultado

- Diário abre normalmente para todas as pacientes.
- Em caso de erro de rede/RLS, a tela mostra estado vazio + toast em vez de ficar branca.
- Sem mudanças de schema/backend; somente correção no componente.
