# Polar Stellar - Personal Notion-like App

A secure, single-user, cloud-synced personal knowledge management app. It combines the flexibility of block-based editing with the structure of databases, all secured by modern passkey authentication.

![Status](https://img.shields.io/badge/Status-Beta-blue)
![License](https://img.shields.io/badge/License-Private-red)

## 🚀 Key Features

### 📝 Advanced Block Editor
- **Rich Text Editing**: Powered by Tiptap, supporting headings, lists, quotes, and more.
- **Slash Commands**: Type `/` to bring up a menu to insert blocks like Todo lists, Tables, Callouts, and Media.
- **Markdown Support**: 
    - Full markdown shortcuts (e.g., `# ` for Heading 1, `* ` for bullets).
    - **Import/Export**: Convert your content to/from Markdown via the toolbar.
- **Special Blocks**:
    - **Toggle Lists**: Collapsible content sections.
    - **Callouts**: Colored boxes for warnings, tips, or notes.
    - **YouTube Embeds**: Embed videos directly (`/youtube`).
    - **Web Bookmarks**: Rich link previews with metadata (`/bookmark`).

### 🗄️ Database System
- **Notion-style Databases**: Create structured collections of pages.
- **Table View**: View and edit database properties (Text, Number, Date, Select) in a spreadsheet-like interface.
- **Templates**: Define templates for databases to pre-fill content for new entries.

### 🔐 Modern Authentication
- **Passkeys (WebAuthn)**: Passwordless login using FaceID, TouchID, or system keys.
- **Secure Fallback**: Argon2-hashed passphrase for device recovery.
- **Session Management**: Secure, HTTP-only JWT cookies.

### 🛠️ Utilities
- **Online Status Indicator**: Visual indicator of network connectivity.
- **Dark Mode**: Fully supported via user settings.
- **Command Palette (`Cmd+K`)**: Quickly search pages and navigate.

## 📖 How to Use

### Installation & Setup

1. **Prerequisites**: Node.js 18+, Docker (optional for local DB).
2. **Environment**: Copy `.env.example` to `.env.local` and configure:
   ```env
   TURSO_DATABASE_URL=...
   TURSO_AUTH_TOKEN=...
   JWT_SECRET=...
   ```
3. **Install**:
   ```bash
   npm install
   npm run db:push  # Sync database schema
   npm run dev      # Start server
   ```

### First Login
1. You will be redirected to `/setup`.
2. Set a **Recovery Passphrase** (store this safely!).
3. Register your current device using a **Passkey**.

### Usage Guide

#### Creating Content
- **New Page**: Click the `+` icon in the sidebar or use the Command Palette.
- **Editing**: Just start typing. Highlight text for formatting options.
- **Blocks**: Type `/` to verify available blocks (Heading, List, Table, Image, etc.).

#### Using Databases
1. Type `/database` in the editor.
2. Create a new database or link an existing one.
3. Configure columns (Text, Select, etc.) in the Table View.
4. Open any row as a full page to add rich content.

#### Import / Export
- **Export**: Click the "..." menu in the editor toolbar -> "Export to Markdown".
- **Import**: Click "Import from Markdown" to paste standard markdown content.

## 💻 Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, shadcn/ui.
- **Editor**: Tiptap (ProseMirror wrapper).
- **Backend**: Next.js API Routes, Drizzle ORM.
- **Database**: Turso (libSQL/SQLite).
- **Auth**: `@simplewebauthn` for Passkeys, `jose` for JWTs.
- **Testing**: Vitest (Unit), Puppeteer (E2E).

## 🧪 Testing

Run the comprehensive test suite:
```bash
# Unit Tests
npm run test

# Linting
npm run lint

# E2E Tests (requires setup)
node e2e/sanity.js
```
