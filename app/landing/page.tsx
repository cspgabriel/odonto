'use client';

import { useState } from 'react';
import {
  ChevronRight,
  Check,
  Shield,
  Users,
  BarChart3,
  Lock,
  Globe,
  Calendar,
  FileText,
  CreditCard,
  Bell,
  Stethoscope,
  Activity,
  Database,
  Zap,
  Star,
  ArrowRight,
  Building2,
  Heart,
  Eye,
  Sparkles,
  Clock,
  TrendingUp,
  Award,
  Briefcase,
  X,
} from 'lucide-react';

const TIPOS_CLINICA = [
  {
    id: 'dental',
    nome: 'Clínica Odontológica',
    icon: <Heart className="w-8 h-8" />,
    emoji: '🦷',
    descricao: 'Sistema completo para consultórios e clínicas odontológicas com odontograma interativo',
    cor: 'from-cyan-500 to-blue-600',
    corBg: 'bg-cyan-500',
    diferenciais: [
      'Odontograma interativo de 32 dentes',
      'Histórico clínico odontológico completo',
      'Gestão de tratamentos por sessão',
      'Plano de tratamento com aprovação',
      'Anexos de raio-x e fotos',
    ],
  },
  {
    id: 'general',
    nome: 'Clínica Médica Geral',
    icon: <Stethoscope className="w-8 h-8" />,
    emoji: '⚕️',
    descricao: 'Solução completa para clínicas multi-especialidades e consultórios médicos',
    cor: 'from-emerald-500 to-teal-600',
    corBg: 'bg-emerald-500',
    diferenciais: [
      'Multi-departamentos e especialidades',
      'Prontuário eletrônico completo',
      'Prescrições com base de medicamentos',
      'Integração com laboratórios',
      'Análise de exames e diagnósticos',
    ],
  },
  {
    id: 'ophthalmology',
    nome: 'Clínica Oftalmológica',
    icon: <Eye className="w-8 h-8" />,
    emoji: '👁️',
    descricao: 'Plataforma especializada para clínicas oftalmológicas e centros de visão',
    cor: 'from-violet-500 to-purple-600',
    corBg: 'bg-violet-500',
    diferenciais: [
      'Registro de exames de visão',
      'Gestão de prescrições ópticas',
      'Histórico oftalmológico detalhado',
      'Acompanhamento de acuidade visual',
      'Receituário de lentes e óculos',
    ],
  },
];

const MODULOS = [
  { icon: <Users className="w-6 h-6" />, titulo: 'Gestão de Pacientes', desc: 'Cadastro completo, histórico, alergias, contatos de emergência e documentos' },
  { icon: <Calendar className="w-6 h-6" />, titulo: 'Agendamentos', desc: 'Calendário inteligente com detecção de conflitos e lembretes automáticos' },
  { icon: <FileText className="w-6 h-6" />, titulo: 'Prontuário Eletrônico', desc: 'Sinais vitais, notas clínicas, diagnósticos CID e linha do tempo' },
  { icon: <CreditCard className="w-6 h-6" />, titulo: 'Faturamento Completo', desc: 'Notas fiscais, recebimentos, despesas e relatórios financeiros' },
  { icon: <Bell className="w-6 h-6" />, titulo: 'Notificações em Tempo Real', desc: 'Alertas instantâneos para agendamentos, baixo estoque e aprovações' },
  { icon: <Shield className="w-6 h-6" />, titulo: 'Controle de Permissões', desc: 'Permissões granulares por função, configuráveis sem programação' },
  { icon: <Activity className="w-6 h-6" />, titulo: 'Análise Financeira', desc: 'Gráficos de receita vs despesas e indicadores em tempo real' },
  { icon: <Database className="w-6 h-6" />, titulo: 'Estoque & Insumos', desc: 'Controle de estoque, validade, lotes e alertas de reposição' },
  { icon: <Briefcase className="w-6 h-6" />, titulo: 'Gestão de Equipe', desc: 'Funcionários, papéis, salários e fluxo de aprovação de cadastros' },
];

