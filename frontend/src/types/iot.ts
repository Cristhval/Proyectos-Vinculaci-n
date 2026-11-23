/** Módulo 2: dispositivos IoT (ESP32 + DHT11 + MQ-135). */

export type EstadoConexion = 'EN_LINEA' | 'SIN_CONEXION' | 'PENDIENTE'

export interface Dispositivo {
  id: number
  identificador: string
  nombre: string
  descripcion: string
  proyecto: number
  mide_temperatura: boolean
  mide_humedad: boolean
  mide_co2: boolean
  activo: boolean
  fecha_registro: string
  fecha_baja: string | null
  ultima_lectura: string | null
  estado_conexion: EstadoConexion
  estado_conexion_display: string
}

export interface RegistrarDispositivoDatos {
  identificador: string
  nombre: string
  descripcion?: string
  mide_temperatura: boolean
  mide_humedad: boolean
  mide_co2: boolean
}

export interface EditarDispositivoDatos {
  nombre?: string
  descripcion?: string
}

/** Respuesta de registrar y de regenerar: la única vez que llega el token en texto plano. */
export interface RespuestaConToken {
  dispositivo: Dispositivo
  token: string
  aviso: string
}
