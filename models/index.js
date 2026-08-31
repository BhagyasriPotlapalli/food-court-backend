import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import Sequelize from "sequelize";
import process from "process";
import configFile from "../config/config.cjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = configFile[env];

const db = {};

let sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const files = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.endsWith(".js")
  );

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  const module = await import(pathToFileURL(fullPath));
  const model = module.default(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

const {
  User,
  Category,
  FoodItem,
  Order,
  OrderItem,
  Shift
} = db;

// Model Associations

// Category -> FoodItem
if (Category && FoodItem) {
  Category.hasMany(FoodItem, { foreignKey: 'categoryId', as: 'foodItems' });
  FoodItem.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
}

// User (Cashier) -> Shift
if (User && Shift) {
  User.hasMany(Shift, { foreignKey: 'cashierId', as: 'shifts' });
  Shift.belongsTo(User, { foreignKey: 'cashierId', as: 'cashier' });
}

// User (Cashier) -> Order
if (User && Order) {
  User.hasMany(Order, { foreignKey: 'cashierId', as: 'orders' });
  Order.belongsTo(User, { foreignKey: 'cashierId', as: 'cashier' });
}

// Order -> OrderItem
if (Order && OrderItem) {
  Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
  OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
}

// FoodItem -> OrderItem
if (FoodItem && OrderItem) {
  FoodItem.hasMany(OrderItem, { foreignKey: 'foodItemId', as: 'orderItems' });
  OrderItem.belongsTo(FoodItem, { foreignKey: 'foodItemId', as: 'foodItem' });
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
