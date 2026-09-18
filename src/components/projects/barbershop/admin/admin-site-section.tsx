"use client";

import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import type { AdminPageState } from "./use-admin-page-state";

export function AdminSiteSection({ state }: { state: AdminPageState }) {
  const {
    config,
    addressLookupMessage,
    addressLookupLoading,
    averageRatingValue,
    setBusinessField,
    updateStat,
    updatePlan,
    addPlan,
    removePlan,
    updateLoyaltyReward,
    addLoyaltyReward,
    removeLoyaltyReward,
    updateLoyaltyTier,
    addLoyaltyTier,
    removeLoyaltyTier,
  } = state;

  return (
    <>
            <section className={styles.sectionSplitLayout} id="informacoes">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Conteúdo principal</p>
                  <h2>Informações do negócio</h2>
                  <p>Atualize os textos e dados principais que aparecem na home e no contato.</p>
                </div>

                <div className={styles.formFieldsGrid}>
                  <div className={styles.formField}>
                    <label htmlFor="business-name">Nome da barbearia</label>
                    <input
                      id="business-name"
                      value={config.businessName}
                      onChange={(event) => setBusinessField("businessName", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-tag">Linha de apoio</label>
                    <input
                      id="business-tag"
                      value={config.businessTag}
                      onChange={(event) => setBusinessField("businessTag", event.target.value)}
                    />
                  </div>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label htmlFor="business-headline">Headline principal</label>
                    <textarea
                      id="business-headline"
                      value={config.headline}
                      onChange={(event) => setBusinessField("headline", event.target.value)}
                    />
                  </div>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label htmlFor="hero-description">Descrição da hero</label>
                    <textarea
                      id="hero-description"
                      value={config.heroDescription}
                      onChange={(event) => setBusinessField("heroDescription", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-zip-code">CEP</label>
                    <input
                      id="business-zip-code"
                      value={config.zipCode}
                      onChange={(event) => setBusinessField("zipCode", event.target.value)}
                      placeholder="00000-000"
                    />
                    {addressLookupLoading || addressLookupMessage ? (
                      <p className={styles.formFieldHint}>
                        {addressLookupLoading
                          ? "Consultando CEP..."
                          : addressLookupMessage}
                      </p>
                    ) : null}
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-address">Endereço</label>
                    <input
                      id="business-address"
                      value={config.address}
                      onChange={(event) => setBusinessField("address", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-address-number">Número</label>
                    <input
                      id="business-address-number"
                      value={config.addressNumber}
                      onChange={(event) => setBusinessField("addressNumber", event.target.value)}
                      placeholder="412"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-city">Cidade</label>
                    <input
                      id="business-city"
                      value={config.city}
                      onChange={(event) => setBusinessField("city", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-neighborhood">Bairro</label>
                    <input
                      id="business-neighborhood"
                      value={config.neighborhood}
                      onChange={(event) => setBusinessField("neighborhood", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-whatsapp">WhatsApp</label>
                    <input
                      id="business-whatsapp"
                      value={config.whatsapp}
                      onChange={(event) => setBusinessField("whatsapp", event.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-instagram">Instagram</label>
                    <input
                      id="business-instagram"
                      value={config.instagram}
                      onChange={(event) => setBusinessField("instagram", event.target.value)}
                      placeholder="https://instagram.com/suabarbearia"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="business-google-maps">Link do Google Maps</label>
                    <input
                      id="business-google-maps"
                      value={config.googleMapsUrl}
                      onChange={(event) => setBusinessField("googleMapsUrl", event.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </div>
                </div>
              </article>

              <aside className={styles.infoSummaryCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Resumo</p>
                  <h2>O que esse painel controla</h2>
                </div>
                <br></br>
                <ul className={styles.summaryChecklist}>
                  <li>Título principal, endereço e canais de contato</li>
                  <li>Preços, duração e descrição dos serviços</li>
                  <li>Imagens de destaque e cards do catálogo</li>
                  <li>Equipe de barbeiros visível para o cliente</li>
                  <li>Datas bloqueadas e indisponibilidade da agenda</li>
                </ul>
              </aside>
            </section>

            <section className={styles.contentCard}>
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Clube Prime</p>
                <h2>Planos do clube</h2>
                <p>
                  Edite os planos exibidos na home e na aba de assinaturas do agendamento.
                </p>
              </div>

              <div className={styles.servicesEditorList}>
                {config.plans.map((plan, index) => (
                  <div className={styles.serviceEditorCard} key={`${plan.name}-${index}`}>
                    <div className={styles.galleryCard}>
                      <div className={styles.galleryCardBody}>
                        <strong>Plano #{index + 1}</strong>
                        <span>{plan.name || "Sem nome"}</span>
                      </div>
                    </div>

                    <div className={styles.serviceEditorContent}>
                      <div className={styles.serviceEditorFields}>
                        <label className={styles.serviceField}>
                          <span>Nome do plano</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={plan.name}
                            onChange={(event) => updatePlan(index, "name", event.target.value)}
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Preço</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={plan.price}
                            onChange={(event) => updatePlan(index, "price", event.target.value)}
                          />
                        </label>
                        <label className={`${styles.serviceField} ${styles.serviceFieldDescription}`}>
                          <span>Resumo</span>
                          <textarea
                            className={styles.serviceFieldInput}
                            value={plan.summary}
                            onChange={(event) => updatePlan(index, "summary", event.target.value)}
                          />
                        </label>
                      </div>

                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() => removePlan(index)}
                      >
                        Remover plano
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>

              <AdminButton variant="primary" type="button" onClick={addPlan}>
                Adicionar plano
              </AdminButton>
            </section>

            <section className={styles.contentCard}>
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Indicadores da home</p>
                <h2>Cards de prova social</h2>
                <p>
                  Edite os cards de clientes atendidos, nota média e tempo de operação.
                  A quantidade de barbeiros continua atualizando automaticamente pela equipe cadastrada.
                </p>
              </div>

              <div className={styles.formFieldsGrid}>
                <div className={styles.formField}>
                  <label htmlFor="stats-clients-value">Clientes atendidos</label>
                  <input
                    id="stats-clients-value"
                    value={config.stats[0]?.value ?? ""}
                    onChange={(event) => updateStat(0, "value", event.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="stats-clients-label">Texto do card</label>
                  <input
                    id="stats-clients-label"
                    value={config.stats[0]?.label ?? ""}
                    onChange={(event) => updateStat(0, "label", event.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="stats-rating-value">Média de avaliações</label>
                  <input
                    id="stats-rating-value"
                    value={averageRatingValue}
                    readOnly
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="stats-rating-label">Texto do card</label>
                  <input
                    id="stats-rating-label"
                    value={config.stats[1]?.label ?? ""}
                    onChange={(event) => updateStat(1, "label", event.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="stats-years-value">Tempo de operação</label>
                  <input
                    id="stats-years-value"
                    value={config.stats[2]?.value ?? ""}
                    onChange={(event) => updateStat(2, "value", event.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="stats-years-label">Texto do card</label>
                  <input
                    id="stats-years-label"
                    value={config.stats[2]?.label ?? ""}
                    onChange={(event) => updateStat(2, "label", event.target.value)}
                  />
                </div>
              </div>

              <p className={styles.formFieldHint}>
                A média de avaliações é calculada automaticamente a partir das avaliações do site e do Google.
              </p>
            </section>

            <section className={styles.contentCard} id="fidelidade">
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Fidelidade</p>
                <h2>Vantagens e recompensas</h2>
                <p>
                  Edite as metas e benefícios exibidos na aba de fidelidade e na página do cliente.
                </p>
              </div>

              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Níveis</p>
                <h2>Níveis da fidelidade</h2>
                <p>
                  Ajuste nome, faixas de pontos e cor de destaque de cada nível do programa.
                </p>
              </div>

              <div className={styles.servicesEditorList}>
                {config.loyaltyTiers.map((tier, index) => (
                  <div className={styles.serviceEditorCard} key={`${tier.name}-${index}`}>
                    <div className={styles.galleryCard}>
                      <div className={styles.galleryCardBody}>
                        <strong>Nível #{index + 1}</strong>
                        <span>{tier.name || "Sem nome"}</span>
                        <div
                          className={styles.loyaltyTierSwatch}
                          style={{ backgroundColor: tier.accent }}
                        />
                      </div>
                    </div>

                    <div className={styles.serviceEditorContent}>
                      <div className={styles.serviceEditorFields}>
                        <label className={styles.serviceField}>
                          <span>Nome do nível</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={tier.name}
                            onChange={(event) =>
                              updateLoyaltyTier(index, "name", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Pontos iniciais</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={tier.minPoints}
                            onChange={(event) =>
                              updateLoyaltyTier(index, "minPoints", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Pontos finais</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={tier.maxPoints ?? ""}
                            placeholder="Deixe vazio para nível máximo"
                            onChange={(event) =>
                              updateLoyaltyTier(index, "maxPoints", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Cor</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={tier.accent}
                            onChange={(event) =>
                              updateLoyaltyTier(index, "accent", event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() => removeLoyaltyTier(index)}
                      >
                        Remover nível
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>

              <AdminButton variant="primary" type="button" onClick={addLoyaltyTier}>
                Adicionar nível
              </AdminButton>

              <div className={styles.servicesEditorList}>
                {config.loyaltyRewards.map((reward, index) => (
                  <div className={styles.serviceEditorCard} key={`${reward.points}-${index}`}>
                    <div className={styles.galleryCard}>
                      <div className={styles.galleryCardBody}>
                        <strong>Meta #{index + 1}</strong>
                        <span>{reward.points} pts</span>
                      </div>
                    </div>

                    <div className={styles.serviceEditorContent}>
                      <div className={styles.serviceEditorFields}>
                        <label className={styles.serviceField}>
                          <span>Pontos</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={reward.points}
                            onChange={(event) =>
                              updateLoyaltyReward(index, "points", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Título da recompensa</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={reward.title}
                            onChange={(event) =>
                              updateLoyaltyReward(index, "title", event.target.value)
                            }
                          />
                        </label>
                        <label className={`${styles.serviceField} ${styles.serviceFieldDescription}`}>
                          <span>Descrição</span>
                          <textarea
                            className={styles.serviceFieldInput}
                            value={reward.description}
                            onChange={(event) =>
                              updateLoyaltyReward(index, "description", event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() => removeLoyaltyReward(index)}
                      >
                        Remover recompensa
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>

              <AdminButton variant="primary" type="button" onClick={addLoyaltyReward}>
                Adicionar recompensa
              </AdminButton>
            </section>
    </>
  );
}
