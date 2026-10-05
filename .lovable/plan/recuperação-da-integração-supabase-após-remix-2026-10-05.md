# Recuperação da integração Supabase após remix

## Diagnóstico (confirmado por consulta somente leitura)

O ambiente Lovable Cloud deste projeto é:

- URL: `https://hefuvmocohhpmnhwpkac.supabase.co`
- Publishable key: `sb_publishable_FhfFFZm2AVHquHeXB0z1kA_qAo3rCZf`

Porém `src/integrations/supabase/client.ts` ainda contém como fallback hardcoded os valores do projeto anterior ao remix (`vsygkpwptoppbrlnrpcp`). Quando as variáveis `VITE_SUPABASE_*` não são injetadas no build publicado, o app cai no fallback e aponta para o backend errado.

## Correção (via PR no GitHub, sem tocar em secrets)

1. **Atualizar o fallback público em `src/integrations/supabase/client.ts`**:
   - `PUBLIC_SUPABASE_URL` → `https://hefuvmocohhpmnhwpkac.supabase.co`
   - `PUBLIC_SUPABASE_PUBLISHABLE_KEY` → `sb_publishable_FhfFFZm2AVHquHeXB0z1kA_qAo3rCZf`
   - (São identificadores públicos por design; seguro commitar. O arquivo é auto-gerado, então a correção ideal é re-gerar via integração Lovable Cloud ou aplicar o PR e não editar manualmente de novo.)

2. **Atualizar `.env.example`** com os mesmos valores públicos como referência de configuração (placeholders já existem; apenas alinhar comentários se necessário — opcional).

3. **Verificar `src/integrations/supabase/database.types.ts`**: confirmar que os tipos correspondem ao schema do novo projeto `hefuvmocohhpmnhwpkac` (o remix pode ter copiado tipos do projeto antigo). Se divergirem, re-gerar os tipos.

4. **Validação pós-merge**:
   - Preview carrega sem erros de auth/rede;
   - Login Google funciona no preview;
   - Uma leitura pública (ex.: resenha do dia) retorna dados do banco novo.

## Fora de escopo

- Nenhuma alteração em secrets, service_role, chaves 5Dollar/API-Football ou JWT.
- Nenhuma migration ou mudança de banco neste PR.
- Nenhuma publicação — apenas PR + validação em preview.