const PAPEIS = [
  {
    nome: 'Administrador',
    icon: '👔',
    cor: 'from-blue-500 to-indigo-600',
    desc: 'Controle total da clínica',
    permissoes: ['Acesso completo a todos os módulos', 'Gerencia equipe e aprovações', 'Configura permissões por função', 'Visualiza análise financeira completa', 'Recebe todas as notificações'],
  },
  {
    nome: 'Médico/Dentista',
    icon: '🩺',
    cor: 'from-emerald-500 to-teal-600',
    desc: 'Foco em atendimento clínico',
    permissoes: ['Agenda pessoal de consultas', 'Acessa prontuários completos', 'Cria prescrições e diagnósticos', 'Solicita exames laboratoriais', 'Gerencia odontograma (odonto)'],
  },
  {
    nome: 'Recepcionista',
    icon: '💼',
    cor: 'from-orange-500 to-red-600',
    desc: 'Comando da recepção',
    permissoes: ['Agendamento e remarcação', 'Cadastro de pacientes', 'Emissão de notas fiscais', 'Recebimento de pagamentos', 'Gestão da fila de cobrança'],
  },
  {
    nome: 'Enfermeiro(a)',
    icon: '👩‍⚕️',
    cor: 'from-pink-500 to-rose-600',
    desc: 'Suporte clínico',
    permissoes: ['Acesso a prontuários', 'Registro de sinais vitais', 'Suporte ao agendamento', 'Monitoramento de estoque', 'Visualização de exames'],
  },
];

const COMPARACAO = [
  { recurso: 'Sistema próprio (sem mensalidade vitalícia)', carenova: true, concorrentes: false },
  { recurso: 'Código-fonte completo incluído', carenova: true, concorrentes: false },
  { recurso: 'Hospedagem na sua infraestrutura', carenova: true, concorrentes: false },
  { recurso: 'Múltiplos tipos de clínica em um sistema', carenova: true, concorrentes: false },
  { recurso: 'Odontograma interativo nativo', carenova: true, concorrentes: false },
  { recurso: 'Permissões granulares configuráveis', carenova: true, concorrentes: 'limitado' },
  { recurso: 'Site público integrado para captação', carenova: true, concorrentes: false },
  { recurso: 'Personalização total de marca', carenova: true, concorrentes: 'limitado' },
  { recurso: 'Suporte técnico especializado', carenova: true, concorrentes: true },
  { recurso: 'Atualizações sem cobrança recorrente', carenova: true, concorrentes: false },
];

const DEPOIMENTOS = [
  {
    nome: 'Dr. Ricardo Almeida',
    cargo: 'Cirurgião Dentista',
    clinica: 'Clínica Sorriso Perfeito',
    texto: 'Em 3 meses recuperamos o investimento. O odontograma interativo e o controle financeiro mudaram completamente a gestão da clínica.',
    nota: 5,
  },
  {
    nome: 'Dra. Patricia Mendes',
    cargo: 'Médica Oftalmologista',
    clinica: 'Centro de Visão Mendes',
    texto: 'Finalmente um sistema feito para clínicas oftalmológicas. As prescrições ópticas e o histórico de acuidade visual são perfeitos.',
    nota: 5,
  },
  {
    nome: 'Dr. Marcelo Costa',
    cargo: 'Diretor Clínico',
    clinica: 'Centro Médico Costa & Associados',
    texto: 'Gerenciar 12 médicos de especialidades diferentes ficou simples. Cada um tem seu acesso, seus pacientes, sua agenda.',
    nota: 5,
  },
];

