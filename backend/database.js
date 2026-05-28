const { Sequelize, DataTypes } = require("sequelize");

const db = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false
});

// ---------- USER ----------
const User = db.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: "users",
  timestamps: true
});

// ---------- RATING ----------
const Rating = db.define("Rating", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false }, // Removed any unique property
  movie_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: "ratings",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["user_id", "movie_id"] // A user can rate a movie only once
    }
  ]
});

// ---------- WATCHLIST ----------
const Watchlist = db.define("Watchlist", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false }, // Removed any unique property
  movie_id: { type: DataTypes.INTEGER, allowNull: false },
  movie_name: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: "watchlist",
  timestamps: true,
  indexes: [
    {
      unique: true, // Prevents duplicate entries of the same movie for the same user
      fields: ["user_id", "movie_id"] 
    }
  ]
});

// ---------- SYNC ----------
(async () => {
  try {
    await db.authenticate();
    
    // IMPORTANT: Change 'alter: true' to 'force: true' ONCE to wipe the bad schema,
    // then change it back to 'alter: true' for normal use.
    await db.sync({ force: true }); 
    
    console.log("✅ Database connected and synced");
  } catch (err) {
    console.error("❌ Database sync error:", err);
  }
})();


module.exports = { db, User, Rating, Watchlist };
