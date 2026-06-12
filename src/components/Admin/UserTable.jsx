import { Button } from '../ui/button'

export const UserTable = ({ users, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">ID</th>
            <th className="px-4 py-2 border">Nombre</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Rol</th>
            <th className="px-4 py-2 border">Teléfono</th>
            <th className="px-4 py-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="px-4 py-2 border">{user.id}</td>
              <td className="px-4 py-2 border">{user.nombre}</td>
              <td className="px-4 py-2 border">{user.email}</td>
              <td className="px-4 py-2 border">{user.rol}</td>
              <td className="px-4 py-2 border">{user.telefono}</td>
              <td className="px-4 py-2 border">
                <div className="flex gap-2">
                  <Button onClick={() => onEdit(user)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 text-sm">
                    Editar
                  </Button>
                  <Button onClick={() => onDelete(user.id)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-sm">
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}