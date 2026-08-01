const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function readEnv(filePath) {
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.replace(/^\uFEFF/, "");
    const match = line.match(/^([^#=\s]+)=(.*)$/);
    if (match) env[match[1].replace(/^\uFEFF/, "").trim()] = match[2].trim();
  }
  return env;
}

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.execute(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function migrate(root) {
  const env = readEnv(path.join(root, ".env.local"));
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: false,
  });

  try {
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS booth (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        booth_number VARCHAR(80) NOT NULL,
        booth_size VARCHAR(80) NULL,
        booth_dimensions VARCHAR(120) NULL,
        booth_category VARCHAR(120) NULL,
        hall VARCHAR(120) NULL,
        location_zone VARCHAR(120) NULL,
        status ENUM('available', 'inactive') NOT NULL DEFAULT 'available',
        notes TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_booth_number (booth_number),
        KEY idx_booth_status (status),
        KEY idx_booth_category (booth_category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );

    if (await columnExists(connection, "rental_booths", "booth_number")) {
      await connection.execute(
        `INSERT INTO booth (booth_number, booth_size, booth_dimensions, status)
          SELECT UPPER(TRIM(rb.booth_number)),
                 REPLACE(MAX(rb.booth_size), '?', ''),
                 REPLACE(MAX(rb.booth_size), '?', ''),
                 'available'
            FROM rental_booths rb
           WHERE rb.booth_number IS NOT NULL
             AND TRIM(rb.booth_number) <> ''
           GROUP BY UPPER(TRIM(rb.booth_number))
          ON DUPLICATE KEY UPDATE
            booth_size = REPLACE(COALESCE(booth.booth_size, VALUES(booth_size)), '?', ''),
            booth_dimensions = COALESCE(booth.booth_dimensions, VALUES(booth_dimensions))`,
      );
    }

    await connection.execute("DROP TABLE IF EXISTS rental_booths_next");
    await connection.execute(
      `CREATE TABLE rental_booths_next (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        rental_contract_id BIGINT UNSIGNED NOT NULL,
        booth_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_rental_booths_booth (booth_id),
        UNIQUE KEY uq_rental_booths_contract_booth (rental_contract_id, booth_id),
        KEY idx_rental_booths_contract (rental_contract_id),
        CONSTRAINT fk_rental_booths_contract_new
          FOREIGN KEY (rental_contract_id) REFERENCES rental_contracts(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_rental_booths_booth_new
          FOREIGN KEY (booth_id) REFERENCES booth(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );

    if (await columnExists(connection, "rental_booths", "booth_id")) {
      await connection.execute(
        `INSERT IGNORE INTO rental_booths_next (rental_contract_id, booth_id, created_at)
          SELECT rb.rental_contract_id, rb.booth_id, COALESCE(rb.created_at, CURRENT_TIMESTAMP)
            FROM rental_booths rb
            JOIN rental_contracts rc ON rc.id = rb.rental_contract_id
            JOIN booth b ON b.id = rb.booth_id
           WHERE COALESCE(rc.status, 'draft') <> 'cancelled'`,
      );
    } else if (await columnExists(connection, "rental_booths", "booth_number")) {
      await connection.execute(
        `INSERT IGNORE INTO rental_booths_next (rental_contract_id, booth_id, created_at)
          SELECT rb.rental_contract_id, b.id, COALESCE(rb.created_at, CURRENT_TIMESTAMP)
            FROM rental_booths rb
            JOIN booth b ON b.booth_number = UPPER(TRIM(rb.booth_number))
            JOIN rental_contracts rc ON rc.id = rb.rental_contract_id
           WHERE rb.rental_contract_id IS NOT NULL
             AND rb.booth_number IS NOT NULL
             AND TRIM(rb.booth_number) <> ''
             AND COALESCE(rc.status, 'draft') <> 'cancelled'`,
      );
    }

    await connection.execute(
      `INSERT INTO booth (booth_number, booth_size, booth_dimensions, status)
        SELECT UPPER(TRIM(rc.booth_number)),
               REPLACE(MAX(rc.booth_size), '?', ''),
               REPLACE(MAX(rc.booth_size), '?', ''),
               'available'
          FROM rental_contracts rc
         WHERE rc.booth_number IS NOT NULL
           AND TRIM(rc.booth_number) <> ''
         GROUP BY UPPER(TRIM(rc.booth_number))
        ON DUPLICATE KEY UPDATE
          booth_size = REPLACE(COALESCE(booth.booth_size, VALUES(booth_size)), '?', ''),
          booth_dimensions = COALESCE(booth.booth_dimensions, VALUES(booth_dimensions))`,
    );

    await connection.execute(
      `INSERT IGNORE INTO rental_booths_next (rental_contract_id, booth_id)
        SELECT rc.id, b.id
          FROM rental_contracts rc
          JOIN booth b ON b.booth_number = UPPER(TRIM(rc.booth_number))
         WHERE rc.booth_number IS NOT NULL
           AND TRIM(rc.booth_number) <> ''
           AND COALESCE(rc.status, 'draft') <> 'cancelled'`,
    );

    await connection.execute("DROP TABLE IF EXISTS rental_booths");
    await connection.execute("RENAME TABLE rental_booths_next TO rental_booths");
    const [columns] = await connection.execute("SHOW COLUMNS FROM rental_booths");
    const [counts] = await connection.execute(
      "SELECT COUNT(*) AS links_count FROM rental_booths",
    );
    console.log(`${env.DB_NAME}: ${columns.map((column) => column.Field).join(", ")} | links=${counts[0].links_count}`);
  } finally {
    await connection.end();
  }
}

async function main() {
  for (const root of [
    "C:\\Users\\asus\\Documents\\Event CRM",
    "C:\\Users\\asus\\Documents\\Market place",
  ]) {
    await migrate(root);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
