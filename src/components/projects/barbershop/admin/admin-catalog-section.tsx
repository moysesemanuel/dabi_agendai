"use client";

import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import type { AdminPageState } from "./use-admin-page-state";

export function AdminCatalogSection({ state }: { state: AdminPageState }) {
  const {
    config,
    setRemovalTarget,
    barberName,
    setBarberName,
    barberRole,
    setBarberRole,
    showcaseImageInputRefs,
    serviceImageInputRefs,
    updateService,
    openCreateServiceModal,
    addBarber,
    openShowcaseImagePicker,
    updateShowcaseImage,
    openServiceImagePicker,
    updateServiceImage,
  } = state;

  return (
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
  );
}
