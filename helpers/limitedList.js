class LimitedList {
  constructor(limit) {
    this.limit = limit;
    this.items = [];
  }

  addItem(item) {
    if (this.items.length >= this.limit) {
      this.items.pop();
    }
    this.items.unshift(item);
  }

  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

  getList() {
    return this.items;
  }

  getItemCount() {
    return this.items.length;
  }
}

module.exports = {
  LimitedList,
};
