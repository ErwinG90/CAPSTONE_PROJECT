class ParametersError extends Error {
  constructor(campo = '', mensaje = '') {
    super('Parametros invalidos');
    this.detalles = [{ campo, mensaje }];
  }
  static fromDetalles(detalles = []) {
    const error = new ParametersError();
    error.detalles = detalles;
    return error;
  }
}

module.exports = ParametersError;