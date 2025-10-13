class BusinessError extends Error {
  constructor(codigo = '', mensaje = '') {
    super(mensaje);
    this.codigo = codigo;
    this.mensaje = mensaje;
    this.name = 'BusinessError';
  }
}

module.exports = BusinessError;