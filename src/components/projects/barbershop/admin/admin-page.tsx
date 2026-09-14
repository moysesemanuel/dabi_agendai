"use client";

import Link from "next/link";
import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import { DaBiTechSignature } from "@/components/shared/dabi-tech-signature";
import { weekdayLabels } from "@/components/shared/site-config";
import { DatePickerField, InlineCalendar } from "./admin-calendar";
import {
  formatAppointmentTime,
  formatDateToPtBr,
  getAppointmentStatusLabel,
  getDateParts,
} from "./admin-formatters";
import { type AdminSectionView } from "./admin-types";
import { useAdminPageState } from "./use-admin-page-state";

export function AdminPage({ section = "overview" }: { section?: AdminSectionView }) {
  const {
    pathname,
    config,
    closingDate,
    setClosingDate,
    closingReason,
    setClosingReason,
    timeOffBarberName,
    setTimeOffBarberName,
    timeOffDate,
    setTimeOffDate,
    timeOffReason,
    setTimeOffReason,
    addressLookupMessage,
    addressLookupLoading,
    holidayLookupMessage,
    holidayLookupLoading,
    appointmentsDate,
    setAppointmentsDate,
    appointments,
    appointmentsMessage,
    appointmentsLoading,
    setAppointmentsRefreshToken,
    averageRatingValue,
    savingSync,
    updatingAppointmentId,
    editingAppointmentId,
    cancelingAppointment,
    setCancelingAppointment,
    removalTarget,
    setRemovalTarget,
    rescheduleDate,
    setRescheduleDate,
    rescheduleTime,
    setRescheduleTime,
    rescheduleSlots,
    rescheduleMessage,
    loadingRescheduleSlots,
    manualService,
    setManualService,
    manualBarber,
    setManualBarber,
    manualDate,
    setManualDate,
    manualTime,
    setManualTime,
    manualCustomerName,
    setManualCustomerName,
    manualCustomerPhone,
    setManualCustomerPhone,
    manualNotes,
    setManualNotes,
    manualSlots,
    manualMessage,
    manualLoadingSlots,
    manualSubmitting,
    barberName,
    setBarberName,
    barberRole,
    setBarberRole,
    statusMessage,
    notificationsEnabled,
    soundAlertsEnabled,
    notificationFeedback,
    newAppointmentAlerts,
    showcaseImageInputRefs,
    serviceImageInputRefs,
    newServiceImageInputRef,
    newServiceDescriptionInputRef,
    isCreateServiceModalOpen,
    newServiceDescriptionInvalid,
    newService,
    enableBrowserNotifications,
    toggleSoundAlerts,
    dismissAppointmentAlert,
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
    updateService,
    openCreateServiceModal,
    closeCreateServiceModal,
    updateNewServiceField,
    openNewServiceImagePicker,
    updateNewServiceImage,
    createService,
    addBarber,
    addClosedDate,
    updateBusinessHoursDay,
    addBarberTimeOff,
    confirmRemoval,
    removalModalCopy,
    saveChanges,
    openPublicSite,
    openShowcaseImagePicker,
    updateShowcaseImage,
    openServiceImagePicker,
    updateServiceImage,
    confirmAndOpenWhatsapp,
    cancelAndOpenWhatsapp,
    startReschedule,
    cancelReschedule,
    saveReschedule,
    createManualAppointment,
    displayStats,
    serviceDurationMap,
    displayedClosedDates,
    selectedDateClosedReason,
    manualDateClosedReason,
    barberAppointments,
    appointmentStatusCounts,
    currentPage,
    showSiteSections,
    showCatalogSections,
    showScheduleSections,
    showOverview,
    showSaveAction,
  } = useAdminPageState(section);

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminShell}>
        <aside className={styles.adminSidebar}>
          <div className={styles.sidebarBrand}>
            <strong>Prime Cut Admin</strong>
            <span>Painel de gestão da barbearia</span>
          </div>

          <nav className={styles.sidebarNav}>
            <Link className={pathname === "/admin" ? styles.sidebarNavLinkActive : ""} href="/admin">
              Visão geral
            </Link>
            <Link className={pathname === "/admin/site" ? styles.sidebarNavLinkActive : ""} href="/admin/site">
              Site
            </Link>
            <Link className={pathname === "/admin/catalogo" ? styles.sidebarNavLinkActive : ""} href="/admin/catalogo">
              Catálogo
            </Link>
            <Link className={pathname === "/admin/agenda" ? styles.sidebarNavLinkActive : ""} href="/admin/agenda">
              Agenda
            </Link>
            <Link className={pathname === "/admin/dados" ? styles.sidebarNavLinkActive : ""} href="/admin/dados">
              Dados
            </Link>
          </nav>

          <div className={styles.sidebarStats}>
            <div>
              <div className={styles.sidebarMetaLabel}>Slots padrão</div>
              <div className={styles.sidebarMetaValue}>{config.availableTimes.join(" · ")}</div>
            </div>
            <div>
              <div className={styles.sidebarMetaLabel}>Planos do clube</div>
              <div className={styles.sidebarMetaValue}>{config.plans.length} planos ativos</div>
            </div>
          </div>
        </aside>

        <main className={styles.adminContent}>
          <section className={styles.adminHeader} id="visao-geral">
            <div>
              <p className={styles.sectionEyebrow}>{currentPage.eyebrow}</p>
              <h1>{currentPage.title}</h1>
              <p>{currentPage.description}</p>
            </div>
            <div className={styles.adminHeaderActions}>
              <AdminButton variant="secondary" type="button" onClick={openPublicSite}>
                Ver site público
              </AdminButton>
              <AdminButton variant="secondary" type="button" onClick={toggleSoundAlerts}>
                {soundAlertsEnabled ? "Som ativo" : "Ativar som"}
              </AdminButton>
              <AdminButton
                variant="secondary"
                type="button"
                onClick={() => void enableBrowserNotifications()}
              >
                {notificationsEnabled ? "Alertas ativos" : "Ativar alertas"}
              </AdminButton>
            </div>
          </section>

          {notificationFeedback ? (
            <p className={styles.inlineStatusMessage}>{notificationFeedback}</p>
          ) : null}

          <section className={styles.summaryMetricsGrid}>
            {displayStats.map((item) => (
              <article className={styles.summaryMetricCard} key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </section>

          <div className={styles.adminSections}>
            {showOverview ? (
              <section className={styles.quickLinksGrid}>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Site</p>
                    <h2>Conteúdo e fidelidade</h2>
                    <p>Textos do negócio, indicadores da home, níveis e recompensas.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/site">
                    Abrir configurações do site
                  </Link>
                </article>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Catálogo</p>
                    <h2>Serviços, imagens e equipe</h2>
                    <p>Catálogo público, galeria do site e barbeiros cadastrados.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/catalogo">
                    Abrir catálogo e equipe
                  </Link>
                </article>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Agenda</p>
                    <h2>Operação do dia</h2>
                    <p>Bloqueios, encaixes manuais, calendário e agendamentos reais.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/agenda">
                    Abrir agenda
                  </Link>
                </article>
                <article className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <p className={styles.sectionEyebrow}>Dados</p>
                    <h2>Clientes e desempenho</h2>
                    <p>Clientes, fidelidade, receita diária e dados para o futuro dashboard.</p>
                  </div>
                  <Link className={styles.inlineNavigationLink} href="/admin/dados">
                    Abrir dados
                  </Link>
                </article>
              </section>
            ) : null}

            {showSiteSections ? (
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
            ) : null}

            {showCatalogSections ? (
              <>
            <section className={styles.contentCard} id="servicos">
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Catálogo</p>
                <h2>Serviços e valores</h2>
                <p>Atualize preço, descrição, duração e remova serviços que não estiverem ativos.</p>
              </div>

              <AdminButton variant="primary" type="button" onClick={openCreateServiceModal}>
                Adicionar serviço
              </AdminButton>

              <div className={styles.servicesEditorList}>
                {config.services.map((service, index) => (
                  <div className={styles.serviceEditorCard} key={`${service.name}-${index}`}>
                    <div className={styles.galleryCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.galleryPreview}
                        src={service.image}
                        alt={`Preview do serviço ${service.name}`}
                      />
                      <div className={styles.galleryCardBody}>
                        <strong>Imagem do serviço</strong>
                        <span>{service.name}</span>
                        <input
                          ref={(element) => {
                            serviceImageInputRefs.current[index] = element;
                          }}
                          className={styles.visuallyHiddenInput}
                          type="file"
                          accept="image/*"
                          onChange={(event) => updateServiceImage(index, event.target.files?.[0] ?? null)}
                        />
                        <AdminButton
                          variant="secondary"
                          type="button"
                          onClick={() => openServiceImagePicker(index)}
                        >
                          Trocar imagem
                        </AdminButton>
                      </div>
                    </div>
                    <div className={styles.serviceEditorContent}>
                      <div className={styles.serviceEditorFields}>
                        <label className={styles.serviceField}>
                          <span>Nome do serviço</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={service.name}
                            onChange={(event) => updateService(index, "name", event.target.value)}
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Valor</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={service.price}
                            onChange={(event) => updateService(index, "price", event.target.value)}
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Duração</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={service.duration}
                            onChange={(event) => updateService(index, "duration", event.target.value)}
                          />
                        </label>
                        <label className={styles.serviceField}>
                          <span>Clube / assinatura</span>
                          <input
                            className={styles.serviceFieldInput}
                            value={service.membership}
                            onChange={(event) => updateService(index, "membership", event.target.value)}
                          />
                        </label>
                        <label className={`${styles.serviceField} ${styles.serviceFieldDescription}`}>
                          <span>Descrição</span>
                          <textarea
                            className={styles.serviceFieldInput}
                            value={service.description}
                            onChange={(event) => updateService(index, "description", event.target.value)}
                          />
                        </label>
                      </div>
                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() =>
                          setRemovalTarget({
                            type: "service",
                            index,
                            label: service.name,
                          })
                        }
                      >
                        Remover serviço
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.contentCard} id="imagens">
              <div className={styles.contentCardHeader}>
                <p className={styles.sectionEyebrow}>Galeria</p>
                <h2>Imagens do site</h2>
                <p>Troque os destaques visuais da home. O preview também atualiza no site ao salvar.</p>
              </div>

              <div className={styles.galleryGrid}>
                {config.showcaseImages.map((image, index) => (
                  <article className={styles.galleryCard} key={`${image.label}-${index}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.galleryPreview} src={image.src} alt={image.alt} />
                    <div className={styles.galleryCardBody}>
                      <strong>{image.label}</strong>
                      <span>{image.title}</span>
                      <input
                        ref={(element) => {
                          showcaseImageInputRefs.current[index] = element;
                        }}
                        className={styles.visuallyHiddenInput}
                        type="file"
                        accept="image/*"
                        onChange={(event) => updateShowcaseImage(index, event.target.files?.[0] ?? null)}
                      />
                      <AdminButton
                        variant="secondary"
                        type="button"
                        onClick={() => openShowcaseImagePicker(index)}
                      >
                        Trocar imagem
                      </AdminButton>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.sectionSplitLayout} id="barbeiros">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Equipe</p>
                  <h2>Barbeiros</h2>
                  <p>Cadastre novos profissionais e ajuste a apresentação da equipe.</p>
                </div>

                <div className={styles.formFieldsGrid}>
                  <div className={styles.formField}>
                    <label htmlFor="barber-name">Nome</label>
                    <input
                      id="barber-name"
                      value={barberName}
                      onChange={(event) => setBarberName(event.target.value)}
                      placeholder="Ex.: Gabriel Rocha"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="barber-role">Especialidade</label>
                    <input
                      id="barber-role"
                      value={barberRole}
                      onChange={(event) => setBarberRole(event.target.value)}
                      placeholder="Ex.: Corte social e barba"
                    />
                  </div>
                </div>

                <AdminButton
                  variant="primary"
                  type="button"
                  onClick={addBarber}
                >
                  Adicionar barbeiro
                </AdminButton>
              </article>

              <aside className={styles.sideListCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Equipe cadastrada</p>
                  <h2 className={styles.listCardTitle}>
                    {config.barbers.length} {config.barbers.length === 1 ? "profissional" : "profissionais"}
                  </h2>
                </div>
                <div className={styles.stackedList}>
                  {config.barbers.map((barber) => (
                    <div className={styles.stackedListItem} key={barber.name}>
                      <div className={styles.stackedListText}>
                        <strong>{barber.name}</strong>
                        <span>{barber.role}</span>
                      </div>
                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() =>
                          setRemovalTarget({
                            type: "barber",
                            name: barber.name,
                            label: barber.name,
                          })
                        }
                      >
                        Remover
                      </AdminButton>
                    </div>
                  ))}
                </div>
              </aside>
            </section>
              </>
            ) : null}

            {showScheduleSections ? (
              <>
            <section className={styles.sectionSplitLayout} id="horario-funcionamento">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agenda</p>
                  <h2>Horário de funcionamento</h2>
                  <p>Defina o horário de atendimento para cada dia da semana.</p>
                </div>
                <div className={styles.stackedList}>
                  {config.businessHours
                    .slice()
                    .sort((left, right) => left.weekday - right.weekday)
                    .map((day) => (
                      <div className={styles.inlineFormRow} key={day.weekday}>
                        <div className={styles.formField}>
                          <label>
                            <input
                              type="checkbox"
                              checked={!day.closed}
                              onChange={(event) =>
                                updateBusinessHoursDay(day.weekday, { closed: !event.target.checked })
                              }
                            />{" "}
                            {weekdayLabels[day.weekday]}
                          </label>
                        </div>
                        {!day.closed ? (
                          <>
                            <div className={styles.formField}>
                              <label htmlFor={`business-start-${day.weekday}`}>Abre</label>
                              <input
                                id={`business-start-${day.weekday}`}
                                type="time"
                                value={day.start}
                                onChange={(event) =>
                                  updateBusinessHoursDay(day.weekday, { start: event.target.value })
                                }
                              />
                            </div>
                            <div className={styles.formField}>
                              <label htmlFor={`business-end-${day.weekday}`}>Fecha</label>
                              <input
                                id={`business-end-${day.weekday}`}
                                type="time"
                                value={day.end}
                                onChange={(event) =>
                                  updateBusinessHoursDay(day.weekday, { end: event.target.value })
                                }
                              />
                            </div>
                          </>
                        ) : (
                          <span className={styles.formFieldHint}>Fechado nesse dia</span>
                        )}
                      </div>
                    ))}
                </div>
              </article>
            </section>

            <section className={styles.sectionSplitLayout} id="agenda">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agenda</p>
                  <h2>Datas que a barbearia vai fechar (feriados)</h2>
                  <p>Marque feriados, fechamentos pontuais ou períodos de treinamento.</p>
                </div>

                <div className={styles.inlineFormRow}>
                  <div className={styles.formField}>
                    <label htmlFor="closing-date">Data</label>
                    <DatePickerField
                      value={closingDate}
                      onChange={setClosingDate}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="closing-reason">Motivo</label>
                    <input
                      id="closing-reason"
                      value={closingReason}
                      onChange={(event) => setClosingReason(event.target.value)}
                    />
                  </div>
                  <AdminButton
                    className={styles.inlineRowAction}
                    variant="primary"
                    type="button"
                    onClick={addClosedDate}
                  >
                    Bloquear data
                  </AdminButton>
                </div>
                <p className={styles.formFieldHint}>
                  {holidayLookupLoading ? "Consultando feriados do mes..." : holidayLookupMessage}
                </p>
              </article>

              <aside className={styles.sideListCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agenda bloqueada</p>
                  <h2 className={styles.listCardTitle}>
                    {displayedClosedDates.length} datas cadastradas
                  </h2>
                </div>
                <div className={styles.stackedList}>
                  {displayedClosedDates.map((item) => (
                    <div className={styles.blockedDateItem} key={item.date}>
                      <div className={styles.blockedDateBadge}>
                        <strong>{getDateParts(item.date).day}</strong>
                        <span>{getDateParts(item.date).month}</span>
                      </div>
                      <div className={styles.stackedListText}>
                        <strong>{getDateParts(item.date).full}</strong>
                        <span>
                          {item.reason}
                          {item.source === "holiday" ? " • feriado automatico" : ""}
                        </span>
                      </div>
                      <AdminButton
                        variant="danger"
                        type="button"
                        onClick={() =>
                          setRemovalTarget({
                            type: "closedDate",
                            date: item.date,
                            label: `${getDateParts(item.date).full} - ${item.reason}`,
                          })
                        }
                      >
                        Remover
                      </AdminButton>
                    </div>
                  ))}
                </div>
              </aside>
            </section>

            <section className={styles.sectionSplitLayout} id="folgas">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agenda</p>
                  <h2>Folgas por profissional</h2>
                  <p>Bloqueie datas específicas para um barbeiro sem fechar a barbearia inteira.</p>
                </div>

                <div className={styles.inlineFormRow}>
                  <div className={styles.formField}>
                    <label htmlFor="time-off-barber">Profissional</label>
                    <select
                      id="time-off-barber"
                      value={timeOffBarberName}
                      onChange={(event) => setTimeOffBarberName(event.target.value)}
                    >
                      {config.barbers.map((barber) => (
                        <option key={barber.name} value={barber.name}>
                          {barber.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="time-off-date">Data</label>
                    <DatePickerField value={timeOffDate} onChange={setTimeOffDate} />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="time-off-reason">Motivo</label>
                    <input
                      id="time-off-reason"
                      value={timeOffReason}
                      onChange={(event) => setTimeOffReason(event.target.value)}
                    />
                  </div>
                  <AdminButton
                    className={styles.inlineRowAction}
                    variant="primary"
                    type="button"
                    onClick={addBarberTimeOff}
                    disabled={config.barbers.length === 0}
                  >
                    Adicionar folga
                  </AdminButton>
                </div>
              </article>

              <aside className={styles.sideListCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Folgas cadastradas</p>
                  <h2 className={styles.listCardTitle}>
                    {config.barberTimeOff.length} folgas cadastradas
                  </h2>
                </div>
                <div className={styles.stackedList}>
                  {config.barberTimeOff
                    .slice()
                    .sort((left, right) => left.date.localeCompare(right.date))
                    .map((item) => (
                      <div className={styles.blockedDateItem} key={`${item.barberName}-${item.date}`}>
                        <div className={styles.blockedDateBadge}>
                          <strong>{getDateParts(item.date).day}</strong>
                          <span>{getDateParts(item.date).month}</span>
                        </div>
                        <div className={styles.stackedListText}>
                          <strong>{item.barberName}</strong>
                          <span>
                            {getDateParts(item.date).full} • {item.reason}
                          </span>
                        </div>
                        <AdminButton
                          variant="danger"
                          type="button"
                          onClick={() =>
                            setRemovalTarget({
                              type: "barberTimeOff",
                              barberName: item.barberName,
                              date: item.date,
                              label: `${item.barberName} em ${getDateParts(item.date).full}`,
                            })
                          }
                        >
                          Remover
                        </AdminButton>
                      </div>
                    ))}
                </div>
              </aside>
            </section>

            <section className={styles.sectionSplitLayout} id="operacao-agenda">
              <article className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agendamento manual</p>
                  <h2>Criar horário pelo backoffice</h2>
                  <p>Use este card para encaixes, reservas por telefone ou marcações feitas no balcão.</p>
                </div>

                <div className={styles.formFieldsGrid}>
                  <div className={styles.formField}>
                    <label>Serviço</label>
                    <select value={manualService} onChange={(event) => setManualService(event.target.value)}>
                      {config.services.map((service) => (
                        <option key={service.name} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Barbeiro</label>
                    <select value={manualBarber} onChange={(event) => setManualBarber(event.target.value)}>
                      {config.barbers.map((barber) => (
                        <option key={barber.name} value={barber.name}>
                          {barber.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Data</label>
                    <DatePickerField value={manualDate} onChange={setManualDate} />
                  </div>
                  <div className={styles.formField}>
                    <label>Horário</label>
                    <select value={manualTime} onChange={(event) => setManualTime(event.target.value)}>
                      <option value="">Selecione</option>
                      {manualSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Cliente</label>
                    <input
                      value={manualCustomerName}
                      onChange={(event) => setManualCustomerName(event.target.value)}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>WhatsApp</label>
                    <input
                      value={manualCustomerPhone}
                      onChange={(event) => setManualCustomerPhone(event.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label>Observações</label>
                    <textarea
                      value={manualNotes}
                      onChange={(event) => setManualNotes(event.target.value)}
                      placeholder="Ex.: cliente pediu acabamento na navalha"
                    />
                  </div>
                </div>

                {manualLoadingSlots ? (
                  <p className={styles.inlineStatusMessage}>Carregando horários...</p>
                ) : manualDateClosedReason ? (
                  <p className={styles.inlineStatusMessage}>
                    Agenda bloqueada nesta data: {manualDateClosedReason}.
                  </p>
                ) : manualMessage ? (
                  <p className={styles.inlineStatusMessage}>{manualMessage}</p>
                ) : null}

                <AdminButton
                  variant="primary"
                  type="button"
                  disabled={manualSubmitting || manualLoadingSlots || !manualTime}
                  onClick={() => void createManualAppointment()}
                >
                  {manualSubmitting ? "Agendando..." : "Criar agendamento"}
                </AdminButton>
              </article>

              <aside className={styles.contentCard}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Calendário da agenda</p>
                  <h2>Visão diária por barbeiro</h2>
                  <p>Clique no dia para ver os horários disponíveis e os atendimentos já ocupados.</p>
                </div>

                <InlineCalendar
                  key={appointmentsDate}
                  value={appointmentsDate}
                  onChange={setAppointmentsDate}
                />

                {selectedDateClosedReason ? (
                  <p className={styles.inlineStatusMessage}>
                    Data marcada como fechada: {selectedDateClosedReason}.
                  </p>
                ) : null}

                {barberAppointments.length > 0 ? (
                  <div className={styles.barberAgendaGrid}>
                    {barberAppointments.map(({ barber, appointments: barberAppointmentItems }) => (
                      <article className={styles.barberAgendaColumn} key={barber.name}>
                        <div className={styles.barberAgendaHeader}>
                          <strong>{barber.name}</strong>
                          <span>{formatDateToPtBr(appointmentsDate)}</span>
                        </div>

                        <div className={styles.barberAppointmentList}>
                          {barberAppointmentItems.map((appointment) => {
                            const durationMinutes =
                              serviceDurationMap.get(appointment.serviceName) ?? 30;

                            return (
                              <div className={`${styles.barberAppointmentItem} ${styles.barberAppointmentBusy}`} key={appointment.id}>
                                <strong className={styles.barberAppointmentTime}>
                                  {formatAppointmentTime(appointment.startsAt)}
                                </strong>
                                <div className={styles.barberAppointmentContent}>
                                  <strong className={styles.barberAppointmentCustomer}>
                                    {appointment.customerName}
                                  </strong>
                                  <div className={styles.barberAppointmentMeta}>
                                    <span>{appointment.serviceName}</span>
                                    <span>{appointment.barberName}</span>
                                    <span>{durationMinutes} min</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyPanel}>Nenhum agendamento encontrado para esta data.</p>
                )}
              </aside>
            </section>

            <section className={styles.contentCard} id="agendamentos">
              <article className={styles.contentCardBody}>
                <div className={styles.contentCardHeader}>
                  <p className={styles.sectionEyebrow}>Agenda real</p>
                  <h2>Agendamentos do dia</h2>
                  <p>
                    Visualize os horários já confirmados pelo formulário público.
                  </p>
                </div>

                <div className={styles.inlineFormRow}>
                  <div className={styles.formField}>
                    <label htmlFor="appointments-date">Data</label>
                    <DatePickerField
                      value={appointmentsDate}
                      onChange={setAppointmentsDate}
                    />
                  </div>
                  <div className={styles.inlineMetricCard}>
                    <span className={styles.sidebarMetaLabel}>Agendados / remarcados</span>
                    <strong>{appointmentStatusCounts.scheduled}</strong>
                  </div>
                  <div className={styles.inlineMetricCard}>
                    <span className={styles.sidebarMetaLabel}>Confirmados</span>
                    <strong>{appointmentStatusCounts.confirmed}</strong>
                  </div>
                  <div className={styles.inlineMetricCard}>
                    <span className={styles.sidebarMetaLabel}>Cancelados</span>
                    <strong>{appointmentStatusCounts.cancelled}</strong>
                  </div>
                </div>

                <div className={styles.appointmentsFeed}>
                  {appointmentsLoading ? (
                    <p className={styles.emptyPanel}>Carregando agendamentos...</p>
                  ) : appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <article className={styles.appointmentCard} key={appointment.id}>
                        <div className={styles.appointmentTimeBlock}>
                          <strong>{formatAppointmentTime(appointment.startsAt)}</strong>
                          <span>{getAppointmentStatusLabel(appointment.status)}</span>
                        </div>
                        <div className={styles.appointmentDetails}>
                          <strong>{appointment.customerName}</strong>
                          <span>
                            {appointment.serviceName} com {appointment.barberName}
                          </span>
                          <span>{appointment.customerPhone}</span>
                          {appointment.notes ? <p>{appointment.notes}</p> : null}
                        </div>
                        <div className={styles.appointmentActionGroup}>
                          <AdminButton
                            variant="warning"
                            type="button"
                            disabled={updatingAppointmentId === appointment.id}
                            onClick={() => startReschedule(appointment)}
                          >
                            Remarcar
                          </AdminButton>
                          <AdminButton
                            variant="success"
                            type="button"
                            disabled={updatingAppointmentId === appointment.id || appointment.status === "CONFIRMED"}
                            onClick={() => void confirmAndOpenWhatsapp(appointment)}
                          >
                            Confirmar + WhatsApp
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            type="button"
                            disabled={updatingAppointmentId === appointment.id || appointment.status === "CANCELLED"}
                            onClick={() => setCancelingAppointment(appointment)}
                          >
                            Cancelar
                          </AdminButton>
                        </div>
                        {editingAppointmentId === appointment.id ? (
                          <div className={styles.rescheduleCard}>
                            <div className={styles.rescheduleFields}>
                              <div className={styles.formField}>
                                <label>Nova data</label>
                                <DatePickerField
                                  value={rescheduleDate}
                                  onChange={setRescheduleDate}
                                />
                              </div>
                              <div className={styles.formField}>
                                <label>Novo horário</label>
                                <select
                                  value={rescheduleTime}
                                  onChange={(event) => setRescheduleTime(event.target.value)}
                                >
                                  <option value="">Selecione</option>
                                  {rescheduleSlots.map((slot) => (
                                    <option key={slot} value={slot}>
                                      {slot}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {loadingRescheduleSlots ? (
                              <p className={styles.rescheduleStatusMessage}>Carregando horarios...</p>
                            ) : rescheduleMessage ? (
                              <p className={styles.rescheduleStatusMessage}>{rescheduleMessage}</p>
                            ) : null}

                            <div className={styles.rescheduleActionRow}>
                              <AdminButton
                                variant="secondary"
                                type="button"
                                onClick={cancelReschedule}
                              >
                                Fechar
                              </AdminButton>
                              <AdminButton
                                variant="primary"
                                type="button"
                                disabled={
                                  updatingAppointmentId === appointment.id ||
                                  loadingRescheduleSlots ||
                                  !rescheduleTime
                                }
                                onClick={() => void saveReschedule()}
                              >
                                Salvar nova data
                              </AdminButton>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <p className={styles.emptyPanel}>{appointmentsMessage}</p>
                  )}
                </div>
              </article>
            </section>
              </>
            ) : null}
          </div>

          {showSaveAction ? (
            <div className={styles.adminSaveBar}>
              <p className={styles.saveStatusMessage}>{statusMessage}</p>
              <AdminButton variant="primary" type="button" onClick={() => void saveChanges()}>
                {savingSync ? "Salvando..." : "Salvar alterações"}
              </AdminButton>
            </div>
          ) : null}

          <footer className={styles.adminFooter}>
            <DaBiTechSignature
              containerClassName={styles.adminFooterInner}
              labelClassName={styles.adminFooterLabel}
              logoClassName={styles.adminFooterLogo}
              linkClassName={styles.adminFooterLink}
            />
          </footer>
        </main>
      </div>

      {cancelingAppointment ? (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogCard}>
            <div className={styles.contentCardHeader}>
              <p className={styles.sectionEyebrow}>Confirmar cancelamento</p>
              <h2>Cancelar este horário?</h2>
              <p>
                {cancelingAppointment.customerName} está marcado para{" "}
                {cancelingAppointment.serviceName} com {cancelingAppointment.barberName} em{" "}
                {formatDateToPtBr(cancelingAppointment.startsAt.slice(0, 10))} às{" "}
                {formatAppointmentTime(cancelingAppointment.startsAt)}.
              </p>
            </div>

            <p className={styles.dialogText}>
              Ao confirmar, o sistema cancela o agendamento e abre o WhatsApp com a mensagem pronta para o cliente.
            </p>

            <div className={styles.dialogActions}>
              <AdminButton
                variant="secondary"
                type="button"
                onClick={() => setCancelingAppointment(null)}
              >
                Voltar
              </AdminButton>
              <AdminButton
                variant="danger"
                type="button"
                disabled={updatingAppointmentId === cancelingAppointment.id}
                onClick={() => void cancelAndOpenWhatsapp(cancelingAppointment)}
              >
                Confirmar cancelamento
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}

      {newAppointmentAlerts.length > 0 ? (
        <div className={styles.notificationStack}>
          {newAppointmentAlerts.map((appointment) => (
            <article className={styles.notificationCard} key={appointment.id}>
              <div className={styles.notificationCardHeader}>
                <span className={styles.sectionEyebrow}>Novo agendamento</span>
                <button
                  className={styles.notificationCloseButton}
                  onClick={() => dismissAppointmentAlert(appointment.id)}
                  type="button"
                  aria-label="Dispensar notificação"
                >
                  ×
                </button>
              </div>
              <strong>{appointment.customerName}</strong>
              <p>
                {appointment.serviceName} com {appointment.barberName}
              </p>
              <p>
                {formatDateToPtBr(appointment.startsAt.slice(0, 10))} às{" "}
                {formatAppointmentTime(appointment.startsAt)}
              </p>
              <div className={styles.notificationActions}>
                <AdminButton
                  variant="success"
                  type="button"
                  disabled={updatingAppointmentId === appointment.id}
                  onClick={() => void confirmAndOpenWhatsapp(appointment)}
                >
                  Confirmar
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setAppointmentsDate(appointment.startsAt.slice(0, 10));
                    setAppointmentsRefreshToken((current) => current + 1);
                    dismissAppointmentAlert(appointment.id);
                  }}
                >
                  Ver agenda
                </AdminButton>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {removalTarget ? (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogCard}>
            <div className={styles.contentCardHeader}>
              <p className={styles.sectionEyebrow}>Confirmar remoção</p>
              <h2>{removalModalCopy?.title}</h2>
              <p>{removalTarget.label}</p>
            </div>

            <p className={styles.dialogText}>
              {removalModalCopy?.description} Depois disso, você ainda precisa salvar as alterações para refletir no site e na agenda.
            </p>

            <div className={styles.dialogActions}>
              <AdminButton
                variant="secondary"
                type="button"
                onClick={() => setRemovalTarget(null)}
              >
                Voltar
              </AdminButton>
              <AdminButton
                variant="danger"
                type="button"
                onClick={confirmRemoval}
              >
                Confirmar remoção
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateServiceModalOpen ? (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogCard}>
            <div className={styles.contentCardHeader}>
              <p className={styles.sectionEyebrow}>Novo serviço</p>
              <h2>Criar serviço no catálogo</h2>
              <p>Preencha os dados principais para adicionar um novo serviço ao site.</p>
            </div>

            <div className={styles.galleryCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.galleryPreview}
                src={newService.image || config.services[0]?.image || ""}
                alt="Preview do novo serviço"
              />
              <div className={styles.galleryCardBody}>
                <strong>Imagem do serviço</strong>
                <span>{newService.name || "Novo serviço"}</span>
                <input
                  ref={newServiceImageInputRef}
                  className={styles.visuallyHiddenInput}
                  type="file"
                  accept="image/*"
                  onChange={(event) => updateNewServiceImage(event.target.files?.[0] ?? null)}
                />
                <AdminButton
                  variant="secondary"
                  type="button"
                  onClick={openNewServiceImagePicker}
                >
                  Trocar imagem
                </AdminButton>
              </div>
            </div>

            <div className={styles.formFieldsGrid}>
              <div className={styles.formField}>
                <label htmlFor="new-service-name">Nome</label>
                <input
                  id="new-service-name"
                  value={newService.name}
                  onChange={(event) => updateNewServiceField("name", event.target.value)}
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="new-service-price">Preço</label>
                <input
                  id="new-service-price"
                  value={newService.price}
                  onChange={(event) => updateNewServiceField("price", event.target.value)}
                  placeholder="60"
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="new-service-duration">Duração</label>
                <input
                  id="new-service-duration"
                  value={newService.duration}
                  onChange={(event) => updateNewServiceField("duration", event.target.value)}
                  placeholder="40"
                />
              </div>
              <div className={styles.formField}>
                <label htmlFor="new-service-membership">Clube / assinatura</label>
                <input
                  id="new-service-membership"
                  value={newService.membership}
                  onChange={(event) => updateNewServiceField("membership", event.target.value)}
                  placeholder="R$ 149,90 no clube"
                />
              </div>
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label htmlFor="new-service-description">Descrição</label>
                <textarea
                  id="new-service-description"
                  ref={newServiceDescriptionInputRef}
                  className={newServiceDescriptionInvalid ? styles.formFieldInvalid : ""}
                  value={newService.description}
                  onChange={(event) => updateNewServiceField("description", event.target.value)}
                />
              </div>
            </div>

            <div className={styles.dialogActions}>
              <AdminButton variant="secondary" type="button" onClick={closeCreateServiceModal}>
                Fechar
              </AdminButton>
              <AdminButton variant="primary" type="button" onClick={createService}>
                Criar serviço
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
