import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './userModel.js';

const TermsAndConditions = sequelize.define(
  'TermsAndConditions',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    documentType: {
      type: DataTypes.ENUM('terms', 'disclaimer'),
      allowNull: false,
      defaultValue: 'terms',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Terms and Conditions',
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    publishedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    publishedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'TermsAndConditions',
    tableName: 'terms_and_conditions',
    timestamps: true,
    indexes: [
      { fields: ['isActive'] },
      { fields: ['documentType'] },
    ],
  },
);

// Association
TermsAndConditions.belongsTo(User, { foreignKey: 'publishedById', as: 'publishedBy' });

export default TermsAndConditions;
