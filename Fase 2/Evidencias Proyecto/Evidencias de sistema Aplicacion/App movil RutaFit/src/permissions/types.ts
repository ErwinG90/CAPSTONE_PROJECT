export enum PermissionStatus {
  CHECKING = "CHECKING",     // Estado inicial mientras consultas
  GRANTED = "GRANTED",       // El permiso fue concedido
  DENIED = "DENIED",         // El usuario lo negó, pero aún puedes volver a pedir
  BLOCKED = "BLOCKED",       // El usuario lo negó y marcó "No volver a preguntar" (canAskAgain = false)
  UNDETERMINED = "UNDETERMINED", // Aún no se preguntó nunca
}
