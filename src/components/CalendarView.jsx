import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, X, Search, Bell, CalendarCheck, User, PlusCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const normalize = (str) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || '';

export const CalendarView = () => {
  const { user } = useAuth();
  const calendarRef = useRef(null);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [proximasCitas, setProximasCitas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudiantesMap, setEstudiantesMap] = useState({});
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState([]);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [showSidebarInfo, setShowSidebarInfo] = useState(false);

  const [rapidaForm, setRapidaForm] = useState({
    estudianteId: '',
    fecha: '',
    hora: '',
    duracion: 60,
    motivo: ''
  });

  const [form, setForm] = useState({
    estudianteId: '',
    motivo: '',
    duracion: 60,
    hora: ''
  });

  // Eventos filtrados (useMemo para evitar useEffect innecesario)
  const events = useMemo(() => {
    if (!allEvents.length) return [];
    if (!searchTerm.trim()) return allEvents;
    const term = normalize(searchTerm);
    return allEvents.filter(event => {
      const props = event.extendedProps;
      const searchable = `${props.estudianteNombre} ${props.estudianteId} ${props.motivo}`;
      return normalize(searchable).includes(term);
    });
  }, [allEvents, searchTerm]);

  useEffect(() => {
    if (user.rol === 'PSICOLOGO') {
      inicializarDatos();
    }
  }, [user]);

  const inicializarDatos = async () => {
    setLoading(true);
    try {
      await cargarEstudiantes();      // 1. Cargar estudiantes y construir el mapa
      await cargarCitas();            // 2. Cargar citas usando el mapa ya lleno
      await cargarSolicitudesPendientes();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstudiantes = async () => {
    try {
      const res = await api.get('/usuarios');
      const estudiantesList = res.data.filter(u => u.rol === 'ESTUDIANTE');
      setEstudiantes(estudiantesList);
      setEstudiantesFiltrados(estudiantesList);
      const map = {};
      estudiantesList.forEach(est => {
        map[est.id] = est.nombre;
      });
      setEstudiantesMap(map);
      console.log('✅ Estudiantes cargados:', estudiantesList);
      console.log('✅ Mapa de estudiantes:', map);
    } catch (error) {
      console.error('Error cargando estudiantes', error);
    }
  };

  const cargarCitas = async () => {
    try {
      const res = await api.get(`/citas/psicologo/${user.id}/futuras`);
      const citasRaw = res.data;
      console.log('📅 Citas raw del backend:', citasRaw);
      
      const citasConNombre = citasRaw.map(cita => ({
        ...cita,
        estudianteNombre: estudiantesMap[cita.estudianteId] || cita.estudianteId
      }));
      console.log('📅 Citas con nombre asignado:', citasConNombre);
      
      const sorted = [...citasConNombre].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
      setProximasCitas(sorted.slice(0, 5));
      
      const formatted = citasConNombre.map(cita => ({
        id: cita.id,
        title: `${cita.estudianteNombre} (${cita.estudianteId}) - ${cita.motivo}`,
        start: cita.fechaHora,
        extendedProps: {
          id: cita.id,
          estudianteId: cita.estudianteId,
          estudianteNombre: cita.estudianteNombre,
          motivo: cita.motivo,
          fechaHora: cita.fechaHora,
          duracionMinutos: cita.duracionMinutos,
          estado: cita.estado,
          solicitudCancelacion: cita.solicitudCancelacion,
          solicitudReasignacion: cita.solicitudReasignacion,
        },
        className: 'custom-event',
        backgroundColor: cita.solicitudReasignacion || cita.solicitudCancelacion ? '#fef3c7' : '#dcfce7',
        borderColor: cita.solicitudReasignacion || cita.solicitudCancelacion ? '#f59e0b' : '#10b981',
        textColor: '#1f2937',
      }));
      setAllEvents(formatted);
    } catch (error) {
      console.error('Error cargando citas', error);
    }
  };

  const cargarSolicitudesPendientes = async () => {
    try {
      const res = await api.get(`/citas/psicologo/${user.id}/futuras`);
      const pendientes = res.data.filter(c => c.solicitudCancelacion || c.solicitudReasignacion);
      const pendientesConNombre = pendientes.map(c => ({
        ...c,
        estudianteNombre: estudiantesMap[c.estudianteId] || c.estudianteId
      }));
      setSolicitudesPendientes(pendientesConNombre);
    } catch (error) {
      console.error('Error cargando solicitudes pendientes', error);
    }
  };

  const handleBusquedaRapidaChange = useCallback((e) => {
    const texto = e.target.value;
    setBusquedaEstudiante(texto);
    const term = normalize(texto);
    if (term === '') {
      setEstudiantesFiltrados(estudiantes);
    } else {
      const filtrados = estudiantes.filter(est => 
        normalize(est.nombre).includes(term) || normalize(est.id).includes(term)
      );
      setEstudiantesFiltrados(filtrados);
    }
  }, [estudiantes]);

  const handleCrearCitaRapida = async () => {
    if (!rapidaForm.estudianteId || !rapidaForm.fecha || !rapidaForm.hora || !rapidaForm.duracion) {
      alert('Completa todos los campos obligatorios');
      return;
    }
    const [hours, minutes] = rapidaForm.hora.split(':');
    const fechaHora = new Date(rapidaForm.fecha);
    fechaHora.setHours(parseInt(hours), parseInt(minutes));
    try {
      await api.post('/citas', {
        estudianteId: rapidaForm.estudianteId,
        psicologoId: user.id,
        fechaHora: fechaHora.toISOString(),
        motivo: rapidaForm.motivo,
        duracionMinutos: parseInt(rapidaForm.duracion)
      });
      setRapidaForm({ estudianteId: '', fecha: '', hora: '', duracion: 60, motivo: '' });
      setBusquedaEstudiante('');
      setEstudiantesFiltrados(estudiantes);
      await inicializarDatos();
      setShowQuickForm(false);
    } catch (error) {
      alert('Error al crear cita: ' + error.response?.data);
    }
  };

  const handleDateSelect = (info) => {
    setSelectedDate(info.start);
    setForm({ estudianteId: '', motivo: '', duracion: 60, hora: '' });
    setBusquedaEstudiante('');
    setEstudiantesFiltrados(estudiantes);
    setShowQuickForm(true);
    setCitaSeleccionada(null);
  };

  const handleCrearCitaDesdeCalendario = async () => {
    if (!form.estudianteId || !form.motivo || !form.hora || !form.duracion) {
      alert('Completa todos los campos');
      return;
    }
    const [hours, minutes] = form.hora.split(':');
    const fechaHora = new Date(selectedDate);
    fechaHora.setHours(parseInt(hours), parseInt(minutes));
    try {
      await api.post('/citas', {
        estudianteId: form.estudianteId,
        psicologoId: user.id,
        fechaHora: fechaHora.toISOString(),
        motivo: form.motivo,
        duracionMinutos: parseInt(form.duracion)
      });
      setShowQuickForm(false);
      setForm({ estudianteId: '', motivo: '', duracion: 60, hora: '' });
      await inicializarDatos();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const handleEventClick = (info) => {
    setCitaSeleccionada(info.event.extendedProps);
    setShowDetailsModal(true);
  };

  // Acciones sobre solicitudes y directas
  const handleAceptarCancelacion = async () => {
    if (!confirm('¿Confirmas cancelar esta cita definitivamente?')) return;
    try {
      await api.put(`/citas/${citaSeleccionada.id}/aceptar-cancelacion`, {}, {
        headers: { 'X-User-Id': user.id, 'X-User-Rol': user.rol }
      });
      alert('Cita cancelada exitosamente');
      setShowDetailsModal(false);
      await inicializarDatos();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const handleRechazarCancelacion = async () => {
    if (!confirm('¿Rechazar la solicitud de cancelación?')) return;
    try {
      await api.put(`/citas/${citaSeleccionada.id}/rechazar-cancelacion`, {}, {
        headers: { 'X-User-Id': user.id, 'X-User-Rol': user.rol }
      });
      alert('Solicitud rechazada');
      setShowDetailsModal(false);
      await inicializarDatos();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const handleAceptarReasignacion = async () => {
    const nuevaFecha = prompt('Ingrese nueva fecha (YYYY-MM-DDTHH:MM):', citaSeleccionada.fechaHora.slice(0,16));
    if (!nuevaFecha) return;
    try {
      await api.put(`/citas/${citaSeleccionada.id}/aceptar-reasignacion`, { nuevaFechaHora: nuevaFecha }, {
        headers: { 'X-User-Id': user.id, 'X-User-Rol': user.rol }
      });
      alert('Cita reasignada');
      setShowDetailsModal(false);
      await inicializarDatos();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const handleRechazarReasignacion = async () => {
    if (!confirm('¿Rechazar la solicitud de reasignación?')) return;
    try {
      await api.put(`/citas/${citaSeleccionada.id}/rechazar-reasignacion`, {}, {
        headers: { 'X-User-Id': user.id, 'X-User-Rol': user.rol }
      });
      alert('Solicitud rechazada');
      setShowDetailsModal(false);
      await inicializarDatos();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const handleCancelarCitaDirecta = async () => {
    if (!confirm('¿Confirmas cancelar esta cita? Se notificará al estudiante.')) return;
    try {
      await api.put(`/citas/${citaSeleccionada.id}/aceptar-cancelacion`, {}, {
        headers: { 'X-User-Id': user.id, 'X-User-Rol': user.rol }
      });
      alert('Cita cancelada exitosamente');
      setShowDetailsModal(false);
      await inicializarDatos();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const handleReprogramarCitaDirecta = async () => {
    const nuevaFecha = prompt('Ingrese nueva fecha y hora (formato YYYY-MM-DDTHH:MM):', citaSeleccionada.fechaHora.slice(0,16));
    if (!nuevaFecha) return;
    try {
      await api.put(`/citas/${citaSeleccionada.id}/reprogramar`, { nuevaFechaHora: nuevaFecha }, {
        headers: { 'X-User-Id': user.id, 'X-User-Rol': user.rol }
      });
      alert('Cita reprogramada exitosamente');
      setShowDetailsModal(false);
      await inicializarDatos();
    } catch (error) {
      alert('Error: ' + error.response?.data);
    }
  };

  const goToToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  if (user.rol !== 'PSICOLOGO') {
    return <div className="text-center p-8 text-rose-600">No tienes permisos para ver el calendario.</div>;
  }

  return (
    <div className="relative">
      {/* Botón flotante para móvil */}
      <button
        onClick={() => {
          setSelectedDate(null);
          setForm({ estudianteId: '', motivo: '', duracion: 60, hora: '' });
          setRapidaForm({ estudianteId: '', fecha: '', hora: '', duracion: 60, motivo: '' });
          setBusquedaEstudiante('');
          setEstudiantesFiltrados(estudiantes);
          setShowQuickForm(true);
        }}
        className="fixed bottom-6 right-6 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 transition-colors z-30 lg:hidden"
      >
        <PlusCircle size={24} />
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar izquierdo */}
        <div className="lg:w-80 w-full space-y-6 order-2 lg:order-1">
          {/* Bloque 1: Próximas citas */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-teal-400 to-teal-600 p-3 rounded-xl shadow-md">
                <Calendar className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-teal-800">Bienestar</h2>
                <p className="text-sm text-gray-500">Panel de psicólogo</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4">
                <p className="text-xs text-teal-600 font-medium">Total citas</p>
                <p className="text-3xl font-bold text-teal-800">{allEvents.length}</p>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-medium">Solicitudes pendientes</p>
                <p className="text-3xl font-bold text-amber-700">{solicitudesPendientes.length}</p>
              </div>
            </div>
            <hr className="my-5 border-gray-100" />
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CalendarCheck size={18} /> Próximas citas
            </h3>
            <div className="space-y-3">
              {proximasCitas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay citas próximas</p>
              ) : (
                proximasCitas.map(cita => (
                  <div
                    key={cita.id}
                    onClick={() => { setCitaSeleccionada(cita); setShowDetailsModal(true); }}
                    className="bg-gray-50 hover:bg-teal-50 rounded-xl p-3 cursor-pointer transition-all"
                  >
                    <p className="text-sm font-semibold text-gray-800">{cita.estudianteNombre} ({cita.estudianteId})</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock size={12} /> {new Date(cita.fechaHora).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{cita.motivo}</p>
                    {cita.solicitudReasignacion && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-2 inline-block">Solicita reasignación</span>
                    )}
                    {cita.solicitudCancelacion && (
                      <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">Solicita cancelación</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bloque 2: Agendar cita rápida */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <PlusCircle size={18} className="text-teal-600" /> Agendar cita rápida
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estudiante</label>
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl"
                  value={busquedaEstudiante}
                  onChange={handleBusquedaRapidaChange}
                />
                <select
                  className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-200 rounded-xl"
                  value={rapidaForm.estudianteId}
                  onChange={e => setRapidaForm({ ...rapidaForm, estudianteId: e.target.value })}
                >
                  <option value="">Seleccionar</option>
                  {estudiantesFiltrados.map(est => (
                    <option key={est.id} value={est.id}>{est.nombre} ({est.id})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                  <input type="date" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl" value={rapidaForm.fecha} onChange={e => setRapidaForm({ ...rapidaForm, fecha: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
                  <input type="time" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl" value={rapidaForm.hora} onChange={e => setRapidaForm({ ...rapidaForm, hora: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Duración (min)</label>
                <input type="number" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl" value={rapidaForm.duracion} onChange={e => setRapidaForm({ ...rapidaForm, duracion: parseInt(e.target.value) })} min="15" step="15" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motivo</label>
                <textarea rows="2" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-xl" value={rapidaForm.motivo} onChange={e => setRapidaForm({ ...rapidaForm, motivo: e.target.value })} />
              </div>
              <button onClick={handleCrearCitaRapida} className="btn btn-primary w-full text-sm py-2">Agendar cita</button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 order-1 lg:order-2">
          <div className="mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <User size={28} className="bg-white/20 p-1 rounded-full" />
              <div>
                <h1 className="text-xl font-bold">Bienvenido, {user.nombre}</h1>
                <p className="text-teal-100 text-xs">Gestiona tus citas fácilmente</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por estudiante o motivo..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {solicitudesPendientes.length > 0 && (
            <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
                <Bell size={16} /> Solicitudes pendientes ({solicitudesPendientes.length})
              </div>
              <div className="space-y-2">
                {solicitudesPendientes.slice(0, 2).map(cita => (
                  <div key={cita.id} className="flex justify-between items-center bg-white rounded-lg p-2 text-sm">
                    <div>
                      <p className="font-medium">{cita.estudianteNombre} ({cita.estudianteId})</p>
                      <p className="text-xs text-gray-500">{new Date(cita.fechaHora).toLocaleString()}</p>
                    </div>
                    <button onClick={() => { setCitaSeleccionada(cita); setShowDetailsModal(true); }} className="btn btn-primary text-xs py-1 px-2">Atender</button>
                  </div>
                ))}
                {solicitudesPendientes.length > 2 && (
                  <p className="text-xs text-center text-amber-600">+{solicitudesPendientes.length - 2} más</p>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-teal-600" size={40} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-2 mb-4">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
                initialView="dayGridMonth"
                selectable={true}
                select={handleDateSelect}
                events={events}
                eventClick={handleEventClick}
                locale="es"
                height="auto"
                buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
                eventDisplay="block"
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit' }}
              />
            </div>
          )}

          <div className="lg:hidden flex justify-center mt-2">
            <button onClick={() => setShowSidebarInfo(!showSidebarInfo)} className="text-teal-600 text-sm flex items-center gap-1">
              {showSidebarInfo ? 'Ocultar panel' : 'Mostrar panel de estadísticas'} {showSidebarInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom sheet para crear cita */}
      {showQuickForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowQuickForm(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 p-5 animate-slideUp max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-teal-700">
                {selectedDate ? `Agendar cita - ${selectedDate.toLocaleDateString()}` : 'Agendar cita rápida'}
              </h3>
              <button onClick={() => setShowQuickForm(false)} className="p-1 rounded-full bg-gray-100"><X size={20} /></button>
            </div>
            {selectedDate ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estudiante</label>
                  <input type="text" placeholder="Buscar por nombre o cédula" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={busquedaEstudiante} onChange={handleBusquedaRapidaChange} />
                  <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" value={form.estudianteId} onChange={e => setForm({ ...form, estudianteId: e.target.value })}>
                    <option value="">Seleccionar</option>
                    {estudiantesFiltrados.map(est => <option key={est.id} value={est.id}>{est.nombre} ({est.id})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-sm font-medium text-gray-700">Hora</label><input type="time" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium text-gray-700">Duración (min)</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={form.duracion} onChange={e => setForm({ ...form, duracion: parseInt(e.target.value) })} min="15" step="15" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">Motivo</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" rows="2" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} /></div>
                <button onClick={handleCrearCitaDesdeCalendario} className="btn btn-primary w-full">Guardar cita</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estudiante</label>
                  <input type="text" placeholder="Buscar por nombre o cédula" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={busquedaEstudiante} onChange={handleBusquedaRapidaChange} />
                  <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" value={rapidaForm.estudianteId} onChange={e => setRapidaForm({ ...rapidaForm, estudianteId: e.target.value })}>
                    <option value="">Seleccionar</option>
                    {estudiantesFiltrados.map(est => <option key={est.id} value={est.id}>{est.nombre} ({est.id})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-sm font-medium text-gray-700">Fecha</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={rapidaForm.fecha} onChange={e => setRapidaForm({ ...rapidaForm, fecha: e.target.value })} /></div>
                  <div><label className="block text-sm font-medium text-gray-700">Hora</label><input type="time" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={rapidaForm.hora} onChange={e => setRapidaForm({ ...rapidaForm, hora: e.target.value })} /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">Duración (min)</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={rapidaForm.duracion} onChange={e => setRapidaForm({ ...rapidaForm, duracion: parseInt(e.target.value) })} min="15" step="15" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Motivo</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" rows="2" value={rapidaForm.motivo} onChange={e => setRapidaForm({ ...rapidaForm, motivo: e.target.value })} /></div>
                <button onClick={handleCrearCitaRapida} className="btn btn-primary w-full">Agendar cita</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de detalles de cita */}
      {showDetailsModal && citaSeleccionada && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowDetailsModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 p-5 animate-slideUp max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-teal-700">Detalles de la cita</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 rounded-full bg-gray-100"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <p><span className="font-semibold">Estudiante:</span> {citaSeleccionada.estudianteNombre} ({citaSeleccionada.estudianteId})</p>
              <p><span className="font-semibold">Fecha y hora:</span> {new Date(citaSeleccionada.fechaHora).toLocaleString()}</p>
              <p><span className="font-semibold">Duración:</span> {citaSeleccionada.duracionMinutos} min</p>
              <p><span className="font-semibold">Motivo:</span> {citaSeleccionada.motivo}</p>
              <p><span className="font-semibold">Estado:</span> 
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  citaSeleccionada.estado === 'PROGRAMADA' ? 'bg-green-100 text-green-800' :
                  citaSeleccionada.estado === 'CANCELADA' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>{citaSeleccionada.estado}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-5">
              {citaSeleccionada.solicitudCancelacion && (
                <>
                  <button onClick={handleAceptarCancelacion} className="btn btn-danger">Aceptar cancelación</button>
                  <button onClick={handleRechazarCancelacion} className="btn btn-secondary">Rechazar cancelación</button>
                </>
              )}
              {citaSeleccionada.solicitudReasignacion && (
                <>
                  <button onClick={handleAceptarReasignacion} className="btn btn-primary">Aceptar reasignación</button>
                  <button onClick={handleRechazarReasignacion} className="btn btn-secondary">Rechazar reasignación</button>
                </>
              )}
              {!citaSeleccionada.solicitudCancelacion && !citaSeleccionada.solicitudReasignacion && citaSeleccionada.estado === 'PROGRAMADA' && (
                <>
                  <button onClick={handleCancelarCitaDirecta} className="btn btn-danger">Cancelar cita</button>
                  <button onClick={handleReprogramarCitaDirecta} className="btn btn-primary">Reprogramar cita</button>
                  <button onClick={() => setShowDetailsModal(false)} className="btn btn-secondary">Cerrar</button>
                </>
              )}
              {!citaSeleccionada.solicitudCancelacion && !citaSeleccionada.solicitudReasignacion && citaSeleccionada.estado !== 'PROGRAMADA' && (
                <button onClick={() => setShowDetailsModal(false)} className="btn btn-secondary">Cerrar</button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};