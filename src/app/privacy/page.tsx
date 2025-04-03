export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Esta política de privacidade descreve como o MED1 (&ldquo;nós&rdquo;, &ldquo;nosso&rdquo; ou &ldquo;aplicativo&rdquo;) coleta, usa e protege suas informações pessoais.
          Ao usar nosso aplicativo, você concorda com a coleta e uso de informações de acordo com esta política.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium mb-2">2.1. Informações da Conta</h3>
            <p className="text-gray-500 dark:text-gray-400">
              - Nome e endereço de e-mail através do Google Sign-In<br />
              - Foto do perfil (se disponível através do Google)<br />
              - Dados de autenticação para manter sua sessão ativa
            </p>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">2.2. Dados de Hábitos</h3>
            <p className="text-gray-500 dark:text-gray-400">
              - Hábitos criados e registrados<br />
              - Histórico de conclusão de hábitos<br />
              - Metas e objetivos definidos
            </p>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">2.3. Dados de Saúde (WHOOP)</h3>
            <p className="text-gray-500 dark:text-gray-400">
              - Dados de recuperação<br />
              - Métricas de sono<br />
              - Dados de esforço físico<br />
              - Frequência cardíaca e variabilidade
            </p>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">2.4. Dados de Nutrição</h3>
            <p className="text-gray-500 dark:text-gray-400">
              - Imagens de alimentos enviadas para análise<br />
              - Informações nutricionais geradas pela IA<br />
              - Histórico de análises nutricionais
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Como Usamos suas Informações</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-500 dark:text-gray-400">
          <li>Para fornecer e manter nossos serviços</li>
          <li>Para personalizar sua experiência</li>
          <li>Para analisar e melhorar nossos serviços</li>
          <li>Para comunicar atualizações ou mudanças</li>
          <li>Para fornecer suporte ao usuário</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de Dados</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Compartilhamos dados com os seguintes serviços terceiros:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-500 dark:text-gray-400">
          <li>Google (autenticação)</li>
          <li>OpenAI (análise de imagens de alimentos)</li>
          <li>WHOOP (dados de saúde e atividade física)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Segurança</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Implementamos medidas de segurança para proteger suas informações, incluindo:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-500 dark:text-gray-400">
          <li>Criptografia de dados em trânsito e em repouso</li>
          <li>Acesso restrito a dados pessoais</li>
          <li>Monitoramento regular de segurança</li>
          <li>Backups seguros</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Você tem o direito de:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-500 dark:text-gray-400">
          <li>Acessar seus dados pessoais</li>
          <li>Corrigir dados imprecisos</li>
          <li>Solicitar a exclusão de seus dados</li>
          <li>Exportar seus dados</li>
          <li>Revogar consentimentos dados anteriormente</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Contato</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Para questões sobre esta política ou sobre seus dados pessoais, entre em contato através do e-mail: privacy@med1.app
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Atualizações da Política</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Esta política pode ser atualizada ocasionalmente. Notificaremos sobre mudanças significativas através do aplicativo ou por e-mail.
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </section>
    </div>
  );
} 