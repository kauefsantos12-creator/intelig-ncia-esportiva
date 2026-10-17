# Meus Jogos — identidade e experiência móvel

Rebranding de 16/10/2026. Nome: **Meus Jogos**. Assinatura: **Seu caderno de futebol**. Conceito: a leitura pessoal de cada partida, com aparência de caderno, sem navegação entre produtos.

- Verde de tinta `#203c30`, papel `#f4f1e9` e marcador `#d08b58`.
- Marca própria em `public/brand/meus-jogos.svg`: campo em um caderno com marcador. Georgia nos títulos editoriais e IBM Plex Sans/Mono para formulário e informações.
- PNGs 192/512, apple-touch-icon 180, favicon 32 em `public/brand/`; `public/favicon.ico` atualizado. O gerador `scripts/generate-my-games-brand.py` reproduz a geometria com Pillow; não é dependência da aplicação.
- Manifesto mantém id, scope, start_url e orientação livre. Metadados, login e notificações usam o novo nome/ícones. Identificadores técnicos do repositório e dos serviços permanecem iguais.

A página adapta partida/escalação para uma coluna no celular, mantém alvos de pelo menos 44 px, safe areas e nenhuma navegação fixa inferior sobre o editor. Conta, privacidade e arquivo abrem na mesma página e preservam seu estado ao recolher. O aviso público antes do login continua disponível.

O atalho instalado pode manter nome/ícone antigo em cache até ser atualizado pelo navegador ou adicionado novamente. A mudança de código/manifesto não comprova atualização de um atalho já instalado nem publicação.

Google/Lovable Cloud, allowlist, sessão e validação no servidor foram preservados. Ver [escopo e validação](governance/MEUS_JOGOS_REBRAND_2026-10-16.md).
