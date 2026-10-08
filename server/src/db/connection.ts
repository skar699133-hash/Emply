import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { config } from '../config.js';
import path from 'path';
import fs from 'fs';

interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

class Database {
  private pglite: PGlite | null = null;
  private pgPool: pg.Pool | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    if (config.databaseUrl) {
      console.log('Connecting to external PostgreSQL via DATABASE_URL...');
      this.pgPool = new pg.Pool({
        connectionString: config.databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      // Test connection
      const client = await this.pgPool.connect();
      client.release();
      console.log('Connected to PostgreSQL successfully.');
    } else {
      console.log(`Initializing embedded PostgreSQL (PGlite) in: ${config.pgliteDataDir}`);
      const dirPath = path.resolve(config.pgliteDataDir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      this.pglite = new PGlite(dirPath);
      await this.pglite.waitReady;
      console.log('PGlite PostgreSQL engine is ready.');
    }

    this.initialized = true;
  }

  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      if (this.pgPool) {
        const res = await this.pgPool.query(text, params);
        return {
          rows: res.rows as T[],
          rowCount: res.rowCount ?? res.rows.length,
        };
      } else if (this.pglite) {
        const res = await this.pglite.query(text, params);
        return {
          rows: (res.rows || []) as T[],
          rowCount: (res.rows || []).length,
        };
      }
      throw new Error('Database engine not initialized');
    } catch (error) {
      console.error('Database query error:', { text, params, error });
      throw error;
    }
  }

  async exec(sql: string): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }

    if (this.pgPool) {
      await this.pgPool.query(sql);
    } else if (this.pglite) {
      await this.pglite.exec(sql);
    }
  }
}

export const db = new Database();
