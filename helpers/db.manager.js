// experimental singleton class to manage the database connection
class DatabaseManager {
  setDb(db) {
    this.db = db;
  }

  getDb() {
    return this.db;
  }

  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(this.db);
    }
    return DatabaseManager.instance;
  }
}

module.exports = DatabaseManager;
