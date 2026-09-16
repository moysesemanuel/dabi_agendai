export const plans = [
  {
    name: "Prime One",
    summary: "Ideal para quem corta o cabelo mensalmente.",
    price: "R$ 89,90",
  },
  {
    name: "Cabelo Ilimitado",
    summary: "Para quem corta o cabelo quantas vezes quiser, sem contar visita.",
    price: "R$ 149,90",
  },
  {
    name: "Cabelo + Barba",
    summary: "Cabelo e barba alinhados no mesmo agendamento, todo mês.",
    price: "R$ 219,90",
  },
] as const;

export const services = [
  {
    name: "Cabelo",
    description: "Corte sob medida — do degradê ao social, com acabamento na tesoura.",
    price: "R$ 60",
    membership: "R$ 149,90 no clube",
    duration: "40 min",
    image: "/img/um-cliente-a-cortar-o-cabelo-num-barbeiro_1303-20861.avif",
  },
  {
    name: "Barba",
    description: "Barba com alinhamento, toalha quente e acabamento na navalha.",
    price: "R$ 45",
    membership: "R$ 129,90 no clube",
    duration: "30 min",
    image: "/img/homem-bonito-na-barbearia-barbeando-a-barba_1303-26258.avif",
  },
  {
    name: "Combo Executivo",
    description: "Cabelo e barba em uma única sessão para sair pronto para qualquer ocasião.",
    price: "R$ 90",
    membership: "R$ 219,90 no clube",
    duration: "70 min",
    image: "/img/a-barbearia-vip-inovou-ao-implementar-visagismo-e-ia-em-sua-franquia.webp",
  },
  {
    name: "Hidratação",
    description: "Tratamento rápido para recuperar brilho, textura e aparência saudável.",
    price: "R$ 35",
    membership: "15% off para assinantes",
    duration: "20 min",
    image: "/img/hidratacao-no-cabelo-2.jpg",
  },
] as const;

export const stats = [
  { value: "+1.200", label: "clientes atendidos" },
  { value: "4,9/5", label: "média de avaliações" },
  { value: "8 anos", label: "de operação consistente" },
  { value: "+3", label: "barbeiros especializados" },
] as const;

export const barbers = ["Rafael Costa", "Mateus Lima", "João Vitor"] as const;

export const availableTimes = ["09:00", "10:30", "13:00", "15:30", "18:00"] as const;

export const testimonials = [
  {
    name: "Carlos Mendes",
    quote:
      "Pontualidade, ambiente impecável e um padrão de corte difícil de encontrar. Atendimento muito acima da média.",
  },
  {
    name: "Eduardo Nogueira",
    quote:
      "O tipo de barbearia que você indica sem medo. Agendamento fácil e acabamento sempre consistente.",
  },
] as const;

export const showcaseImages = [
  {
    src: "/img/espaco-masculino-interior-de-barbearia-moderna-gerado-por-ia_866663-5580.avif",
    alt: "Recepção sofisticada da barbearia",
    title: "Ambiente organizado, atendimento no horário.",
    label: "Ambiente",
    variant: "tall",
  },
  {
    src: "/img/VISS-Babearia-Visagista.jpg",
    alt: "Profissional finalizando corte com precisão",
    title: "Precisão em cortes clássicos e modernos.",
    label: "Acabamento",
    variant: "wide",
  },
  {
    src: "/img/Design_sem_nome_-_2022-08-03T224458.952__1_.webp",
    alt: "Cliente em atendimento premium",
    title: "Experiência pensada para você voltar.",
    label: "Experiência",
    variant: "square",
  },
] as const;
