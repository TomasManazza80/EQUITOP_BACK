import { DataTypes } from 'sequelize';

export default (sequelize) => {
    sequelize.define('CierreCaja', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        date: {
            type: DataTypes.DATEONLY, // Solo la fecha, sin hora
            allowNull: false,
            unique: true, // Un cierre por día
            comment: 'Fecha para la cual se realizó el cierre de caja',
        },
        totalRecaudado: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            comment: 'Monto total recaudado en el día',
        },
        totalEgresos: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            comment: 'Monto total de egresos en el día',
        },
        saldoFinal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            comment: 'Saldo final de caja (Recaudado - Egresos)',
        },
        details: {
            type: DataTypes.JSONB, // Para almacenar un desglose más detallado (ej. por método de pago)
            allowNull: true,
            defaultValue: {},
            comment: 'Detalles adicionales del cierre (ej. desglose por métodos de pago, etc.)',
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Estado del cierre de caja',
        },
    }, {
        tableName: 'cierre_caja',
        timestamps: true, // createdAt, updatedAt
        indexes: [
            {
                unique: true,
                fields: ['date']
            }
        ]
    });
};