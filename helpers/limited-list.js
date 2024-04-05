class LimitedList {
  constructor(limit) {
    this.limit = limit;
    this.itemCount = 0;
    this.items = [];
  }

  addItem(item) {
    if (this.items.length >= this.limit) {
      this.items.pop();
    }
    this.items.unshift(item);
    this.itemCount = this.getItemCount();
  }

  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.itemCount = this.getItemCount();
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
