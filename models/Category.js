import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    // Store category types as JSON array
    types: {
      type: DataTypes.JSON,
      defaultValue: [],
      // Example: [{ id: uuid, name: 'Classical', description: '...' }]
      get() {
        const rawValue = this.getDataValue('types');
        // Ensure types is always an array
        if (typeof rawValue === 'string') {
          try {
            return JSON.parse(rawValue);
          } catch (e) {
            return [];
          }
        }
        return Array.isArray(rawValue) ? rawValue : [];
      },
      set(value) {
        // Ensure we're storing an array
        this.setDataValue('types', Array.isArray(value) ? value : []);
      }
    },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
    indexes: [{ fields: ['name'] }],
  },
);

export default Category;
