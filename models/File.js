import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const File = sequelize.define(
  'File',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileType: {
      type: DataTypes.ENUM('Song', 'Wave'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'File',
    tableName: 'files',
    timestamps: true,
  },
);

export default File;
