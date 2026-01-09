import React from 'react';

export const PrivacyPolicy: React.FC = () => (
  <div className="max-w-3xl mx-auto p-6 text-gray-300">
    <h2 className="text-3xl font-bold text-white mb-6">Política de Privacidade</h2>
    <div className="space-y-4 text-sm leading-relaxed">
      <p><strong>Última atualização: 24 de Maio de 2024</strong></p>
      
      <h3 className="text-xl font-semibold text-white mt-4">1. Introdução</h3>
      <p>Bem-vindo ao Random online. Sua privacidade é nossa prioridade. Esta política descreve como coletamos (minimamente), usamos e protegemos suas informações ao utilizar nossa plataforma de videochat peer-to-peer.</p>

      <h3 className="text-xl font-semibold text-white mt-4">2. Coleta de Dados</h3>
      <p>Para operar o serviço, coletamos apenas o estritamente necessário:</p>
      <ul className="list-disc pl-5">
        <li><strong>Dados de Conta:</strong> Email e Nome de Usuário (armazenados localmente ou em banco de dados simulado).</li>
        <li><strong>Dados Técnicos:</strong> Endereço IP (anonimizado) e Geolocalização aproximada (apenas País/Estado) para fins de conexão.</li>
        <li><strong>Conteúdo:</strong> NÃO gravamos, armazenamos ou monitoramos chamadas de vídeo ou áudio. A transmissão é Peer-to-Peer (P2P) direta entre usuários.</li>
      </ul>

      <h3 className="text-xl font-semibold text-white mt-4">3. Uso das Informações</h3>
      <p>Utilizamos os dados para: Conectar você a outros usuários aleatórios, prevenir abusos (bans por IP) e melhorar a estabilidade da conexão WebRTC.</p>

      <h3 className="text-xl font-semibold text-white mt-4">4. Segurança e Menores</h3>
      <p>Este serviço é estritamente proibido para menores de 18 anos. Implementamos verificações básicas, mas os pais devem monitorar o uso da internet por seus filhos. Recomendamos o uso de ferramentas de controle parental.</p>

      <h3 className="text-xl font-semibold text-white mt-4">5. Seus Direitos (LGPD/GDPR)</h3>
      <p>Você tem o direito de solicitar a exclusão de sua conta a qualquer momento enviando um email para support@randomonline.com.</p>
    </div>
  </div>
);

export const TermsOfUse: React.FC = () => (
  <div className="max-w-3xl mx-auto p-6 text-gray-300">
    <h2 className="text-3xl font-bold text-white mb-6">Termos de Uso</h2>
    <div className="space-y-4 text-sm leading-relaxed">
      <p><strong>Aceite obrigatório para uso da plataforma.</strong></p>

      <h3 className="text-xl font-semibold text-white mt-4">1. Regras de Conduta</h3>
      <p>Ao utilizar o Random online, você concorda em NÃO:</p>
      <ul className="list-disc pl-5">
        <li>Exibir nudez, atos sexuais ou conteúdo pornográfico.</li>
        <li>Praticar assédio, discurso de ódio, racismo ou bullying.</li>
        <li>Usar o serviço para publicidade (spam) ou atividades ilegais.</li>
        <li>Transmitir conteúdo violento ou perturbador.</li>
      </ul>
      <p className="text-red-400 font-bold mt-2">A violação destas regras resultará em banimento imediato e permanente.</p>

      <h3 className="text-xl font-semibold text-white mt-4">2. Isenção de Responsabilidade</h3>
      <p>O Random online é uma plataforma de conexão aleatória. Não temos controle sobre o comportamento dos usuários em tempo real. Você utiliza o serviço por sua conta e risco.</p>

      <h3 className="text-xl font-semibold text-white mt-4">3. Moderação</h3>
      <p>Utilizamos sistemas de denúncia comunitária. Usuários reportados repetidamente serão bloqueados automaticamente.</p>

      <h3 className="text-xl font-semibold text-white mt-4">4. Legislação</h3>
      <p>Estes termos são regidos pelas leis da República Federativa do Brasil.</p>
    </div>
  </div>
);