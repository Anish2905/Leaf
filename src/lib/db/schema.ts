import { sql } from "drizzle-orm";
import { text, integer, blob, sqliteTable, index } from "drizzle-orm/sqlite-core";

// Single user record
export const users = sqliteTable("users", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    email: text("email").unique().notNull(),
    username: text("username").unique().notNull(),
    passphraseHash: text("passphrase_hash").notNull(),
    createdAt: text("created_at")
        .notNull()
        .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
        .notNull()
        .default(sql`(datetime('now'))`),
});

// WebAuthn credentials (one per device)
export const credentials = sqliteTable(
    "credentials",
    {
        id: text("id").primaryKey(), // credential ID from WebAuthn
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        publicKey: blob("public_key", { mode: "buffer" }).notNull(),
        counter: integer("counter").notNull().default(0),
        deviceName: text("device_name"),
        transports: text("transports"), // JSON array of transports
        lastUsedAt: text("last_used_at"),
        createdAt: text("created_at")
            .notNull()
            .default(sql`(datetime('now'))`),
    },
    (table) => ({
        userIdx: index("idx_credentials_user").on(table.userId),
    })
);

// Hierarchical pages
export const pages = sqliteTable(
    "pages",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        parentId: text("parent_id").references((): ReturnType<typeof text> => pages.id, {
            onDelete: "cascade",
        }),
        databaseId: text("database_id").references((): ReturnType<typeof text> => databases.id, {
            onDelete: "set null",
        }),
        title: text("title").notNull().default("Untitled"),
        icon: text("icon"),
        coverUrl: text("cover_url"),
        properties: text("properties", { mode: "json" }), // JSON for database properties { "status": "Done" }
        position: integer("position").notNull().default(0),
        isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
        isTemplate: integer("is_template", { mode: "boolean" }).default(false), // Nullable to avoid migration data loss warning using CLI
        createdAt: text("created_at")
            .notNull()
            .default(sql`(datetime('now'))`),
        updatedAt: text("updated_at")
            .notNull()
            .default(sql`(datetime('now'))`),
    },
    (table) => ({
        parentIdx: index("idx_pages_parent").on(table.parentId),
        databaseIdx: index("idx_pages_database").on(table.databaseId),
        updatedIdx: index("idx_pages_updated").on(table.updatedAt),
    })
);

// Databases
export const databases = sqliteTable(
    "databases",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        // If a database is inline on a page, parentId points to that page
        parentId: text("parent_id").references((): ReturnType<typeof text> => pages.id, {
            onDelete: "cascade",
        }),
        title: text("title").notNull().default("Untitled Database"),
        schema: text("schema", { mode: "json" }).notNull().default("{}"), // Property definitions
        views: text("views", { mode: "json" }).notNull().default("[]"), // View configurations
        createdAt: text("created_at")
            .notNull()
            .default(sql`(datetime('now'))`),
        updatedAt: text("updated_at")
            .notNull()
            .default(sql`(datetime('now'))`),
    },
    (table) => ({
        parentIdx: index("idx_databases_parent").on(table.parentId),
    })
);

// Content blocks
export const blocks = sqliteTable(
    "blocks",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        pageId: text("page_id")
            .notNull()
            .references(() => pages.id, { onDelete: "cascade" }),
        databaseId: text("database_id").references((): ReturnType<typeof text> => databases.id, {
            onDelete: "cascade",
        }),
        parentBlockId: text("parent_block_id").references(
            (): ReturnType<typeof text> => blocks.id,
            { onDelete: "cascade" }
        ),
        type: text("type").notNull().default("paragraph"),
        content: text("content"), // JSON for rich content
        position: integer("position").notNull().default(0),
        createdAt: text("created_at")
            .notNull()
            .default(sql`(datetime('now'))`),
        updatedAt: text("updated_at")
            .notNull()
            .default(sql`(datetime('now'))`),
    },
    (table) => ({
        pageIdx: index("idx_blocks_page").on(table.pageId),
        parentIdx: index("idx_blocks_parent").on(table.parentBlockId),
        updatedIdx: index("idx_blocks_updated").on(table.updatedAt),
    })
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Credential = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Database = typeof databases.$inferSelect;
export type NewDatabase = typeof databases.$inferInsert;
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
