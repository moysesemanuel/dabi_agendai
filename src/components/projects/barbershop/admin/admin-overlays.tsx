"use client";

import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import { formatAppointmentTime, formatDateToPtBr } from "./admin-formatters";
import type { AdminPageState } from "./use-admin-page-state";

export function AdminOverlays({ state }: { state: AdminPageState }) {
  const {
    config,
    setAppointmentsDate,
    setAppointmentsRefreshToken,
    updatingAppointmentId,
    cancelingAppointment,
    setCancelingAppointment,
    removalTarget,
    setRemovalTarget,
    newAppointmentAlerts,
    newServiceImageInputRef,
    newServiceDescriptionInputRef,
    isCreateServiceModalOpen,
    newServiceDescriptionInvalid,
    newService,
    dismissAppointmentAlert,
    closeCreateServiceModal,
    updateNewServiceField,
    openNewServiceImagePicker,
    updateNewServiceImage,
    createService,
    confirmRemoval,
    removalModalCopy,
    confirmAndOpenWhatsapp,
    cancelAndOpenWhatsapp,
  } = state;

  return (
    <>
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
    </>
  );
}
