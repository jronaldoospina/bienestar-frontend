import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export const UsuarioForm = ({ initialData, onSubmit, onCancel, rolesDisponibles }) => {
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    rol: 'ESTUDIANTE',
    especialidad: '',
    duracionCitaMinutos: 60
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        nombre: initialData.nombre || '',
        email: initialData.email || '',
        telefono: initialData.telefono || '',
        password: '',
        rol: initialData.rol || 'ESTUDIANTE',
        especialidad: initialData.especialidad || '',
        duracionCitaMinutos: initialData.duracionCitaMinutos || 60
      })
    }
  }, [initialData])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Cédula / ID</Label>
        <Input
          name="id"
          value={formData.id}
          onChange={handleChange}
          required
          disabled={!!initialData}
        />
      </div>
      <div>
        <Label>Nombre completo</Label>
        <Input
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label>Correo electrónico (@unicesar.edu.co)</Label>
        <Input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label>Teléfono</Label>
        <Input
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label>Contraseña</Label>
        <Input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required={!initialData}
          placeholder={initialData ? 'Dejar en blanco para no cambiar' : ''}
        />
      </div>
      <div>
        <Label>Rol</Label>
        <select
          name="rol"
          value={formData.rol}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        >
          {rolesDisponibles.map(rol => (
            <option key={rol} value={rol}>{rol}</option>
          ))}
        </select>
      </div>

      {formData.rol === 'PSICOLOGO' && (
        <>
          <div>
            <Label>Especialidad</Label>
            <Input
              name="especialidad"
              value={formData.especialidad}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Duración de la cita (minutos)</Label>
            <Input
              name="duracionCitaMinutos"
              type="number"
              value={formData.duracionCitaMinutos}
              onChange={handleChange}
              required
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}