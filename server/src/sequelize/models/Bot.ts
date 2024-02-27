import {Model, DataTypes} from 'sequelize';
import {sequelizeClient} from '../connect'

class Bot extends Model {
    public id?: number;
    public symbol: string;
    public params?: string
}

Bot.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    symbol: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    params: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: sequelizeClient,
    tableName: 'bot',
    timestamps: false
});
export {Bot}