const FAQ = [
  {
    pergunta: 'Preciso pagar mensalidade?',
    resposta: 'Não. Você compra uma única vez e o sistema é seu. Você só paga pela hospedagem (Supabase + Vercel — em torno de R$ 0 a R$ 100/mês conforme volume).',
  },
  {
    pergunta: 'Eu mesmo consigo instalar?',
    resposta: 'O sistema vem com guia de instalação completo passo a passo. Para quem não tem conhecimento técnico, oferecemos serviço de instalação e configuração.',
  },
  {
    pergunta: 'Posso personalizar com a marca da minha clínica?',
    resposta: 'Sim. Cores, logo, nome, conteúdo, fotos — tudo é personalizável pelo painel administrativo, sem precisar mexer em código.',
  },
  {
    pergunta: 'Funciona para mais de uma clínica?',
    resposta: 'Sim. A arquitetura é multi-tenant pronta. Para múltiplas filiais, oferecemos serviço de adaptação personalizada.',
  },
  {
    pergunta: 'Quais especialidades atende?',
    resposta: 'Odontologia, Oftalmologia e Clínica Médica Geral nativamente. Para outras especialidades (cardiologia, pediatria, fisioterapia, etc.), customizamos.',
  },
  {
    pergunta: 'Os dados dos pacientes ficam seguros?',
    resposta: 'Sim. Banco PostgreSQL criptografado, autenticação com sessões seguras, logs de auditoria, controle de tentativas de login. Pronto para LGPD.',
  },
];

