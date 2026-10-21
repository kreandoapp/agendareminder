import React, { useEffect, useMemo, useState } from 'react'
import './AdminDashboard.css'

const API_URL = 'https://kreandoapp.com/api/index.php'

const emptySummary = {
  users: 0,
  onboardingCompleted: 0,
  usersWithAppointments: 0,
  usersWithWhatsApp: 0,
  totalAppointments: 0,
  totalClients: 0,
  totalServices: 0,
  totalWhatsAppSent: 0,
}

function StatCard({ icon, value, label, tone }) {
  return (
    <div className={`ad-stat-card ${tone}`}>
      <div className="ad-stat-icon">{icon}</div>
      <div className="ad-stat-content">
        <strong>{Number(value || 0).toLocaleString('es-ES')}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`ad-badge ${tone}`}>{children}</span>
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(emptySummary)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [onboardingFilter, setOnboardingFilter] = useState('all')
  const [whatsappFilter, setWhatsappFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersError, setCustomersError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setError('No hay una sesión válida.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}?action=admin-dashboard`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          }
        )

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'No se pudo cargar el dashboard.'
          )
        }

        if (cancelled) return

        setSummary(result.summary || emptySummary)
        setUsers(Array.isArray(result.users) ? result.users : [])
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'No se pudo cargar el dashboard.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadCustomers = async () => {
      if (!selectedUser?.business_id) {
        setCustomers([])
        setCustomersError('')
        return
      }

      const token = localStorage.getItem('access_token')

      if (!token) {
        setCustomers([])
        setCustomersError('No hay una sesión válida.')
        return
      }

      try {
        setCustomersLoading(true)
        setCustomersError('')

        const response = await fetch(
          `${API_URL}?action=admin-dashboard-customers&business_id=${selectedUser.business_id}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          }
        )

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'No se pudieron cargar los clientes.'
          )
        }

        if (cancelled) return

        setCustomers(
          Array.isArray(result.customers)
            ? result.customers
            : []
        )
      } catch (loadError) {
        if (!cancelled) {
          setCustomers([])
          setCustomersError(
            loadError.message ||
            'No se pudieron cargar los clientes.'
          )
        }
      } finally {
        if (!cancelled) {
          setCustomersLoading(false)
        }
      }
    }

    loadCustomers()

    return () => {
      cancelled = true
    }
  }, [selectedUser])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch = !normalizedSearch || [
        user.name,
        user.email,
        user.business_name,
        user.country,
        user.language,
      ].some((value) =>
        String(value || '').toLowerCase().includes(normalizedSearch)
      )

      const matchesOnboarding =
        onboardingFilter === 'all' ||
        (onboardingFilter === 'completed'
          ? Boolean(Number(user.onboarding_completed))
          : !Boolean(Number(user.onboarding_completed)))

      const matchesWhatsApp =
        whatsappFilter === 'all' ||
        (whatsappFilter === 'sent'
          ? Number(user.whatsapp_sent_count || 0) > 0
          : Number(user.whatsapp_sent_count || 0) === 0)

      return matchesSearch && matchesOnboarding && matchesWhatsApp
    })
  }, [users, search, onboardingFilter, whatsappFilter])

  return (
    <div className="admin-dashboard-page">
      <header className="ad-header">
        <div>
          <div className="ad-eyebrow">ADMINISTRADOR</div>
          <h1>Dashboard</h1>
          <p>Resumen general de Wilbuk y actividad de los usuarios.</p>
        </div>

        <button
          type="button"
          className="ad-refresh-button"
          onClick={() => window.location.reload()}
        >
          ↻ Actualizar
        </button>
      </header>

      <section className="ad-stats-grid">
        <StatCard icon="👥" value={summary.users} label="Usuarios registrados" tone="blue" />
        <StatCard icon="✓" value={summary.onboardingCompleted} label="Onboarding completado" tone="green" />
        <StatCard icon="📅" value={summary.usersWithAppointments} label="Usuarios con citas" tone="purple" />
        <StatCard icon="💬" value={summary.usersWithWhatsApp} label="Usuarios que enviaron WhatsApp" tone="orange" />
        <StatCard icon="🗓️" value={summary.totalAppointments} label="Citas totales" tone="pink" />
        <StatCard icon="👤" value={summary.totalClients} label="Clientes totales" tone="yellow" />
        <StatCard icon="✂️" value={summary.totalServices} label="Servicios totales" tone="cyan" />
        <StatCard icon="📤" value={summary.totalWhatsAppSent} label="WhatsApp enviados" tone="indigo" />
      </section>

      <section className="ad-users-card">
        <div className="ad-users-header">
          <div>
            <h2>Usuarios</h2>
            <span>{filteredUsers.length} mostrados</span>
          </div>
        </div>

        <div className="ad-filters">
          <div className="ad-search-wrap">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuario, negocio o email..."
            />
          </div>

          <select value={onboardingFilter} onChange={(event) => setOnboardingFilter(event.target.value)}>
            <option value="all">Onboarding: todos</option>
            <option value="completed">Completado</option>
            <option value="pending">Pendiente</option>
          </select>

          <select value={whatsappFilter} onChange={(event) => setWhatsappFilter(event.target.value)}>
            <option value="all">WhatsApp: todos</option>
            <option value="sent">Ya envió</option>
            <option value="not-sent">Nunca envió</option>
          </select>
        </div>

        {loading ? (
          <div className="ad-state">Cargando dashboard...</div>
        ) : error ? (
          <div className="ad-state ad-state-error">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="ad-state">No hay usuarios para mostrar.</div>
        ) : (
          <>
            <div className="ad-table-wrap ad-desktop-users">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Negocio</th>
                    <th>País</th>
                    <th>Idioma</th>
                    <th>Onboarding</th>
                    <th>Citas</th>
                    <th>Clientes</th>
                    <th>Servicios</th>
                    <th>WhatsApp</th>
                    <th>Enviados</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="ad-user-cell">
                          <div className="ad-avatar">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{user.name || 'Sin nombre'}</strong>
                            <small>{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.business_name || '—'}</td>
                      <td>{user.country || '—'}</td>
                      <td>{user.language || '—'}</td>
                      <td>
                        {Number(user.onboarding_completed) === 1 ? (
                          <StatusBadge tone="success">Completado</StatusBadge>
                        ) : (
                          <StatusBadge tone="warning">Pendiente</StatusBadge>
                        )}
                      </td>
                      <td>{Number(user.appointments_count || 0)}</td>
                      <td>{Number(user.clients_count || 0)}</td>
                      <td>{Number(user.services_count || 0)}</td>
                      <td>
                        {Number(user.whatsapp_sent_count || 0) > 0 ? (
                          <StatusBadge tone="success">Sí</StatusBadge>
                        ) : (
                          <StatusBadge tone="danger">No</StatusBadge>
                        )}
                      </td>
                      <td>{Number(user.whatsapp_sent_count || 0)}</td>
                      <td>
                        <button
                          type="button"
                          className="ad-view-button"
                          onClick={() => setSelectedUser(user)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ad-mobile-users">
              {filteredUsers.map((user) => (
                <article className="ad-mobile-user-card" key={`mobile-${user.id}`}>
                  <div className="ad-mobile-user-header">
                    <div className="ad-user-cell">
                      <div className="ad-avatar">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{user.name || 'Sin nombre'}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>

                    {Number(user.onboarding_completed) === 1 ? (
                      <StatusBadge tone="success">Completado</StatusBadge>
                    ) : (
                      <StatusBadge tone="warning">Pendiente</StatusBadge>
                    )}
                  </div>

                  <div className="ad-mobile-business">
                    <span>Negocio</span>
                    <strong>{user.business_name || '—'}</strong>
                  </div>

                  <div className="ad-mobile-meta">
                    <div>
                      <span>País</span>
                      <strong>{user.country || '—'}</strong>
                    </div>
                    <div>
                      <span>Idioma</span>
                      <strong>{user.language || '—'}</strong>
                    </div>
                  </div>

                  <div className="ad-mobile-stats">
                    <div>
                      <strong>{Number(user.appointments_count || 0)}</strong>
                      <span>Citas</span>
                    </div>
                    <div>
                      <strong>{Number(user.clients_count || 0)}</strong>
                      <span>Clientes</span>
                    </div>
                    <div>
                      <strong>{Number(user.services_count || 0)}</strong>
                      <span>Servicios</span>
                    </div>
                    <div>
                      <strong>{Number(user.whatsapp_sent_count || 0)}</strong>
                      <span>Enviados</span>
                    </div>
                  </div>

                  <div className="ad-mobile-whatsapp">
                    <span>WhatsApp</span>
                    {Number(user.whatsapp_sent_count || 0) > 0 ? (
                      <StatusBadge tone="success">Sí</StatusBadge>
                    ) : (
                      <StatusBadge tone="danger">No</StatusBadge>
                    )}
                  </div>

                  <button
                    type="button"
                    className="ad-mobile-view-button"
                    onClick={() => setSelectedUser(user)}
                  >
                    Ver usuario
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {selectedUser && (
        <div className="ad-dialog-overlay" onMouseDown={() => setSelectedUser(null)}>
          <div className="ad-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <div className="ad-dialog-header">
              <div className="ad-user-cell">
                <div className="ad-avatar large">
                  {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{selectedUser.name || 'Sin nombre'}</strong>
                  <small>{selectedUser.email}</small>
                </div>
              </div>
              <button type="button" className="ad-dialog-close" onClick={() => setSelectedUser(null)}>×</button>
            </div>

            <div className="ad-dialog-grid">
              <div><span>Negocio</span><strong>{selectedUser.business_name || '—'}</strong></div>
              <div><span>País</span><strong>{selectedUser.country || '—'}</strong></div>
              <div><span>Idioma</span><strong>{selectedUser.language || '—'}</strong></div>
              <div><span>Onboarding</span><strong>{Number(selectedUser.onboarding_completed) === 1 ? 'Completado' : 'Pendiente'}</strong></div>
              <div><span>Citas</span><strong>{Number(selectedUser.appointments_count || 0)}</strong></div>
              <div><span>Clientes</span><strong>{Number(selectedUser.clients_count || 0)}</strong></div>
              <div><span>Servicios</span><strong>{Number(selectedUser.services_count || 0)}</strong></div>
              <div><span>WhatsApp enviados</span><strong>{Number(selectedUser.whatsapp_sent_count || 0)}</strong></div>
            </div>

            <div className="ad-dialog-whatsapp">
              {Number(selectedUser.whatsapp_sent_count || 0) > 0
                ? '🟢 Esta cuenta ya realizó envíos de WhatsApp con Wilbuk.'
                : '⚪ Esta cuenta todavía no registra envíos de WhatsApp.'}
            </div>

            <div className="ad-dialog-customers">
              <div className="ad-dialog-section-header">
                <div>
                  <span>CLIENTES</span>
                  <h3>
                    {customersLoading
                      ? 'Cargando...'
                      : `${customers.length} cliente${customers.length === 1 ? '' : 's'}`}
                  </h3>
                </div>
              </div>

              {customersLoading ? (
                <div className="ad-dialog-customers-state">
                  Cargando clientes...
                </div>
              ) : customersError ? (
                <div className="ad-dialog-customers-state ad-dialog-customers-error">
                  {customersError}
                </div>
              ) : customers.length === 0 ? (
                <div className="ad-dialog-customers-state">
                  Este negocio todavía no tiene clientes.
                </div>
              ) : (
                <div className="ad-dialog-customers-list">
                  {customers.map((customer) => (
                    <div
                      className="ad-dialog-customer"
                      key={customer.id}
                    >
                      <div className="ad-dialog-customer-avatar">
                        {(customer.full_name || 'C').charAt(0).toUpperCase()}
                      </div>

                      <div className="ad-dialog-customer-info">
                        <strong>
                          {customer.full_name || 'Sin nombre'}
                        </strong>

                        <div className="ad-dialog-customer-meta">
                          {customer.dial_code || customer.phone_number ? (
                            <span>
                              📱 {customer.dial_code || ''}
                              {customer.phone_number || ''}
                            </span>
                          ) : null}

                          {customer.email ? (
                            <span>✉️ {customer.email}</span>
                          ) : null}

                          {customer.language_code ? (
                            <span>🌐 {customer.language_code}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
