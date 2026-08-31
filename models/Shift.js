export default (sequelize, DataTypes) => {
  const Shift = sequelize.define('Shift', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cashierId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    openingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    cashSales: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    upiSales: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    cardSales: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    expectedCash: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    actualCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    difference: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Open', 'Closed'),
      defaultValue: 'Open'
    },
    startTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return Shift;
};
