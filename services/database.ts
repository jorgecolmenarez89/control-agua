import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

// Abrir o crear la base de datos
let db: SQLite.SQLiteDatabase | null = null;

const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    try {
      // Usar el directorio de documentos de la aplicación (ubicación persistente)
      // Esta ubicación es consistente tanto en debug como en release (APK)
      const dbPath = `${FileSystem.documentDirectory}control_agua.db`;
      
      // Abrir la base de datos usando la ruta absoluta
      // Esta ubicación es persistente y será la misma en debug y release
      db = SQLite.openDatabaseSync(dbPath);
      
      // Log solo en desarrollo para ayudar con la depuración
      if (__DEV__) {
        console.log('Base de datos abierta en:', dbPath);
      }
    } catch (error) {
      console.error('Error al abrir la base de datos:', error);
      throw error;
    }
  }
  return db;
};

export interface DatabaseResult {
  insertId?: number;
  rowsAffected: number;
  rows: {
    _array: any[];
    length: number;
    item: (index: number) => any;
  };
}

/**
 * Inicializa la base de datos y crea las tablas necesarias
 */
export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      
      // Tabla de usuarios
      database.execSync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          fullnames TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Tabla de información de empresa
      database.execSync(`
        CREATE TABLE IF NOT EXISTS empresa (
          id INTEGER PRIMARY KEY DEFAULT 1,
          name TEXT,
          rif TEXT,
          address TEXT,
          phone TEXT,
          email TEXT,
          website TEXT,
          description TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CHECK (id = 1)
        );
      `);

      // Insertar registro inicial de empresa si no existe
      try {
        const empresaExists = database.getAllSync('SELECT * FROM empresa WHERE id = 1');
        if (empresaExists.length === 0) {
          database.execSync(`
            INSERT INTO empresa (id, name) VALUES (1, 'Mi Empresa');
          `);
        }
      } catch (error) {
        // Ignorar error si ya existe
      }

      // Tabla de productos
      database.execSync(`
        CREATE TABLE IF NOT EXISTS productos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Tabla de tipos de pago
      database.execSync(`
        CREATE TABLE IF NOT EXISTS tipo_pago (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Insertar tipos de pago por defecto si no existen
      try {
        const tiposPago = database.getAllSync('SELECT * FROM tipo_pago');
        if (tiposPago.length === 0) {
          database.execSync(`
            INSERT INTO tipo_pago (name, description, active) VALUES
            ('Efectivo', 'Pago en efectivo', 1),
            ('Tarjeta', 'Pago con tarjeta', 1),
            ('Transferencia', 'Transferencia bancaria', 1),
            ('Pago Móvil', 'Pago móvil', 1);
          `);
        } else {
          // Verificar si "Pago Móvil" existe, si no, agregarlo
          const pagoMovil = database.getAllSync(
            "SELECT * FROM tipo_pago WHERE name = 'Pago Móvil'"
          );
          if (pagoMovil.length === 0) {
            database.execSync(`
              INSERT INTO tipo_pago (name, description, active) VALUES
              ('Pago Móvil', 'Pago móvil', 1);
            `);
          }
        }
      } catch (error) {
        console.error('Error al insertar tipos de pago por defecto:', error);
      }

      // Tabla de ventas
      database.execSync(`
        CREATE TABLE IF NOT EXISTS ventas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          price_real REAL NOT NULL,
          type_pago_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          total_price REAL NOT NULL,
          sale_date DATETIME,
          reference TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES productos(id),
          FOREIGN KEY (type_pago_id) REFERENCES tipo_pago(id)
        );
      `);

      // Migración: agregar campos si no existen (para tablas existentes)
      try {
        database.execSync(`
          ALTER TABLE ventas ADD COLUMN sale_date DATETIME;
        `);
      } catch (error) {
        // La columna ya existe, ignorar el error
      }
      try {
        database.execSync(`
          ALTER TABLE ventas ADD COLUMN reference TEXT;
        `);
      } catch (error) {
        // La columna ya existe, ignorar el error
      }

      // Ejemplo de tabla de registros de agua:
      database.execSync(`
        CREATE TABLE IF NOT EXISTS registros_agua (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cantidad REAL NOT NULL,
          fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER,
          notas TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      console.log('Base de datos inicializada correctamente');
      resolve();
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      reject(error);
    }
  });
};

/**
 * Ejecuta una consulta SQL
 */
export const executeQuery = (
  sql: string,
  params: any[] = []
): Promise<DatabaseResult> => {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        // Para consultas SELECT - usar getAllSync() directamente en la base de datos
        const rows = database.getAllSync(sql, params);
        
        resolve({
          insertId: undefined,
          rowsAffected: rows.length,
          rows: {
            _array: rows,
            length: rows.length,
            item: (index: number) => rows[index],
          },
        });
      } else {
        // Para INSERT, UPDATE, DELETE - usar runSync()
        const result = database.runSync(sql, params);
        
        resolve({
          insertId: result.lastInsertRowId ? Number(result.lastInsertRowId) : undefined,
          rowsAffected: result.changes || 0,
          rows: {
            _array: [],
            length: 0,
            item: () => null,
          },
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Ejecuta múltiples consultas en una transacción
 */
export const executeTransaction = (
  queries: Array<{ sql: string; params?: any[] }>
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      database.withTransactionSync(() => {
        queries.forEach(({ sql, params = [] }) => {
          const statement = database.prepareSync(sql);
          statement.executeSync(params);
          statement.finalizeSync();
        });
      });
      resolve();
    } catch (error) {
      console.error('Error en la transacción:', error);
      reject(error);
    }
  });
};

/**
 * Obtiene la ruta de la base de datos (útil para depuración)
 */
export const getDatabasePath = (): string => {
  return `${FileSystem.documentDirectory}control_agua.db`;
};

export default getDatabase;

