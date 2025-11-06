const config = require('../configs/config');
const { MongoClient, ObjectId } = require('mongodb');

class MongoDBClientRuta {
    constructor() {
        this.client = null;
        this.db = null;
        this.collection = null;
        this.uri = `mongodb+srv://${config.mongodb.user}:${config.mongodb.password}@${config.mongodb.host}/${config.mongodb.db}`;
        this.collectionName = 'rutas';
        console.log(this.uri);
    }

    // conectar y preparar colección
    async connect() {
        try {
            this.client = await MongoClient.connect(this.uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            this.db = this.client.db(config.mongodb.db);
            this.collection = this.db.collection(this.collectionName);
            console.info(`${new Date().toISOString()} [MongoDBClientRuta] Connected to MongoDB`);
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientRuta] MongoDB connection error:`, error);
            throw error;
        }
    }

    // insertar ruta
    async save(ruta) {
        console.info(`${new Date().toISOString()} [MongoDBClientRuta] [save] [START] Save [${JSON.stringify(ruta)}]`);
        try {
            if (!this.collection) await this.connect();
            const result = await this.collection.insertOne(ruta);
            console.info(`${new Date().toISOString()} [MongoDBClientRuta] [save] [END] Save successful`);
            // Devolver la ruta con el _id generado
            return {
                ...ruta,
                _id: result.insertedId
            };
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientRuta] [save] Error:`, error);
            throw error;
        }
    }

    // listar todas las rutas
    async findAll() {
        try {
            if (!this.collection) await this.connect();
            return await this.collection.find({}).toArray();
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientRuta] [findAll] Error:`, error);
            throw error;
        }
    }
    // Listar rutas del creador 
    async findByCreator({ uid, page = 1, limit = 20, q } = {}) {
        try {
            if (!uid) throw new Error('uid es requerido');
            if (!this.collection) await this.connect();

            const col = this.collection;

            const p = Math.max(1, Number(page));
            const l = Math.max(1, Number(limit));
            const skip = (p - 1) * l;

            const filter = { id_creador: uid };
            if (q && String(q).trim()) {
                const rx = new RegExp(String(q).trim(), 'i');
                Object.assign(filter, {
                    $or: [
                        { nombre_ruta: rx },
                        { descripcion: rx },
                        { tipo_deporte: rx },
                    ],
                });
            }

            const cursor = col
                .find(filter)
                .sort({ fecha_creacion: -1, _id: -1 })
                .skip(skip)
                .limit(l);

            const [items, total] = await Promise.all([
                cursor.toArray(),
                col.countDocuments(filter),
            ]);

            return { items, total, page: p, limit: l };
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientRuta] [findByCreator] Error:`, error);
            throw error;
        }
    }

    // Agregar/actualizar valoración y recalcular promedio
    async addValoracion({ rutaId, id_usuario, puntuacion, comentario }) {
        try {
            if (!this.collection) await this.connect();

            const _id = new ObjectId(rutaId);
            const now = new Date();

            // Objeto de valoración a insertar/sobrescribir
            const nuevaVal = {
                id_usuario,                    // string (o ObjectId si más adelante quieres)
                puntuacion: Number(puntuacion),// 1..5
                fecha: now
            };
            if (comentario && String(comentario).trim()) {
                nuevaVal.comentario = String(comentario).trim();
            }

            // Update con pipeline (MongoDB 4.2+): 
            // 1) Reemplaza la valoración del mismo usuario (si existe) por la nueva.
            // 2) Recalcula promedio_valoracion sobre todo el array.
            const result = await this.collection.updateOne(
                { _id },
                [
                    {
                        $set: {
                            valoraciones: {
                                $let: {
                                    vars: {
                                        base: { $ifNull: ["$valoraciones", []] }
                                    },
                                    in: {
                                        $concatArrays: [
                                            {
                                                // Filtra cualquier valoración previa del mismo usuario
                                                $filter: {
                                                    input: "$$base",
                                                    as: "v",
                                                    cond: { $ne: ["$$v.id_usuario", id_usuario] }
                                                }
                                            },
                                            [nuevaVal]
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    {
                        $set: {
                            promedio_valoracion: {
                                $cond: [
                                    { $gt: [{ $size: "$valoraciones" }, 0] },
                                    {
                                        $avg: {
                                            $map: {
                                                input: "$valoraciones",
                                                as: "v",
                                                in: "$$v.puntuacion"
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    }
                ]
            );

            if (result.matchedCount === 0) {
                const e = new Error("Ruta no encontrada");
                e.status = 404;
                throw e;
            }

            // Devuelve la ruta actualizada
            const updated = await this.collection.findOne({ _id });
            return updated;
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientRuta] [addValoracion] Error:`, error);
            throw error;
        }
    }

    async listValoraciones({ rutaId, page = 1, limit = 20 }) {
        try {
            if (!this.collection) await this.connect();
            const _id = new ObjectId(rutaId);

            const p = Math.max(1, Number(page));
            const l = Math.max(1, Number(limit));
            const skip = (p - 1) * l;

            const pipeline = [
                { $match: { _id } },
                { $project: { valoraciones: { $ifNull: ["$valoraciones", []] } } },
                { $unwind: { path: "$valoraciones", preserveNullAndEmptyArrays: false } },
                { $replaceRoot: { newRoot: "$valoraciones" } },

                // Buscamos en ambas colecciones posibles: 'users' (backend actual) y 'usuarios' (tu esquema)
                { $lookup: { from: "users", localField: "id_usuario", foreignField: "_id", as: "u1" } },
                { $lookup: { from: "usuarios", localField: "id_usuario", foreignField: "_id", as: "u2" } },
                { $addFields: { user: { $ifNull: [{ $arrayElemAt: ["$u1", 0] }, { $arrayElemAt: ["$u2", 0] }] } } },

                {
                    $project: {
                        _id: 0,
                        id_usuario: 1,
                        puntuacion: 1,
                        fecha: 1,
                        usuario: {
                            uid: "$user._id",
                            nombre: { $ifNull: ["$user.nombre", null] },
                            avatar: { $ifNull: ["$user.avatar", ""] }
                        }
                    }
                },
                { $sort: { fecha: -1 } },
                {
                    $facet: {
                        items: [{ $skip: skip }, { $limit: l }],
                        total: [{ $count: "count" }]
                    }
                }
            ];

            const [res] = await this.collection.aggregate(pipeline).toArray();
            const items = res?.items ?? [];
            const total = (res?.total?.[0]?.count) ?? 0;

            return { items, total, page: p, limit: l };
        } catch (error) {
            console.error(`${new Date().toISOString()} [MongoDBClientRuta] [listValoracionesEnriquecidas] Error:`, error);
            throw error;
        }
    }
    //Borrar ruta
  async deleteById({ rutaId, uid }) {
    try {
      if (!this.collection) await this.connect();

      const _id = new ObjectId(rutaId);

      // Solo elimina si el usuario es el creador
      const res = await this.collection.deleteOne({ _id, id_creador: uid });

      return res;
    } catch (error) {
      console.error(`${new Date().toISOString()} [MongoDBClientRuta] [deleteById] Error:`, error);
      throw error;
    }
  }
 async findPopular({ page = 1, limit = 20, minRatings = 1, top } = {}) {
  try {
    if (!this.collection) await this.connect();

    const p = 1; // si viene "top", ignoramos paginado clásico
    const l = top ? Math.max(1, Number(top)) : Math.max(1, Number(limit));
    const min = Math.max(1, Number(minRatings));

    const pipeline = [
      // ✅ Solo rutas con al menos 1 valoración (descarta [] y campo inexistente)
      { $match: { "valoraciones.0": { $exists: true } } },

      // cuenta valoraciones
      { $addFields: { ratingCount: { $size: { $ifNull: ["$valoraciones", []] } } } },

      // exige mínimo N valoraciones
      { $match: { ratingCount: { $gte: min } } },

      // descarta promedios 0
      { $match: { promedio_valoracion: { $gt: 0 } } },

      // orden: mejor promedio → más votos → más nueva
      { $sort: { promedio_valoracion: -1, ratingCount: -1, fecha_creacion: -1, _id: -1 } },

      // si pides "top", cortamos directo; si no, dejamos facet para paginado
      ...(top
        ? [{ $limit: l }]
        : [
            {
              $facet: {
                data: [{ $skip: (Math.max(1, Number(page)) - 1) * l }, { $limit: l }],
                total: [{ $count: "count" }],
              }
            },
            {
              $project: {
                data: 1,
                total: 1,
                page: { $literal: Math.max(1, Number(page)) },
                limit: { $literal: l },
                totalPages: {
                  $cond: [
                    { $gt: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
                    { $ceil: { $divide: [{ $arrayElemAt: ["$total.count", 0] }, l] } },
                    1
                  ]
                }
              }
            }
          ]),
    ];

    if (top) {
      // respuesta simple: arreglo y metadatos mínimos
      const data = await this.collection.aggregate(pipeline).toArray();
      return { data, page: 1, limit: l, total: data.length, totalPages: 1 };
    } else {
      const [res] = await this.collection.aggregate(pipeline).toArray();
      const data = res?.data ?? [];
      const total = res?.total?.[0]?.count ?? 0;
      return { data, page: res?.page ?? 1, limit: l, total, totalPages: res?.totalPages ?? 1 };
    }
  } catch (error) {
    console.error(`${new Date().toISOString()} [MongoDBClientRuta] [findPopular] Error:`, error);
    throw error;
  }
}

}
module.exports = MongoDBClientRuta;
