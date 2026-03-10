import { query } from "@/lib/db";

export async function GET() {
  try {
    const results = [];

    // Migration 1: Add role column to users
    const roleColumns = await query("SHOW COLUMNS FROM users LIKE 'role'");
    if (roleColumns.length === 0) {
      await query(
        "ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' AFTER password"
      );
      results.push("Added role column to users table");
    }

    // Migration 2: Add shippingPhone to orders + make state/zip nullable
    const phoneColumns = await query("SHOW COLUMNS FROM orders LIKE 'shippingPhone'");
    if (phoneColumns.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN shippingPhone VARCHAR(30) DEFAULT NULL AFTER shippingName"
      );
      results.push("Added shippingPhone column to orders table");
    }

    // Make shippingState and shippingZip nullable
    await query("ALTER TABLE orders MODIFY COLUMN shippingState VARCHAR(100) DEFAULT NULL");
    await query("ALTER TABLE orders MODIFY COLUMN shippingZip VARCHAR(20) DEFAULT NULL");
    results.push("Made shippingState and shippingZip nullable");

    // Migration 3: Add cancellationReason, returnReason columns + returned status
    const cancelReasonCols = await query("SHOW COLUMNS FROM orders LIKE 'cancellationReason'");
    if (cancelReasonCols.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN cancellationReason VARCHAR(500) DEFAULT NULL"
      );
      results.push("Added cancellationReason column to orders table");
    }

    const returnReasonCols = await query("SHOW COLUMNS FROM orders LIKE 'returnReason'");
    if (returnReasonCols.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN returnReason VARCHAR(500) DEFAULT NULL"
      );
      results.push("Added returnReason column to orders table");
    }

    // Add 'returned' to status ENUM
    await query(
      "ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'pending'"
    );
    results.push("Updated status ENUM to include returned");

    // Migration 4: Add paymentMethod and paymentScreenshot columns
    const paymentMethodCols = await query("SHOW COLUMNS FROM orders LIKE 'paymentMethod'");
    if (paymentMethodCols.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN paymentMethod ENUM('cod', 'online') DEFAULT 'cod'"
      );
      results.push("Added paymentMethod column to orders table");
    }

    const paymentScreenshotCols = await query("SHOW COLUMNS FROM orders LIKE 'paymentScreenshot'");
    if (paymentScreenshotCols.length === 0) {
      await query(
        "ALTER TABLE orders ADD COLUMN paymentScreenshot VARCHAR(500) DEFAULT NULL"
      );
      results.push("Added paymentScreenshot column to orders table");
    } else {
      // Migration 5: Change paymentScreenshot from LONGTEXT to VARCHAR(500) for URL storage
      await query(
        "ALTER TABLE orders MODIFY COLUMN paymentScreenshot VARCHAR(500) DEFAULT NULL"
      );
      results.push("Updated paymentScreenshot column to VARCHAR(500)");
    }

    // Migration 6: Add images column to products + migrate imageUrl data
    const imagesCols = await query("SHOW COLUMNS FROM products LIKE 'images'");
    if (imagesCols.length === 0) {
      await query("ALTER TABLE products ADD COLUMN images TEXT DEFAULT NULL AFTER imageUrl");
      results.push("Added images column to products table");
      // Migrate existing imageUrl data into images JSON array
      await query(
        "UPDATE products SET images = CONCAT('[\"', imageUrl, '\"]') WHERE imageUrl IS NOT NULL AND imageUrl != '' AND images IS NULL"
      );
      results.push("Migrated existing imageUrl data to images column");
    }

    // Migration 7: Add resetToken and resetTokenExpiry columns to users
    const resetTokenCols = await query("SHOW COLUMNS FROM users LIKE 'resetToken'");
    if (resetTokenCols.length === 0) {
      await query("ALTER TABLE users ADD COLUMN resetToken VARCHAR(255) DEFAULT NULL");
      results.push("Added resetToken column to users table");
    }

    const resetTokenExpiryCols = await query("SHOW COLUMNS FROM users LIKE 'resetTokenExpiry'");
    if (resetTokenExpiryCols.length === 0) {
      await query("ALTER TABLE users ADD COLUMN resetTokenExpiry DATETIME DEFAULT NULL");
      results.push("Added resetTokenExpiry column to users table");
    }

    // Migration 10: Create settings table
    const settingsTables = await query("SHOW TABLES LIKE 'settings'");
    if (settingsTables.length === 0) {
      await query(
        `CREATE TABLE settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          settingKey VARCHAR(100) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      );
      await query("INSERT INTO settings (settingKey, value) VALUES ('deliveryCharge', '0')");
      results.push("Created settings table with default deliveryCharge");
    }

    // Migration 11: Add deliveryCharge column to orders
    const deliveryChargeCols = await query("SHOW COLUMNS FROM orders LIKE 'deliveryCharge'");
    if (deliveryChargeCols.length === 0) {
      await query("ALTER TABLE orders ADD COLUMN deliveryCharge DECIMAL(10,2) DEFAULT 0");
      results.push("Added deliveryCharge column to orders table");
    }

    // Migration 12: Create categories table and seed from existing product categories
    const categoriesTables = await query("SHOW TABLES LIKE 'categories'");
    if (categoriesTables.length === 0) {
      await query(
        `CREATE TABLE categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      );
      results.push("Created categories table");
      const existingCats = await query(
        "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''"
      );
      for (const row of existingCats) {
        await query("INSERT IGNORE INTO categories (name) VALUES (?)", [row.category]);
      }
      if (existingCats.length > 0) {
        results.push(`Seeded ${existingCats.length} categories from existing products`);
      }
    }

    // Migration 13: Add sizes column to products and migrate size+stock data
    // For drinks, sizes represent volume variants (e.g. 250ml, 500ml, 1L)
    const sizesCols = await query("SHOW COLUMNS FROM products LIKE 'sizes'");
    if (sizesCols.length === 0) {
      await query("ALTER TABLE products ADD COLUMN sizes TEXT DEFAULT NULL AFTER stock");
      results.push("Added sizes column to products table");
      const allProducts = await query("SELECT id, size, stock FROM products");
      for (const p of allProducts) {
        let sizesJson;
        if (p.size && p.size.trim() !== "") {
          const sizeList = p.size.split(",").map(s => s.trim()).filter(Boolean);
          sizesJson = JSON.stringify(
            sizeList.map((s, i) => ({ size: s, stock: i === 0 ? (p.stock || 0) : 0 }))
          );
        } else {
          sizesJson = JSON.stringify([{ size: "", stock: p.stock || 0 }]);
        }
        await query("UPDATE products SET sizes = ? WHERE id = ?", [sizesJson, p.id]);
      }
      results.push("Migrated existing size+stock data into sizes JSON column");
    }

    return Response.json({
      success: true,
      message: results.length > 0 ? results.join("; ") : "All migrations already applied",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Migration failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
