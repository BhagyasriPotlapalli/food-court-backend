export default (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cashierId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('Cash', 'UPI', 'Card'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Completed', 'Cancelled', 'Refunded'),
      defaultValue: 'Completed'
    }
  });

  return Order;
};
