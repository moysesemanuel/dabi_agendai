"use client";

import styles from "@/app/admin/admin.module.css";
import { AdminButton } from "@/components/projects/barbershop/admin/admin-button";
import { weekdayLabels } from "@/components/shared/site-config";
import { DatePickerField, InlineCalendar } from "./admin-calendar";
import {
  formatAppointmentTime,
  formatDateToPtBr,
  getAppointmentStatusLabel,
  getDateParts,
} from "./admin-formatters";
import type { AdminPageState } from "./use-admin-page-state";

export function AdminScheduleSection({ state }: { state: AdminPageState }) {
  const {
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
    holidayLookupMessage,
    holidayLookupLoading,
    appointmentsDate,
    setAppointmentsDate,
    appointments,
    appointmentsMessage,
    appointmentsLoading,
    updatingAppointmentId,
    editingAppointmentId,
    setCancelingAppointment,
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
    addClosedDate,
    updateBusinessHoursDay,
    addBarberTimeOff,
    confirmAndOpenWhatsapp,
    startReschedule,
    cancelReschedule,
    saveReschedule,
    createManualAppointment,
    serviceDurationMap,
    displayedClosedDates,
    selectedDateClosedReason,
    manualDateClosedReason,
    barberAppointments,
    appointmentStatusCounts,
  } = state;

  return (
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
  );
}
