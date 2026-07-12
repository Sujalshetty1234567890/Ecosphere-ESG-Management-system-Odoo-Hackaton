import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

export interface MysqlStatus {
  enabled: boolean;
  connected: boolean;
  imported: boolean;
  message: string;
}

function getMysqlConfig() {
  const host = process.env.MYSQL_HOST || process.env.DB_HOST;
  const user = process.env.MYSQL_USER || process.env.DB_USER;
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME;
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);

  if (!host || !user || !database) {
    return null;
  }

  return {
    host,
    port,
    user,
    password: password || '',
    database,
  };
}

function normalizeDumpPath(): string {
  return process.env.MYSQL_DUMP_PATH || path.resolve(process.cwd(), 'dump.sql');
}

export async function initializeMySqlFromDump(): Promise<MysqlStatus> {
  const config = getMysqlConfig();
  if (!config) {
    return {
      enabled: false,
      connected: false,
      imported: false,
      message: 'MySQL is not configured. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.',
    };
  }

  const dumpPath = normalizeDumpPath();
  if (!fs.existsSync(dumpPath)) {
    return {
      enabled: true,
      connected: false,
      imported: false,
      message: `MySQL is configured, but the SQL dump was not found at ${dumpPath}.`,
    };
  }

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await connection.query(`USE \`${config.database}\``);

    const sql = fs.readFileSync(dumpPath, 'utf8').trim();
    if (!sql) {
      return {
        enabled: true,
        connected: true,
        imported: false,
        message: 'MySQL connection is active, but the SQL dump is empty.',
      };
    }

    await connection.query(sql);
    return {
      enabled: true,
      connected: true,
      imported: true,
      message: `MySQL import completed from ${path.basename(dumpPath)}.`,
    };
  } catch (error: any) {
    return {
      enabled: true,
      connected: true,
      imported: false,
      message: `MySQL import failed: ${error.message}`,
    };
  } finally {
    await connection.end();
  }
}

export async function testMysqlConnection(): Promise<MysqlStatus> {
  const config = getMysqlConfig();
  if (!config) {
    return {
      enabled: false,
      connected: false,
      imported: false,
      message: 'MySQL settings are missing.',
    };
  }

  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  try {
    await connection.query('SELECT 1 + 1 AS result');
    return {
      enabled: true,
      connected: true,
      imported: false,
      message: 'MySQL connection successful.',
    };
  } catch (error: any) {
    return {
      enabled: true,
      connected: false,
      imported: false,
      message: `MySQL connection failed: ${error.message}`,
    };
  } finally {
    await connection.end();
  }
}
