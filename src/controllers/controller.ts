import { Request, Response } from 'express'
import { dataMySQL, validateStock } from './getData'
import { standardizationUnificationData } from './normalizationData'
import redisClient from '../config/db_redis'
import crypto from 'crypto';
const MAIN_REDIS_KEY = 'redis'

export const getAllItems = async (req: Request, res: Response) => {
    try {
        console.log('inicio getallitems')
        console.log("PING:", await redisClient.ping())
        console.log('Validar conexion: ', await redisClient.status)

        const key = await redisClient.exists(MAIN_REDIS_KEY)
        if (!key) {
            console.log('Redis key not exist, fetching from populate()')
            await populate()
        }

        const items = await redisClient.hgetall(MAIN_REDIS_KEY)
        console.log('items', items)
        if (Object.keys(items).length === 0) {
            console.log('No items in cache, fetching from populate()')
            await populate()
        }

        const cleanData = Object.values(items).map(str => JSON.parse(str))
        if (cleanData.length === 0) {
            console.log('Cache redis: empty')
        } else {
            console.log('Cache redis send')
        }

        res.json(cleanData)
    } catch (error) {
        console.error(error)
    }
}

export const populateHandler = async (_req: Request, res: Response) => {
    try {
        await populate()
        res.status(200).json({ message: 'Redis cache populated' })
    } catch (error) {
        res.status(500).json({ error: 'Error populating cache' })
    }
}

export const populate = async () => {
    try {
        console.log('populate() start')
        //console.log('Validar conexion: ', await redisClient.status)

        const items = await fetchItemsFromDB()
        if (!items) throw new Error('populate() : No items returned from database ')

        const pipeline = redisClient.multi()
        pipeline.del(MAIN_REDIS_KEY)

        items.forEach(item => {
            const key = item.serial_number
            pipeline.hset(MAIN_REDIS_KEY, key, JSON.stringify(item))
        })
        pipeline.expire(MAIN_REDIS_KEY, 60 * 60)

        const results = await pipeline.exec();
        console.log("Resultados del pipeline:", results);
        console.log(`populate() completed: ${items.length} items en cache.`)
    } catch (error) {
        console.error('Error al poblar Redis:', error)
    }
}

export const fetchItemsFromDB = async () => {
    try {
        console.log('getAllItemsDB() start: Get data from database')
        const dataMysql = await dataMySQL()
        // const dataPostgres = await dataPostgress() // Ampliacion de datos
        const unifiedData = await standardizationUnificationData(dataMysql)
        console.log('getAllItemsDB() completed')
        return unifiedData
    } catch (error) {
        console.error(error)
    }
}

// Proceso de Compra(Block + Update atómico)
export const purchase = async (req: Request, res: Response) => {
    console.log(' Check stock and block items')
    console.log(req.body)
    const items = req.body

    const lockId = crypto.randomUUID()
    console.log('items', items)
    if (!items || !Array.isArray(items)) {
        res.status(400).json({ error: 'Invalid or empty items' })
    }
    interface Data {
        iditem: string,
        success?: boolean,
        error?: string
    }
    try {
        const list = await Promise.all(items.map(async ({ source_api, iditem, quantity }: { source_api: string, iditem: string, quantity: number }) => {
            const lockKey = `lock:${iditem}`
            const itemKey = `${MAIN_REDIS_KEY}:${iditem}`
            const result: Data = { iditem }

            // Intentar bloquear el ítem
            const locked = await redisClient.set(lockKey, lockId, 'EX', 15, 'NX')
            if (!locked) {
                result.success = false
                result.error = 'Item bloqueado'
                return result
            }
            const stockDoc = await validateStock(source_api, iditem)
            const currentStock = stockDoc
            if (currentStock < quantity) {
                await redisClient.del(lockKey)
                // Luego de desbloquear, enviar correo de alerta endpoint
                // enviar al apirest correspondiente o crear un registro de solicitud para generar stock
                result.success = false
                result.error = 'Stock insuficiente. Enviar un correo de alerta'
                return result
            }

            // Actualizar bases de datos primero
            const newStock = currentStock - quantity
            await Promise.all([
                // mysqlPool.query('UPDATE items SET stockitem = ? WHERE iditem = ?', [newStock, iditem])
            ])

            // // Liberar el lock
            const freelock = await redisClient.del(lockKey)
            console.log('freelock', freelock)

            // Si la consistencia es crítica (ej: stock muy demandado), mantener la cola + worker es mejor, asegurando su ejecución continua.   
            // const startWorker = await redisClient.rpush('stock_update_queue', JSON.stringify({ iditem, stockitem: newStock }))
            // console.log('startWorker', startWorker)

            const current = await redisClient.hget(itemKey, iditem)
            const parsed = current ? JSON.parse(current) : {}
            parsed.stockitem = newStock
            await redisClient.hset(MAIN_REDIS_KEY, iditem, JSON.stringify(parsed))

            result.success = true
            return result
        }))

        res.json({ message: 'Compra exitosa', list })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error en el proceso de compra' })
    }
}

const startWorker = async () => {
    console.log('Worker started')
    while (true) {
        console.log('Worker waiting for update')
        const update = await redisClient.blpop('stock_update_queue', 0)
        console.log('Worker received update')
        if (update && Array.isArray(update)) {
            const [, raw] = update
            const { iditem, stockitem } = JSON.parse(raw)

            const current = await redisClient.hget(MAIN_REDIS_KEY, iditem)
            const parsed = current ? JSON.parse(current) : {}
            parsed.stockitem = stockitem
            await redisClient.hset(MAIN_REDIS_KEY, iditem, JSON.stringify(parsed))
        }
    }
}
// startWorker()

/**
 * Programar populate diario a las 2 AM
import cron from 'node-cron'
cron.schedule('0 2 * * *', async () => {
  console.log('Ejecutando populate automático...')
  await fetch('http://localhost:${PORT}/populate')
})
*/
