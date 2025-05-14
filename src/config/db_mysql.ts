import { createConnection, Connection, ConnectionOptions } from 'mysql2/promise'

class MySQLConnector {
    private connection: Connection | null = null

    connect = async (): Promise<void> => {
        const access: ConnectionOptions = {
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB
        }
        this.connection = await createConnection(access)
        console.log('MySQL: connection established')
    }

    query = async (sql: string, values?: any[]): Promise<any> => {
        if (!this.connection) throw new Error('MySQL: Error connection database')
        const [results] = await this.connection.execute(sql, values)
        return results
    }

    close = async (): Promise<void> => {
        if (this.connection) {
            await this.connection.end()
            console.log('MySQL: connection closed')
        }
    }
}

export const db = new MySQLConnector()
