const swaggerUi = require('swagger-ui-express');
const server = require('./configs/server');
const config = require('./configs/config');

const requestLoggerMiddleware = require('./middlewares/request-logger.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

server.use(config.server.context + config.swagger.endpoint, swaggerUi.serve, swaggerUi.setup(config.swagger.document, config.swagger.uiOptions));

server.use(requestLoggerMiddleware);

// locations routes
// ms-rutafit-neg/locations --> LocationRoute.js
server.use(config.server.context + config.routes.locations, require('./routes/LocationRoute'));

// users routes
// ms-rutafit-neg/users --> + UserRoute.js
server.use(config.server.context + config.routes.users, require('./routes/UserRoute'));

// nivel experiencia routes
// ms-rutafit-neg/nivel-experiencia --> nivelExperienciaRoutes.js
server.use(config.server.context + config.routes.nivelExperiencia, require('./routes/nivelExperienciaRoutes'));

// tipos deporte routes  
// ms-rutafit-neg/tipos-deporte --> tipoDeporteRoutes.js
server.use(config.server.context + config.routes.tiposDeporte, require('./routes/tipoDeporteRoutes'));

// eventos routes
// ms-rutafit-neg/eventos --> eventoRoutes.js
server.use(config.server.context + config.routes.eventos, require('./routes/eventoRoutes'));

server.use(errorMiddleware);

module.exports = server;