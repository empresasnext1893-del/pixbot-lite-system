import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, TrendingUp, Calendar, CheckCircle, AlertTriangle, DollarSign, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import WalletLayout from "@/components/WalletLayout";
import FallingMoney from "@/components/FallingMoney";

export default function About() {
  const [, navigate] = useLocation();

  return (
    <>
      <FallingMoney />
      <WalletLayout title="Sobre a Plataforma" showBack onBack={() => navigate("/")}>
        <div className="px-4 pt-4 pb-20 space-y-6">
          {/* Card: Segurança e Agilidade */}
          <div className="wallet-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white">Segurança Total</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--wallet-text-secondary)" }}>
              Nossa plataforma foi desenvolvida com foco em <strong>blindagem transacional total</strong>. Utilizamos tecnologia de ponta para garantir que todas as operações sejam definitivas, seguras e irreversíveis — protegendo você e seu negócio em cada transação.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-white block mb-1">Zero Contestação</span>
                  <span style={{ color: "var(--wallet-text-secondary)" }} className="text-xs leading-relaxed">Todas as transações realizadas em nossa plataforma são <strong className="text-white">definitivas e irrevogáveis</strong>. Nosso sistema é completamente imune a estornos, chargebacks e contestações indevidas — garantindo que o valor recebido permaneça em sua carteira sem qualquer risco de reversão.</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-white block mb-1">Zero MED (Mecanismo Especial de Devolução)</span>
                  <span style={{ color: "var(--wallet-text-secondary)" }} className="text-xs leading-relaxed">Nossa infraestrutura oferece <strong className="text-white">proteção avançada contra bloqueios e devoluções automáticas</strong> do Banco Central. O MED não se aplica às operações realizadas aqui, eliminando o risco de devolução compulsória de valores e garantindo total controle sobre seus recursos.</span>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-white block mb-1">Liquidez Imediata</span>
                  <span style={{ color: "var(--wallet-text-secondary)" }} className="text-xs leading-relaxed">Assim que um depósito é confirmado, o saldo fica <strong className="text-white">instantaneamente disponível</strong> para movimentação, saque ou reinvestimento. Sem períodos de carência, sem bloqueios operacionais — seu dinheiro disponível quando você precisar, 24 horas por dia, 7 dias por semana.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Card: Regras de Taxas */}
          <div className="wallet-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Taxas e Regras</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs uppercase font-bold mb-1" style={{ color: "var(--wallet-text-secondary)" }}>Taxa de Depósito</p>
                <p className="text-2xl font-black text-primary">20%</p>
                <p className="text-[10px] mt-1" style={{ color: "var(--wallet-text-secondary)" }}>Aplicada automaticamente sobre o valor bruto depositado.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs uppercase font-bold mb-1" style={{ color: "var(--wallet-text-secondary)" }}>Taxa de Saque</p>
                <p className="text-2xl font-black text-white">R$ 3,00</p>
                <p className="text-[10px] mt-1" style={{ color: "var(--wallet-text-secondary)" }}>Valor fixo cobrado por cada solicitação de retirada.</p>
              </div>
            </div>
          </div>

          {/* Card: Limites Diários */}
          <div className="wallet-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Limites Operacionais</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>Depósito Mínimo</span>
                <span className="font-bold text-white">R$ 10,00</span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>Saque Mínimo</span>
                <span className="font-bold text-white">R$ 10,00</span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>Limite por Operação</span>
                <span className="font-bold text-white">R$ 50.000,00</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-[10px] leading-relaxed" style={{ color: "var(--wallet-text-secondary)" }}>
                Os limites diários podem ser aumentados conforme o volume de transações e o tempo de conta do cliente. Entre em contato com o suporte técnico para solicitações de upgrade de limite.
              </p>
            </div>
          </div>

          {/* Card: Central de Ajuda/FAQ */}
          <div className="wallet-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Central de Ajuda</h3>
            </div>
            <FAQSection />
          </div>
        </div>
      </WalletLayout>
    </>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium text-white text-left">{question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 py-3 bg-white/5 border-t border-white/10">
          <p className="text-sm leading-relaxed" style={{ color: "var(--wallet-text-secondary)" }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "Como faço para depositar na minha carteira?",
      answer: "Acesse a aba 'Depositar', insira o valor desejado (mínimo R$ 10,00) e clique em 'Gerar QR Code'. Você receberá um código QR e a chave PIX para realizar o pagamento. Após confirmar o pagamento, o valor será creditado em sua carteira em até 30 minutos.",
    },
    {
      question: "Qual é a taxa de depósito?",
      answer: "A taxa de depósito é de 20% sobre o valor bruto depositado. Essa taxa é cobrada automaticamente e o valor líquido é creditado em sua carteira. Por exemplo, se você depositar R$ 100, receberá R$ 80 em sua carteira.",
    },
    {
      question: "Como faço para sacar meu dinheiro?",
      answer: "Acesse a aba 'Sacar', insira o valor desejado (mínimo R$ 10,00), informe sua chave PIX e clique em 'Solicitar Saque'. Sua solicitação será enviada para análise e aprovação. Após aprovação, o valor será transferido para sua conta em até 24 horas.",
    },
    {
      question: "Qual é a taxa de saque?",
      answer: "A taxa de saque é fixa em R$ 3,00 por solicitação. Essa taxa é descontada do valor total do saque. Por exemplo, se você solicitar um saque de R$ 100, receberá R$ 97 em sua conta.",
    },
    {
      question: "Qual é o limite por transação?",
      answer: "O limite padrão por transação é de R$ 50.000,00. Esse limite garante a segurança e a agilidade das operações. Entre em contato com nosso suporte técnico para mais informações sobre upgrade de limite.",
    },
    {
      question: "Como vinculo minha conta ao Telegram?",
      answer: "Acesse a aba 'Configurações', clique em 'Vincular Telegram' e siga as instruções. Você receberá notificações em tempo real sobre seus depósitos e saques diretamente no Telegram.",
    },
    {
      question: "Quanto tempo leva para meu depósito ser confirmado?",
      answer: "Após você realizar o pagamento PIX, o depósito é confirmado em até 30 minutos. Você receberá uma notificação quando o valor for creditado em sua carteira.",
    },
    {
      question: "Posso cancelar uma solicitação de saque?",
      answer: "Você pode cancelar uma solicitação de saque enquanto ela estiver com status 'Pendente'. Após ser aprovada, a solicitação não pode ser cancelada. Entre em contato com o suporte se precisar de ajuda.",
    },
    {
      question: "Minha conta foi desativada. O que fazer?",
      answer: "Se sua conta foi desativada, entre em contato com nosso suporte técnico para esclarecer a situação. Podemos reativar sua conta após análise.",
    },
    {
      question: "Como faço para entrar em contato com o suporte?",
      answer: "Você pode entrar em contato conosco através do Telegram (@pixbot_support) ou enviando um email para support@pixbot.com. Nosso time está disponível 24/7 para ajudar.",
    },
  ];

  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => (
        <FAQItem key={idx} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
}
