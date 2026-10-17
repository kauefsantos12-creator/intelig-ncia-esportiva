import { revealJournalSection } from "@/components/JournalSection";
import type { ReactNode } from "react";
function Section({
  title,
  children,
  nested,
}: {
  title: string;
  children: ReactNode;
  nested: boolean;
}) {
  const Heading = nested ? "h3" : "h2";
  return (
    <section className="border-t border-border pt-6">
      <Heading className="text-lg font-semibold tracking-tight text-foreground">{title}</Heading>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  );
}

export function PrivacyNotice({ embedded = false }: { embedded?: boolean }) {
  const Heading = embedded ? "h2" : "h1";
  return (
    <article className="mx-auto max-w-3xl space-y-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
      <header>
        <p className="label-eyebrow">Transparência</p>
        <Heading className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Aviso de Privacidade
        </Heading>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Versão de 16/09/2026. Este ambiente é privado e single-user. Enquanto permanecer assim, o
          próprio mantenedor é o controlador operacional e titular dos dados de conta. Antes de
          disponibilização a terceiros, este aviso e o canal externo de atendimento devem ser
          revistos.
        </p>
      </header>

      <Section nested={embedded} title="Quais dados são tratados">
        <p>
          <strong className="text-foreground">Conta Google:</strong> UUID, email e identificadores
          do provedor necessários para login e autorização. Nome, foto e avatar não são necessários
          para autorizar o usuário.
        </p>
        <p>
          <strong className="text-foreground">Sessão:</strong> identificadores e timestamps
          necessários para autenticação e segurança.
        </p>
        <p>
          <strong className="text-foreground">Notificações:</strong> endpoint Web Push, chaves
          técnicas da assinatura e user-agent apenas quando os avisos são ativados.
        </p>
        <p>
          <strong className="text-foreground">Uso pessoal:</strong> anotações de partidas assistidas
          e avaliações pessoais de jogadores quando essas funcionalidades forem utilizadas.
        </p>
      </Section>

      <Section nested={embedded} title="Para quais finalidades">
        <p>
          Os dados de identidade e sessão são usados para autenticar a única conta autorizada,
          aplicar ownership e impedir acesso indevido.
        </p>
        <p>
          Dados pessoais de uso servem somente às funcionalidades privadas de acompanhamento
          esportivo. Dados compartilhados de partidas, competições, estatísticas e Elo não são
          usados para identificar o titular.
        </p>
        <p>
          Erros podem gerar telemetria técnica sanitizada para diagnóstico, com remoção de
          identificadores e credenciais sensíveis antes do reporte.
        </p>
      </Section>

      <Section nested={embedded} title="Por quanto tempo ficam armazenados">
        <p>
          <strong className="text-foreground">Sessões:</strong> conforme a política técnica vigente
          de autenticação e segurança.
        </p>
        <p>
          <strong className="text-foreground">Web Push:</strong> até a desativação, invalidação pelo
          provedor ou exclusão da conta.
        </p>
        <p>
          <strong className="text-foreground">Anotações e avaliações pessoais:</strong> enquanto a
          conta estiver ativa ou até a exclusão solicitada pelo usuário.
        </p>
        <p>
          <strong className="text-foreground">Trilha de governança:</strong> segue a retenção
          controlada definida pelo sistema.
        </p>
      </Section>

      <Section nested={embedded} title="Com quem pode haver compartilhamento">
        <p>
          <strong className="text-foreground">Google:</strong> autenticação OAuth.
        </p>
        <p>
          <strong className="text-foreground">Lovable Cloud:</strong> autenticação, persistência e
          execução do backend.
        </p>
        <p>
          <strong className="text-foreground">Provedores Web Push:</strong> apenas quando uma
          assinatura correspondente estiver ativa.
        </p>
        <p>
          Provedores de dados esportivos recebem requisições sobre competições e partidas; a
          aplicação não envia intencionalmente email, UUID de conta ou credenciais de sessão a esses
          provedores.
        </p>
      </Section>

      <Section nested={embedded} title="Como exercer controle e excluir dados">
        <p>
          Na área <strong className="text-foreground">Conta e privacidade</strong>, o usuário pode
          desativar notificações e excluir a própria conta.
        </p>
        <p>
          A exclusão remove os dados pessoais de aplicação vinculados ao usuário, remove a
          identidade de autenticação e encerra as sessões. Registros de governança podem permanecer
          pelo prazo definido como evidência de segurança e accountability.
        </p>
      </Section>

      <Section nested={embedded} title="Segurança e minimização">
        <p>
          O acesso é restrito à conta Google aprovada. Dados pessoais são protegidos por ownership e
          RLS; filas operacionais e RPCs privilegiados permanecem inacessíveis ao navegador.
        </p>
      </Section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <a
          href={embedded ? "#conteudo-principal" : "/"}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Voltar ao início
        </a>
        <a
          href={embedded ? "#conta" : "/#conta"}
          onClick={() => revealJournalSection("conta")}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-input px-4 text-sm font-medium text-foreground"
        >
          Conta e privacidade
        </a>
      </div>
    </article>
  );
}
