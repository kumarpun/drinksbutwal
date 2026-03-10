import { query } from "./db.js";

// Global sync cache survives across requests within the same serverless invocation
if (!globalThis.__modelSyncCache) globalThis.__modelSyncCache = {};

export class Model {
  constructor(tableName, schema) {
    this.tableName = tableName;
    this.schema = schema;
  }

  // Generate CREATE TABLE SQL from schema
  getCreateTableSQL() {
    const columns = ["id INT AUTO_INCREMENT PRIMARY KEY"];

    for (const [field, config] of Object.entries(this.schema)) {
      let column = `${field} ${config.type}`;

      if (config.required) {
        column += " NOT NULL";
      }

      if (config.unique) {
        column += " UNIQUE";
      }

      if (config.default !== undefined) {
        if (config.default === null) {
          column += " DEFAULT NULL";
        } else if (typeof config.default === "boolean") {
          column += ` DEFAULT ${config.default ? "TRUE" : "FALSE"}`;
        } else if (typeof config.default === "string") {
          column += ` DEFAULT '${config.default}'`;
        } else {
          column += ` DEFAULT ${config.default}`;
        }
      }

      columns.push(column);
    }

    // Add timestamps
    columns.push("created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    columns.push(
      "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    );

    return `CREATE TABLE IF NOT EXISTS ${this.tableName} (${columns.join(", ")})`;
  }

  // Sync table (create if not exists, add missing columns)
  // Uses globalThis cache so sync only runs once per server process, not per request
  async sync() {
    const cache = globalThis.__modelSyncCache;
    if (cache[this.tableName]) return { success: true, message: `Table ${this.tableName} already synced` };

    // If another request is already syncing this table, wait for it
    if (cache[`_syncing_${this.tableName}`]) {
      await cache[`_syncing_${this.tableName}`];
      return { success: true, message: `Table ${this.tableName} already synced` };
    }

    cache[`_syncing_${this.tableName}`] = (async () => {
      const sql = this.getCreateTableSQL();
      await query(sql);

      const rows = await query(`SHOW COLUMNS FROM ${this.tableName}`);
      const existingColumns = new Set(rows.map((r) => r.Field));

      const columnTypes = {};
      for (const row of rows) {
        columnTypes[row.Field] = row.Type;
      }

      for (const [field, config] of Object.entries(this.schema)) {
        if (!existingColumns.has(field)) {
          let colDef = `${field} ${config.type}`;
          if (config.default !== undefined) {
            if (config.default === null) {
              colDef += " DEFAULT NULL";
            } else if (typeof config.default === "boolean") {
              colDef += ` DEFAULT ${config.default ? "TRUE" : "FALSE"}`;
            } else if (typeof config.default === "string") {
              colDef += ` DEFAULT '${config.default}'`;
            } else {
              colDef += ` DEFAULT ${config.default}`;
            }
          }
          await query(`ALTER TABLE ${this.tableName} ADD COLUMN ${colDef}`);
        } else if (config.type.toUpperCase().startsWith("ENUM")) {
          const currentType = (columnTypes[field] || "").toLowerCase();
          const schemaType = config.type.toLowerCase();
          if (currentType && currentType !== schemaType) {
            let colDef = `${field} ${config.type}`;
            if (config.default !== undefined && typeof config.default === "string") {
              colDef += ` DEFAULT '${config.default}'`;
            }
            await query(`ALTER TABLE ${this.tableName} MODIFY COLUMN ${colDef}`);
          }
        }
      }

      cache[this.tableName] = true;
      delete cache[`_syncing_${this.tableName}`];
    })();

    await cache[`_syncing_${this.tableName}`];
    return { success: true, message: `Table ${this.tableName} synced` };
  }

  // Find all records
  async findAll(conditions = {}) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const where = Object.entries(conditions)
        .map(([key, value]) => {
          params.push(value);
          return `${key} = ?`;
        })
        .join(" AND ");
      sql += ` WHERE ${where}`;
    }

    return await query(sql, params);
  }

  // Find one record
  async findOne(conditions) {
    const results = await this.findAll(conditions);
    return results[0] || null;
  }

  // Find by ID
  async findById(id) {
    return await this.findOne({ id });
  }

  // Create a new record
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => "?").join(", ");

    const sql = `INSERT INTO ${this.tableName} (${fields.join(", ")}) VALUES (${placeholders})`;
    const result = await query(sql, values);

    return { id: result.insertId, ...data };
  }

  // Update a record
  async update(id, data) {
    const fields = Object.entries(data)
      .map(([key]) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(data), id];

    const sql = `UPDATE ${this.tableName} SET ${fields} WHERE id = ?`;
    await query(sql, values);

    return await this.findById(id);
  }

  // Delete a record
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await query(sql, [id]);
    return { success: true };
  }

  // Count records
  async count(conditions = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const where = Object.entries(conditions)
        .map(([key, value]) => {
          params.push(value);
          return `${key} = ?`;
        })
        .join(" AND ");
      sql += ` WHERE ${where}`;
    }

    const result = await query(sql, params);
    return result[0].count;
  }
}
