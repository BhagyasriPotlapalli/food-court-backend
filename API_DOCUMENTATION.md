# Food Court POS - API Documentation (MongoDB Edition)

**Base URL:** `http://localhost:5000`

> **Note on MongoDB IDs:** Because you are now using MongoDB, IDs are no longer simple numbers like `1` or `2`. They are 24-character strings like `64f8a9b3c4d5e6f7a8b9c0d1`. Make sure to copy the actual `_id` returned in responses when passing them to other requests!

---

## 1. Authentication APIs

### Register Initial Admin
* **URL:** `POST /api/auth/register-admin`
* **Body (JSON):**
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```

### Login
* **URL:** `POST /api/auth/login`
* **Body (JSON):**
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
> **IMPORTANT:** Copy the `accessToken` from the response. For Admin/Cashier endpoints, go to Postman's **Authorization** tab, select **Bearer Token**, and paste your token.

---

## 2. Admin APIs
*Requires `Bearer <token>` from an Admin.*

### Admin Dashboard
* **URL:** `GET /api/admin/dashboard`
* **Body:** *None*

### Create a Cashier
* **URL:** `POST /api/admin/cashiers`
* **Body (JSON):**
  ```json
  {
    "username": "cashier1",
    "password": "cashierpassword"
  }
  ```

### Create a Category
* **URL:** `POST /api/admin/categories`
* **Body (JSON):**
  ```json
  {
    "name": "Beverages",
    "description": "Cold and hot drinks"
  }
  ```

### Create a Food Item
* **URL:** `POST /api/admin/food-items`
* **Body (JSON):**
  ```json
  {
    "name": "Coca Cola",
    "price": 40.00,
    "categoryId": "PASTE_CATEGORY_ID_HERE"
  }
  ```

### Get Order Audit Logs (NEW)
View the automated timeline of an order.
* **URL:** `GET /api/admin/orders/:id/audit` *(Replace `:id` with actual Order ID)*
* **Body:** *None*

### Get Reports
* **URL:** `GET /api/admin/reports?startDate=2023-01-01&endDate=2024-12-31`
* **Body:** *None*

---

## 3. Cashier APIs
*Requires `Bearer <token>` from a Cashier.*

### Start Shift
* **URL:** `POST /api/cashier/shift/start`
* **Body (JSON):**
  ```json
  {
    "openingBalance": 1000
  }
  ```

### Get Menu
Fetches categories and available food items for the billing screen.
* **URL:** `GET /api/cashier/menu`
* **Body:** *None*

### Create an Order (Billing)
* **URL:** `POST /api/cashier/orders`
* **Body (JSON):**
  ```json
  {
    "items": [
      {
        "foodItemId": "PASTE_FOOD_ITEM_ID_HERE",
        "quantity": 2
      }
    ],
    "paymentMethod": "UPI",
    "tax": 5.00,
    "discount": 0.00
  }
  ```
*(Note: `paymentMethod` must be exactly "Cash", "UPI", or "Card")*

### Get Order History
* **URL:** `GET /api/cashier/orders`
* **Body:** *None*

### Close Shift
* **URL:** `POST /api/cashier/shift/close`
* **Body (JSON):**
  ```json
  {
    "actualCash": 1085
  }
  ```
