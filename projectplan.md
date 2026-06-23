# Ten11 E-commerce Payment Project Plan

This document tracks the roadmap and implementation status of the Ten11 E-commerce project, aligned with the planned phases.

---

## 📊 Phase Status Overview

* **Phase 1: Set up backend** — **[COMPLETED]**
* **Phase 2: Choose and set up a database (PostgreSQL + Sequelize)** — **[COMPLETED]**
* **Phase 3: Build the upload & save API (Cloudinary)** — **[COMPLETED]**
* **Phase 4: Connect the React Frontend** — **[COMPLETED]**
* **Phase 5: Stripe Payment Integration** — **[COMPLETED]**
* **Phase 7: Dynamic Homepage Banners (Sequelize + Cloudinary)** — **[COMPLETED]**
* **Phase 6: Implement Authentication** — **[PENDING]**

---

## 🛠️ Detailed Task Tracker

### `[x]` Phase 1: Set up backend
* `[x]` Initialize Node/Express: Navigate to backend folder and run `npm init -y`.
* `[x]` Install core dependencies:
  * `express` (Web server framework).
  * `cors` (Cross-origin sharing to let React communicate with backend).
  * `dotenv` (Environment variables management).
  * `multer` (Handling multipart/form-data for image uploads).
* `[x]` Install dev-dependency `nodemon` (Auto-restart server on file changes).

### `[x]` Phase 2: Choose and set up a database
* `[x]` Set up a PostgreSQL database connection instance.
* `[x]` Integrate **Sequelize ORM** to manage tables, models, and queries without writing raw SQL.
* `[x]` Build auto-database verification and creation script (`Backend/src/config/initDb.js`) so the database is created programmatically on local servers if missing.

### `[x]` Phase 3: Build the upload & save API
* `[x]` **Local & Cloud storage setup**: Configure `multer` and `multer-storage-cloudinary` to stream file uploads to Cloudinary (free tier) for persistent hosting.
* `[x]` Implement Endpoints:
  * `POST /api/products`: Uploads image files, saves product info to PostgreSQL, and returns the created product.
  * `GET /api/products`: Returns a list of all products from the database.
  * `GET /api/products/:id`: Returns single product details by ID or code.

### `[x]` Phase 4: Connect the React Frontend
* `[x]` **Dynamic Product Detail Pages**: Created reusable `ProductDetail.jsx` which reads URL parameters, fetches product data from the database, and displays interactive carousels, sizes, and colors.
* `[x]` **Admin/Upload Panel**: Created `AdminUpload.jsx` containing inputs for name, code, price, sizes, colors, description, and multi-file drag-and-drop selector to save products directly to the database.
* `[x]` Wrapped application in `CartProvider` (`Frontend/src/context/CartContext.jsx`) and linked nav bar counter in `Nav.jsx`.

### `[x]` Phase 5: Stripe Payment Integration
* `[x]` Install backend `stripe` library.
* `[x]` Define `Order` and `OrderItem` schemas in Sequelize.
* `[x]` Implement `POST /api/payment/create-payment-intent` validating cart prices against DB to prevent pricing bypass.
* `[x]` Implement secure Stripe Webhook listener on server to mark orders as `PAID` automatically on success.
* `[x]` Build Checkout page (`Checkout.jsx`) using `@stripe/stripe-js` and `CardElement` to enter card details and complete payments.

### `[x]` Phase 7: Dynamic Homepage Banners (Sequelize + Cloudinary)
* `[x]` Define `Banner` model in Sequelize.
* `[x]` Export and associate `Banner` in `models/index.js`.
* `[x]` Create backend routing endpoints `GET`, `POST`, and `DELETE` at `/api/banners` for uploading banner pictures to Cloudinary and deleting them.
* `[x]` Update `Home.jsx` to fetch and render banners dynamically, falling back to local static images if the database is empty.
* `[x]` Expand Admin portal (`AdminUpload.jsx`) with a **"Manage Banners"** tab to upload and delete banners.

### `[ ]` Phase 6: Implement Authentication
* `[ ]` Add a `User` table to PostgreSQL.
* `[ ]` Implement user registration, login, password hashing (using `bcrypt`), and secure token generation (using JSON Web Tokens - JWT).
* `[ ]` Protect the upload page and checkout flow so only authenticated users/admins can access them.
