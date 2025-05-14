/* eslint-disable camelcase */
import { db } from '../config/db_mysql'

/**
 * Functions controller to getAllItems
 */

export const dataMySQL = async () => {
  try {
    await db.connect()
    const queryItems = 'SELECT * FROM items'
    /**
     * queryItems: query to get all items of diferents tables
     * use union to get all items of diferents tables
     */
    const users = await db.query(queryItems)
    return users
  } catch (error) {
    console.error('Error dataMySQL:', error)
  } finally {
    await db.close()
  }
}

export const validateStock = async (source_api: string, item: any) => {
  try {
    return true
    await db.connect()
    const queryItems = 'SELECT * FROM items WHERE item = ?'
    const users = await db.query(queryItems, [item])
    return users
  } catch (error) {
    console.error('Error dataMySQL:', error)
  } finally {
    await db.close()
  }
}

export const updateStock = async (item: any, quantity: number) => {
  try {
    await db.connect()
    const queryItems = 'UPDATE items SET stockitem = stockitem - ? WHERE item = ?'
    const users = await db.query(queryItems, [quantity, item])
    return users
  } catch (error) {
    console.error('Error dataMySQL:', error)
  } finally {
    await db.close()
  }
}
