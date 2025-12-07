const ParametersError = require('../errors/ParametersError');
const UserDTO = require('../dtos/UserDTO');
const UserService = require('../services/UserService')
const UserMapper = require('../mappers/UserMapper')

class UserController {

    async save(req, res, next) {
        try {
            console.info(`${new Date().toISOString()} [UserController] [save] [START] Save`);

            const data = req.body || {};

            // NEW: si no vienen, setear por defecto
            const userDTO = new UserDTO(
                data.uid,
                data.nombre,
                data.apellido,
                data.email,
                data.fechaNacimiento,
                data.genero,
                data.deporteFavorito,
                data.nivelExperiencia,
                data.fechaRegistro,              // opcional: seguirá cayendo default en el mapper
                Array.isArray(data.rutas) ? data.rutas : [],
                Array.isArray(data.eventos) ? data.eventos : [],
                typeof data.avatar === 'string' ? data.avatar : ""
            );

            const userService = new UserService();
            const userMapper = new UserMapper();

            await userService.save(userMapper.toDomain(userDTO));

            console.info(`${new Date().toISOString()} [UserController] [save] [END] Save`);
            res.status(201).send();
        } catch (error) {
            next(error);
        }
    }

    async findAll(req, res, next) {
        try {
            const userService = new UserService();
            const users = await userService.findAll();
            const userMapper = new UserMapper();

            const usersDTO = users.map(user => userMapper.toDTO(user));
            res.status(200).json(usersDTO);
        } catch (error) {
            next(error);
        }
    }

    async findByUid(req, res, next) {
        try {
            const { uid } = req.params;
            if (!uid || typeof uid !== 'string' || uid.trim() === '') {
                throw new ParametersError('El parámetro uid es requerido.');
            }

            const userService = new UserService();
            const user = await userService.findByUid(uid);

            if (!user) {
                return res.status(404).json({ message: `Usuario con uid ${uid} no encontrado` });
            }

            const userMapper = new UserMapper();
            const dto = userMapper.toDTO(user);
            return res.status(200).json(dto);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { uid } = req.params;
            const data = req.body || {};

            // No permitir estos campos
            const forbidden = [];
            if (Object.prototype.hasOwnProperty.call(data, 'uid')) forbidden.push('uid');
            if (Object.prototype.hasOwnProperty.call(data, 'email')) forbidden.push('email');
            if (Object.prototype.hasOwnProperty.call(data, 'fechaRegistro')) forbidden.push('fechaRegistro');

            if (forbidden.length) {
                return res.status(400).json({
                    message: `No se permite modificar: ${forbidden.join(', ')}`
                });
            }

            // NEW: permitir actualización segura de avatar/rutas/eventos + campos previos
            const allowedUpdate = {
                nombre: data.nombre,
                apellido: data.apellido,
                fechaNacimiento: data.fechaNacimiento,
                genero: data.genero,
                deporteFavorito: data.deporteFavorito,
                nivelExperiencia: data.nivelExperiencia,
                avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
                rutas: Array.isArray(data.rutas) ? data.rutas : undefined,
                eventos: Array.isArray(data.eventos) ? data.eventos : undefined,
            };

            // Elimina undefined para no sobreescribir con vacío
            Object.keys(allowedUpdate).forEach(
                (k) => allowedUpdate[k] === undefined && delete allowedUpdate[k]
            );

            const userService = new UserService();
            const updated = await userService.update(uid, allowedUpdate);

            if (!updated) {
                return res.status(404).json({ message: `Usuario ${uid} no encontrado` });
            }

            const userMapper = new UserMapper();
            return res.status(200).json(userMapper.toDTO(updated));
        } catch (error) {
            next(error);
        }
    }

    // === NUEVO === actualizar expoPushToken y preferencias de notificaciones
    async updatePushToken(req, res, next) {
        try {
            const { uid } = req.params;
            const { expoPushToken, notifications } = req.body || {};

            if (!uid) {
                return res.status(400).json({ message: "uid requerido" });
            }

            const partial = {};

            if (expoPushToken) partial.expoPushToken = expoPushToken;
            if (notifications) partial.notifications = notifications;

            const userService = new UserService();
            const updated = await userService.update(uid, partial);

            if (!updated) {
                return res.status(404).json({ message: `Usuario ${uid} no encontrado` });
            }

            return res.status(200).json({ message: "Push token actualizado" });

        } catch (error) {
            next(error);
        }
    }
}




module.exports = UserController;