export default function LandingPage() {
  const [tipoSelecionado, setTipoSelecionado] = useState('dental');
  const [faqAberto, setFaqAberto] = useState<number | null>(0);
  const tipoAtual = TIPOS_CLINICA.find((t) => t.id === tipoSelecionado)!;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white text-sm py-2 px-4 text-center">
        <span className="font-medium">🎉 Oferta de lançamento — economize 40% na primeira aquisição</span>
      </div>

      {/* Navegação */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AgenciAR Med
            </span>
          </div>
          <div className="hidden lg:flex gap-8 items-center">
            <a href="#tipos" className="text-slate-600 hover:text-slate-900 transition font-medium">Para Quem</a>
            <a href="#modulos" className="text-slate-600 hover:text-slate-900 transition font-medium">Funcionalidades</a>
            <a href="#demos" className="text-slate-600 hover:text-slate-900 transition font-medium">Demonstrações</a>
            <a href="#precos" className="text-slate-600 hover:text-slate-900 transition font-medium">Preços</a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900 transition font-medium">FAQ</a>
          </div>
          <a
            href="#precos"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-blue-500/30"
          >
            Quero Conhecer
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Sistema completo de gestão para clínicas
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
              Sua clínica gerenciada{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                como nunca
              </span>
              {' '}antes
            </h1>

            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Pare de pagar mensalidades caras. O AgenciAR Med é o sistema completo de gestão clínica que você compra uma vez e usa para sempre.
              Pacientes, agendamentos, prontuários, faturamento e site próprio — tudo em uma plataforma profissional.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href="#demos"
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-2"
              >
                Ver Demonstração ao Vivo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </a>
              <a
                href="#precos"
                className="bg-white border-2 border-slate-200 hover:border-slate-300 px-8 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
              >
                Ver Preços
              </a>
            </div>

            {/* Indicadores de confiança */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-slate-900">15+</div>
                <div className="text-sm text-slate-600">Módulos completos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">3</div>
                <div className="text-sm text-slate-600">Especialidades</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">4</div>
                <div className="text-sm text-slate-600">Painéis por função</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">100%</div>
                <div className="text-sm text-slate-600">Código próprio</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dor / Solução */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Cansado de sistemas que <span className="text-red-500">cobram mensalidade</span> e nunca atendem?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Você é médico ou dentista — não administrador de TI. O AgenciAR Med foi feito para resolver isso.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-red-900">Sistemas tradicionais</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Mensalidades de R$ 300 a R$ 2.000 — para sempre',
                  'Seus dados ficam na nuvem do fornecedor',
                  'Personalização limitada ou inexistente',
                  'Sem site público integrado para captar pacientes',
                  'Recursos travados em planos mais caros',
                  'Aumento de preço sem aviso prévio',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-900">Com o AgenciAR Med</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Investimento único — sem mensalidades obrigatórias',
                  'Dados na sua infraestrutura, sob seu controle',
                  'Personalização total: cores, marca, conteúdo',
                  'Site profissional incluído para captar pacientes',
                  'Todos os módulos liberados desde o dia 1',
                  'Atualizações regulares sem custo recorrente',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de Clínica */}
      <section id="tipos" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Building2 className="w-4 h-4" />
              Para o seu tipo de clínica
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">3 sistemas em 1</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Cada especialidade tem seu próprio sistema, com módulos e site adaptados ao seu fluxo de trabalho real
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {TIPOS_CLINICA.map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => setTipoSelecionado(tipo.id)}
                className={`text-left p-8 rounded-2xl transition-all transform hover:scale-105 ${
                  tipoSelecionado === tipo.id
                    ? `bg-gradient-to-br ${tipo.cor} text-white shadow-2xl`
                    : 'bg-white hover:shadow-xl border-2 border-slate-100'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${tipoSelecionado === tipo.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {tipo.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{tipo.nome}</h3>
                <p className={tipoSelecionado === tipo.id ? 'text-white/90' : 'text-slate-600'}>
                  {tipo.descricao}
                </p>
                <div className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${tipoSelecionado === tipo.id ? 'text-white' : 'text-blue-600'}`}>
                  Ver detalhes <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          {/* Detalhes do tipo selecionado */}
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-slate-100">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${tipoAtual.cor} text-white px-4 py-2 rounded-full text-sm font-semibold mb-4`}>
                  {tipoAtual.emoji} {tipoAtual.nome}
                </div>
                <h3 className="text-3xl font-bold mb-6">Recursos exclusivos</h3>
                <ul className="space-y-4">
                  {tipoAtual.diferenciais.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tipoAtual.cor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-slate-700 text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-100 rounded-2xl p-4 shadow-inner">
                <div className="bg-slate-800 rounded-lg px-4 py-2 flex items-center gap-2 mb-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-slate-700 rounded px-3 py-1 text-xs text-slate-300 ml-2">
                    suaclinica.com.br
                  </div>
                </div>
                <div className="bg-white rounded-lg overflow-hidden h-96">
                  <iframe
                    src={`/?clinic=${tipoSelecionado}`}
                    className="w-full h-full border-0"
                    title={`Demo ${tipoAtual.nome}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="py-24 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              Tudo que sua clínica precisa
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">15+ módulos prontos para usar</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Do agendamento à emissão da nota fiscal — todos os processos da sua clínica em um só lugar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULOS.map((mod, i) => (
              <div
                key={i}
                className="group p-8 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                  {mod.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{mod.titulo}</h3>
                <p className="text-slate-600">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Painéis por função */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              Cada equipe tem seu painel
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">4 painéis personalizados por função</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Cada membro da equipe acessa apenas o que precisa — controle total nas mãos do administrador
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PAPEIS.map((papel, i) => (
              <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${papel.cor} flex items-center justify-center text-3xl mb-4`}>
                  {papel.icon}
                </div>
                <h3 className="text-2xl font-bold mb-1">{papel.nome}</h3>
                <p className="text-slate-400 text-sm mb-4">{papel.desc}</p>
                <ul className="space-y-2">
                  {papel.permissoes.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demos ao vivo */}
      <section id="demos" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Activity className="w-4 h-4" />
              Demonstrações ao vivo
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Veja em ação agora</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Clique em qualquer demonstração e explore o sistema completo. Sem cadastro, sem instalação.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIPOS_CLINICA.map((tipo) => (
              <a
                key={tipo.id}
                href={`/?clinic=${tipo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className={`h-48 bg-gradient-to-br ${tipo.cor} flex items-center justify-center text-7xl`}>
                  {tipo.emoji}
                </div>
                <div className="p-6">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Site Público</div>
                  <h3 className="text-xl font-bold mb-2">{tipo.nome}</h3>
                  <p className="text-slate-600 text-sm mb-4">{tipo.descricao}</p>
                  <div className="flex items-center gap-2 text-blue-600 font-semibold">
                    Acessar demonstração
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </a>
            ))}

            {/* Card Painel Admin */}
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 ring-2 ring-slate-900"
            >
              <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-7xl relative">
                <BarChart3 className="w-20 h-20 text-white" />
                <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  COMPLETO
                </div>
              </div>
              <div className="p-6">
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Painel Administrativo</div>
                <h3 className="text-xl font-bold mb-2">Dashboard Admin</h3>
                <p className="text-slate-600 text-sm mb-4">Acesse o sistema completo com dados de demonstração — gestão, financeiro, equipe</p>
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  Acessar painel admin
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </a>
          </div>

          <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
            <p className="text-slate-700">
              <strong>💡 Dica:</strong> Os 3 primeiros cards mostram o site público que seus pacientes verão. O último card abre o painel administrativo onde sua equipe trabalha.
            </p>
          </div>
        </div>
      </section>

      {/* Comparação */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Por que escolher o AgenciAR Med?</h2>
            <p className="text-xl text-slate-600">Comparativo direto com sistemas tradicionais de gestão</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
              <div className="p-6 font-bold text-slate-900">Recurso</div>
              <div className="p-6 text-center font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white">AgenciAR Med</div>
              <div className="p-6 text-center font-bold text-slate-700">Sistemas tradicionais</div>
            </div>
            {COMPARACAO.map((item, i) => (
              <div key={i} className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100 last:border-0`}>
                <div className="p-5 text-slate-700 font-medium">{item.recurso}</div>
                <div className="p-5 text-center">
                  {item.carenova === true ? (
                    <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                  ) : (
                    <X className="w-6 h-6 text-red-400 mx-auto" />
                  )}
                </div>
                <div className="p-5 text-center">
                  {item.concorrentes === true ? (
                    <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                  ) : item.concorrentes === 'limitado' ? (
                    <span className="text-orange-500 font-medium text-sm">Limitado</span>
                  ) : (
                    <X className="w-6 h-6 text-red-400 mx-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Star className="w-4 h-4 fill-yellow-500" />
              Profissionais que confiam
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">O que dizem os profissionais</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {DEPOIMENTOS.map((dep, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: dep.nota }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic leading-relaxed">"{dep.texto}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {dep.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{dep.nome}</div>
                    <div className="text-sm text-slate-600">{dep.cargo}</div>
                    <div className="text-xs text-slate-500">{dep.clinica}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-24 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <TrendingUp className="w-4 h-4" />
              Investimento único
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Investimento que se paga em meses</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Sem mensalidades. Você compra uma vez e usa para sempre.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Plano Essencial */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 hover:shadow-xl transition">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Essencial</h3>
                <p className="text-slate-600 text-sm">Para clínicas começando</p>
              </div>
              <div className="mb-6">
                <div className="text-sm text-slate-500 line-through">De R$ 4.997</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">R$ 2.997</span>
                </div>
                <div className="text-sm text-slate-600 mt-1">Pagamento único</div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Sistema completo (todos os módulos)',
                  'Escolha 1 tipo de clínica',
                  'Site público integrado',
                  'Suporte por e-mail (90 dias)',
                  'Atualizações por 1 ano',
                  'Documentação completa',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:dev010contact@gmail.com?subject=Plano Essencial AgenciAR Med"
                className="block text-center bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition"
              >
                Quero o Essencial
              </a>
            </div>

            {/* Plano Profissional */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-8 transform scale-105 shadow-2xl shadow-blue-500/30 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
                MAIS ESCOLHIDO
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Profissional</h3>
                <p className="text-blue-100 text-sm">Tudo incluído + instalação</p>
              </div>
              <div className="mb-6">
                <div className="text-sm text-blue-200 line-through">De R$ 7.997</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">R$ 4.997</span>
                </div>
                <div className="text-sm text-blue-100 mt-1">Pagamento único</div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Tudo do plano Essencial',
                  'Os 3 tipos de clínica disponíveis',
                  'Instalação e configuração inclusa',
                  'Personalização visual com sua marca',
                  'Suporte prioritário (180 dias)',
                  'Atualizações por 2 anos',
                  '2h de treinamento da equipe',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:dev010contact@gmail.com?subject=Plano Profissional AgenciAR Med"
                className="block text-center bg-white text-blue-700 hover:bg-blue-50 py-3 rounded-xl font-bold transition"
              >
                Quero o Profissional
              </a>
            </div>

            {/* Plano Enterprise */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 hover:shadow-xl transition">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-slate-600 text-sm">Customização completa</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">Sob consulta</span>
                </div>
                <div className="text-sm text-slate-600 mt-1">A partir de R$ 9.997</div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Tudo do plano Profissional',
                  'Customizações sob medida',
                  'Módulos exclusivos para sua clínica',
                  'Integrações (laboratórios, convênios)',
                  'Multi-unidades / multi-filiais',
                  'Suporte dedicado (1 ano)',
                  'Atualizações vitalícias',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:dev010contact@gmail.com?subject=Plano Enterprise AgenciAR Med"
                className="block text-center bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition"
              >
                Falar com especialista
              </a>
            </div>
          </div>

          <div className="mt-12 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 text-center">
            <Award className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Garantia de 30 dias</h3>
            <p className="text-slate-700 max-w-2xl mx-auto">
              Se em 30 dias o sistema não atender suas expectativas, devolvemos 100% do seu investimento. Sem perguntas.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Perguntas frequentes</h2>
            <p className="text-xl text-slate-600">Tire suas dúvidas antes de decidir</p>
          </div>

          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition"
                >
                  <span className="font-bold text-lg pr-8">{item.pergunta}</span>
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform ${faqAberto === i ? 'rotate-90' : ''}`} />
                </button>
                {faqAberto === i && (
                  <div className="px-6 pb-6 text-slate-700 leading-relaxed">
                    {item.resposta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22%3E%3Cpath fill=%22%23ffffff%22 fill-opacity=%220.05%22 d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/svg%3E')]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <Clock className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Pronto para transformar sua clínica?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Pare de perder dinheiro com mensalidades caras. Tenha o sistema completo da sua clínica hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#precos"
              className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-lg transition shadow-2xl flex items-center justify-center gap-2"
            >
              Ver Planos e Preços <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="mailto:dev010contact@gmail.com?subject=Quero falar com especialista AgenciAR Med"
              className="border-2 border-white/30 hover:bg-white/10 px-8 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
            >
              Falar com Especialista
            </a>
          </div>
          <p className="text-blue-200 mt-6 text-sm">
            ⚡ Resposta em até 24h | 🛡️ Garantia de 30 dias | 💳 Pagamento único
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  C
                </div>
                <span className="text-2xl font-bold text-white">AgenciAR Med</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Sistema completo de gestão para clínicas médicas, odontológicas e oftalmológicas.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#tipos" className="hover:text-white transition">Tipos de Clínica</a></li>
                <li><a href="#modulos" className="hover:text-white transition">Funcionalidades</a></li>
                <li><a href="#demos" className="hover:text-white transition">Demonstrações</a></li>
                <li><a href="#precos" className="hover:text-white transition">Preços</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="hover:text-white transition">Perguntas Frequentes</a></li>
                <li><a href="mailto:dev010contact@gmail.com" className="hover:text-white transition">Contato</a></li>
                <li><a href="#" className="hover:text-white transition">Documentação</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm">
                <li>📧 dev010contact@gmail.com</li>
                <li>⏱️ Resposta em até 24h</li>
                <li>🛡️ Garantia de 30 dias</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            <p>&copy; 2026 AgenciAR Med. Todos os direitos reservados. | Sistema de gestão clínica completo.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
