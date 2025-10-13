const ParametersError = require('../errors/ParametersError');
const BusinessError = require('../errors/BusinessError');
const ServerError = require('../errors/ServerError');

const errorMiddleware = (err, req, res, next) => {
    let statusCode = 500;
    let responseBody = { codigo: '500', mensaje: 'Ha ocurrido un error interno' };

    console.error(`${new Date().toISOString()} [ErrorMiddleware] [handleError] [ERROR] [${err.message}]`);
    
    switch (err.constructor) {
        case ParametersError:
            statusCode = 400;
            responseBody = { detalles: err.detalles };
            break;
        case BusinessError:
            statusCode = 409;
            responseBody = { codigo: err.codigo, mensaje: err.mensaje };
            break;
        case ServerError:
            responseBody = { codigo: err.codigo, mensaje: err.mensaje };
            break;
        default:
            break;
    }

    res.status(statusCode).json(responseBody);
};

module.exports = errorMiddleware;