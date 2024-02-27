import {Model, DataTypes} from 'sequelize';
import {sequelizeClient} from '../connect'

class Symbol extends Model {
    public id?: number;
    public minStep: number;
    public lotStep: number;
    public maxLot: number;
    public name: string;
}

Symbol.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    minStep: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    lotStep: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    maxLot: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: sequelizeClient,
    tableName: 'symbol',
    timestamps: false
});
export {Symbol}
