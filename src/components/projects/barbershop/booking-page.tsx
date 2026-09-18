"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import bookingPageStyles from "./booking-page.module.css";
import {
  CUSTOMER_SESSION_EVENT,
  type CustomerSession,
  readCustomerSession,
  writeCustomerSession,
} from "./customer-session";
import contactStyles from "./home-contact.module.css";
import layoutStyles from "./home-layout.module.css";
import sectionStyles from "./home-sections.module.css";
import { FooterSection, Header } from "./home-page";
import { fetchLoyalty, type LoyaltyResponse } from "./loyalty";
import { ServiceBookingFlow } from "./service-booking-flow";
import { useSiteConfig } from "./use-site-config";
import { buildWhatsappUrl } from "@/components/shared/whatsapp";
import { formatWhatsappDisplay } from "@/components/shared/whatsapp";
import { formatBusinessHours, getBusinessAddress } from "@/components/shared/site-config";

const styles = {
  ...layoutStyles,
  ...sectionStyles,
  ...contactStyles,
  ...bookingPageStyles,
};

const REVIEW_STORAGE_KEY = "dabi-agendai-customer-reviews";

const tabItems = [
  "Serviços",
  "Profissionais",
  "Fidelidade",
  "Pacotes",
  "Assinaturas",
  "Avaliações",
] as const;

const packages = [
  {
    name: "Pacote Executivo",
    price: "R$ 149",
    summary: "Corte, barba e acabamento premium em uma única visita.",
    details: [
      "Atendimento dedicado",
      "Toalha quente e finalização",
      "Prioridade na agenda da semana",
    ],
  },
  {
    name: "Pacote Pai e Filho",
    price: "R$ 189",
    summary: "Experiência compartilhada com valor fechado e atendimento lado a lado.",
    details: [
      "Dois cortes no mesmo horário",
      "Ambiente reservado",
      "Finalização inclusa",
    ],
  },
];

type TabItem = (typeof tabItems)[number];

type ReviewItem = {
  name: string;
  quote: string;
  rating?: number;
  source?: string;
};

type GoogleReviewsResponse = {
  reviews: ReviewItem[];
  isFallback: boolean;
  error?: string;
};

const REVIEWS_PER_PAGE = 4;

function getBarberImage(name: string) {
  const imagesByBarber: Record<string, string> = {
    "Rafael Costa": "/img/um-cliente-a-cortar-o-cabelo-num-barbeiro_1303-20861.avif",
    "Mateus Lima": "/img/homem-bonito-na-barbearia-barbeando-a-barba_1303-26258.avif",
    "João Vitor": "/img/VISS-Babearia-Visagista.jpg",
  };

  return (
    imagesByBarber[name] ??
    "/img/espaco-masculino-interior-de-barbearia-moderna-gerado-por-ia_866663-5580.avif"
  );
}

function readCustomerReviews() {
  if (typeof window === "undefined") {
    return [] as ReviewItem[];
  }

  try {
    const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReviewItem[]) : [];
  } catch {
    return [];
  }
}

function writeCustomerReviews(items: ReviewItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(items));
}

