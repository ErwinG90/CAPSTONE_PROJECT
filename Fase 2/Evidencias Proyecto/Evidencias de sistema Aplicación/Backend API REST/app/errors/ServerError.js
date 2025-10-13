class ServerError extends Error {
  constructor(codigo = '500', mensaje = 'Ha ocurrido un error interno') {
    super(mensaje);
    this.codigo = codigo;
    this.mensaje = mensaje;
    this.name = 'ServerError';
  }
}

module.exports = ServerError;