export function BookingPage() {
  const config = useSiteConfig();
  const [activeTab, setActiveTab] = useState<TabItem>("Serviços");
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyResponse | null>(null);
  const [customerReviews, setCustomerReviews] = useState<ReviewItem[]>([]);
  const [googleReviews, setGoogleReviews] = useState<ReviewItem[]>([]);
  const [googleReviewsMessage, setGoogleReviewsMessage] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const businessAddress = useMemo(() => getBusinessAddress(config), [config]);

  useEffect(() => {
    function syncCustomerSession() {
      setCustomerSession(readCustomerSession());
    }

    syncCustomerSession();
    setCustomerReviews(readCustomerReviews());

    async function loadGoogleReviews() {
      try {
        const response = await fetch("/api/google-reviews", {
          cache: "no-store",
        });
        const payload = (await response.json()) as GoogleReviewsResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Nao foi possivel carregar as avaliações do Google.");
        }

        setGoogleReviews(payload.reviews);
        setGoogleReviewsMessage(
          payload.isFallback
            ? "Adapter em fallback local. Quando você configurar as credenciais do cliente, esta área passa a mostrar avaliações reais."
            : "",
        );
      } catch (error) {
        setGoogleReviews([]);
        setGoogleReviewsMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as avaliações do Google.",
        );
      }
    }

    void loadGoogleReviews();
    window.addEventListener(CUSTOMER_SESSION_EVENT, syncCustomerSession);

    return () => {
      window.removeEventListener(CUSTOMER_SESSION_EVENT, syncCustomerSession);
    };
  }, []);

  useEffect(() => {
    if (!customerSession) {
      setLoyalty(null);
      return;
    }

    const customerId = customerSession.id;
    let active = true;

    async function loadLoyalty() {
      try {
        const payload = await fetchLoyalty(customerId);
        if (active) {
          setLoyalty(payload);
        }
      } catch {
        if (active) {
          setLoyalty(null);
        }
      }
    }

    void loadLoyalty();

    return () => {
      active = false;
    };
  }, [customerSession]);

  const subscriptions = useMemo(
    () =>
      config.plans.map((plan) => ({
        ...plan,
        details: [
          "Recorrência mensal automática",
          "Prioridade na agenda",
          "Condições exclusivas para upgrades",
        ],
      })),
    [config.plans],
  );

  function handleCreateReview() {
    if (!reviewName.trim() || !reviewText.trim()) {
      return;
    }

    const nextReviews = [
      {
        name: reviewName.trim(),
        quote: reviewText.trim(),
        rating: 5,
        source: "Cliente",
      },
      ...customerReviews,
    ];

    setCustomerReviews(nextReviews);
    writeCustomerReviews(nextReviews);
    setReviewName("");
    setReviewText("");
    setReviewPage(1);
  }

  function renderStars(rating = 5) {
    return "★".repeat(rating);
  }

  function renderActivePanel() {
    if (activeTab === "Serviços") {
      return <ServiceBookingFlow config={config} />;
    }

    if (activeTab === "Profissionais") {
      return (
        <div className={styles.featureGrid}>
          {config.barbers.map((barber) => (
            <article className={styles.featureCard} key={barber.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.featureImage} src={getBarberImage(barber.name)} alt={barber.name} />
              <div className={styles.featureBody}>
                <strong>{barber.name}</strong>
                <span>{barber.role}</span>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (activeTab === "Fidelidade") {
      return (
        <div className={styles.loyaltyPanel}>
          {config.loyaltyRewards.map((reward) => (
            <article className={styles.loyaltyCard} key={`${reward.points}-${reward.title}`}>
              <span className={styles.eyebrow}>{reward.points} pts</span>
              <strong>{reward.title}</strong>
              <p>{reward.description}</p>
            </article>
          ))}
          <article className={styles.loyaltyCard}>
            <span className={styles.eyebrow}>Seu progresso</span>
            <strong>{loyalty?.points ?? 0} pts</strong>
            <p>
              Acompanhe nível, metas e histórico completo na sua página de fidelidade.
            </p>
            <Link className={styles.primaryActionButton} href="/fidelidade">
              Abrir fidelidade
            </Link>
          </article>
        </div>
      );
    }

    if (activeTab === "Pacotes") {
      return (
        <div className={styles.featureGrid}>
          {packages.map((item) => (
            <article className={styles.offerCard} key={item.name}>
              <div className={styles.featureBody}>
                <strong>{item.name}</strong>
                <span>{item.summary}</span>
                <div className={styles.metaRow}>
                  <span>{item.price}</span>
                </div>
                <ul className={styles.detailList}>
                  {item.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                <a
                  className={styles.primaryActionButton}
                  href={buildWhatsappUrl(
                    config.whatsapp,
                    `Olá, quero contratar o ${item.name} da ${config.businessName}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contratar
                </a>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (activeTab === "Assinaturas") {
      return (
        <div className={styles.featureGrid}>
          {subscriptions.map((item) => (
            <article className={styles.offerCard} key={item.name}>
              <div className={styles.featureBody}>
                <strong>{item.name}</strong>
                <span>{item.summary}</span>
                <div className={styles.metaRow}>
                  <span>{item.price}</span>
                </div>
                <ul className={styles.detailList}>
                  {item.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                <a
                  className={styles.primaryActionButton}
                  href={buildWhatsappUrl(
                    config.whatsapp,
                    `Olá, quero contratar a assinatura ${item.name} da ${config.businessName}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contratar
                </a>
              </div>
            </article>
          ))}
        </div>
      );
    }

    return (
      <div className={styles.reviewLayout}>
        <div className={styles.reviewColumn}>
          <h3 className={styles.subsectionTitle}>Avaliações dos clientes</h3>
          <div className={styles.reviewList}>
            {[...customerReviews, ...config.testimonials.map((item) => ({ ...item, rating: 5, source: "Site" }))]
              .slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE)
              .map((item, index) => (
              <article className={styles.reviewCard} key={`${item.name}-${index}`}>
                <div className={styles.reviewCardHead}>
                  <div>
                    <strong>{item.name}</strong>
                    <span className={styles.reviewSource}>{item.source ?? "Cliente"}</span>
                  </div>
                  <span className={styles.reviewStars}>{renderStars(item.rating)}</span>
                </div>
                <p>{item.quote}</p>
              </article>
            ))}
          </div>
          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              disabled={reviewPage === 1}
              onClick={() => setReviewPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <span className={styles.paginationLabel}>Página {reviewPage}</span>
            <button
              className={styles.paginationButton}
              disabled={
                reviewPage >=
                Math.ceil(
                  ([...customerReviews, ...config.testimonials].length || 1) / REVIEWS_PER_PAGE,
                )
              }
              onClick={() =>
                setReviewPage((current) =>
                  Math.min(
                    Math.ceil(
                      ([...customerReviews, ...config.testimonials].length || 1) /
                        REVIEWS_PER_PAGE,
                    ),
                    current + 1,
                  ),
                )
              }
              type="button"
            >
              Próxima
            </button>
          </div>
          <div className={styles.reviewForm}>
            <h3 className={styles.subsectionTitle}>Adicionar avaliação</h3>
            <label className={styles.formField}>
              <span>Seu nome</span>
              <input value={reviewName} onChange={(event) => setReviewName(event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Como foi sua experiência</span>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
              />
            </label>
            <button className={styles.primaryActionButton} onClick={handleCreateReview} type="button">
              Publicar avaliação
            </button>
          </div>
        </div>
        <div className={styles.reviewColumn}>
          <h3 className={styles.subsectionTitle}>Avaliações do Google</h3>
          {googleReviewsMessage ? (
            <p className={styles.reviewHint}>{googleReviewsMessage}</p>
          ) : null}
          <div className={styles.reviewList}>
            {googleReviews.map((item) => (
              <article className={styles.reviewCard} key={item.name}>
                <div className={styles.reviewCardHead}>
                  <div>
                    <strong>{item.name}</strong>
                    <span className={styles.reviewSource}>{item.source}</span>
                  </div>
                  <span className={styles.reviewStars}>{renderStars(item.rating)}</span>
                </div>
                <p>{item.quote}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const panelCopy = {
    Serviços: {
      title: "Escolha o serviço e agende direto pelo studio.",
      description:
        "Cada card já leva o serviço selecionado para o fluxo de reserva. Basta escolher o profissional e o horário.",
    },
    Profissionais: {
      title: "Veja quem atende no studio.",
      description:
        "Conheça os profissionais, seus perfis de atendimento e escolha quem combina mais com o seu estilo.",
    },
    Fidelidade: {
      title: "Vantagens da fidelidade do studio.",
      description:
        "Veja o que você pode resgatar com seus pontos e abra sua página de fidelidade para acompanhar nível e progresso.",
    },
    Pacotes: {
      title: "Pacotes pensados para rotina prática.",
      description:
        "Combinações fechadas para quem quer resolver mais de um serviço com valor organizado e comunicação direta.",
    },
    Assinaturas: {
      title: "Assinaturas para frequência previsível.",
      description:
        "Planos recorrentes com prioridade de agenda e mais consistência para manter o visual sempre alinhado.",
    },
    Avaliações: {
      title: "Avaliações de quem já passou pelo studio.",
      description:
        "Veja feedbacks de clientes, acompanhe referências do Google e adicione sua própria experiência.",
    },
  } as const;

  const activePanel = panelCopy[activeTab];

  return (
    <div className={styles.page}>
      <section className={styles.heroShell}>
        <Header
          config={config}
          homeLinks
          profileHref="/agendamento"
          profileTitle={customerSession ? `Perfil de ${customerSession.name}` : "Acesso do cliente"}
          profileName={customerSession?.name}
          profileSubtitle={customerSession?.email || customerSession?.phone}
          profilePoints={loyalty?.points ?? 0}
          profileRole={customerSession?.role}
          onProfileLogout={() => {
            writeCustomerSession(null);
            setCustomerSession(null);
          }}
        />
        <main className={styles.main}>
          <section className={styles.introGrid}>
            <div className={styles.mosaicGrid}>
              {config.showcaseImages.slice(0, 3).map((image) => (
                <article className={styles.mosaicCard} key={image.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.mosaicImage} src={image.src} alt={image.alt} />
                  <div className={styles.mosaicOverlay}>
                    <strong>{image.title}</strong>
                  </div>
                </article>
              ))}
            </div>

            <aside className={styles.sideInfoCard}>
              <div className={styles.infoBlock}>
                <span className={styles.eyebrow}>Localização</span>
                <p>{businessAddress}</p>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.eyebrow}>Horários</span>
                {formatBusinessHours(config.businessHours).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.eyebrow}>Formas de pagamento</span>
                <ul className={styles.paymentList}>
                  <li>Pix</li>
                  <li>Cartão de crédito</li>
                  <li>Cartão de débito</li>
                  <li>Dinheiro</li>
                </ul>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.eyebrow}>Redes sociais</span>
                <ul className={styles.socialLinks}>
                  <li>
                    <a href={`https://wa.me/55${config.whatsapp.replace(/\D/g, "")}`}>
                      {formatWhatsappDisplay(config.whatsapp)}
                    </a>
                  </li>
                  {config.instagram ? (
                    <li>
                      <a href={config.instagram} target="_blank" rel="noreferrer">
                        Instagram
                      </a>
                    </li>
                  ) : null}
                  {config.googleMapsUrl ? (
                    <li>
                      <a href={config.googleMapsUrl} target="_blank" rel="noreferrer">
                        Google Maps
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            </aside>
          </section>

          <section className={styles.tabsSection}>
            <div className={styles.tabsNav}>
              {tabItems.map((item) => (
                <button
                  className={`${styles.tabButton} ${activeTab === item ? styles.tabButtonActive : ""}`}
                  key={item}
                  onClick={() => setActiveTab(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            <article className={styles.tabPanel}>
              <span className={styles.eyebrow}>{activeTab}</span>
              <h2>{activePanel.title}</h2>
              <p>{activePanel.description}</p>
            </article>
          </section>
        </main>
      </section>

      <section className={styles.bookingSection}>
        <div className={styles.bookingInner}>
          {renderActivePanel()}
          <FooterSection />
        </div>
      </section>
    </div>
  );
}
