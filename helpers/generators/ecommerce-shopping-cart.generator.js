const { RandomValueGeneratorWithSeed } = require("./random-data.generator");

const sampleData = {
  cartItems: [],
  subtotal: 0,
  discount: 0,
  tax: 0,
  total: 0,
  shippingCost: 0,
  taxRate: 0.23, // 23% tax rate
  shipping: {
    address: {
      recipientName: "John Doe",
      street: "123 Main Street",
      city: "Anytown",
      state: "CA",
      postalCode: "12345",
      country: "USA",
    },
    method: "Standard Shipping",
    cost: 10.0, // Flat rate shipping cost
    estimatedDelivery: "2023-11-05",
  },
  coupons: [],
  customer: {
    customerId: "CUST-001",
    name: "John Doe",
    email: "johndoe@test.test.test",
    phone: "+1001-555-1234",
  },
};

const sampleCoupons = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 0.1,
  },
  {
    code: "SAVE200",
    type: "fixed",
    value: 200,
  },
  {
    code: "FREESHIP",
    type: "free_shipping",
    value: 0,
  },
  {
    code: "SUMMER20",
    type: "percentage",
    value: 0.2,
  },
  {
    code: "WINTER30",
    type: "percentage",
    value: 0.3,
  },
  {
    code: "FALL25",
    type: "percentage",
    value: 0.25,
  },
  {
    code: "SPRING15",
    type: "percentage",
    value: 0.15,
  },
  {
    code: "HALLOWEEN",
    type: "percentage",
    value: 0.31,
  },
  {
    code: "CHRISTMAS",
    type: "percentage",
    value: 0.25,
  },
  {
    code: "NEWYEAR",
    type: "percentage",
    value: 0.1,
  },
];

const sampleProducts = [
  {
    id: 1,
    name: "Apple",
    price: 1.99,
    icon: "🍎",
  },
  {
    id: 2,
    name: "Banana",
    price: 0.99,
    icon: "🍌",
  },
  {
    id: 3,
    name: "Cherry",
    price: 2.99,
    icon: "🍒",
  },
  {
    id: 4,
    name: "Grapes",
    price: 3.99,
    icon: "🍇",
  },
  {
    id: 5,
    name: "Laptop",
    price: 999.99,
    icon: "💻",
  },
  {
    id: 6,
    name: "Smartphone",
    price: 699.99,
    icon: "📱",
  },
  {
    id: 7,
    name: "Tablet",
    price: 499.99,
    icon: "📱",
  },
  {
    id: 8,
    name: "Smartwatch",
    price: 299.99,
    icon: "⌚",
  },
  {
    id: 9,
    name: "Headphones",
    price: 199.99,
    icon: "🎧",
  },
  {
    id: 10,
    name: "Sunglasses",
    price: 49.99,
    icon: "🕶️",
  },
  {
    id: 11,
    name: "Backpack",
    price: 79.99,
    icon: "🎒",
  },
  {
    id: 12,
    name: "Camera",
    price: 399.99,
    icon: "📷",
  },
  {
    id: 13,
    name: "Printer",
    price: 299.99,
    icon: "🖨️",
  },
  {
    id: 14,
    name: "Desk Lamp",
    price: 19.99,
    icon: "💡",
  },
  {
    id: 15,
    name: "Coffee Maker",
    price: 49.99,
    icon: "☕",
  },
  {
    id: 16,
    name: "Blender",
    price: 39.99,
    icon: "🥤",
  },
  {
    id: 17,
    name: "Toaster",
    price: 29.99,
    icon: "🍞",
  },
  {
    id: 18,
    name: "Microwave",
    price: 99.99,
    icon: "🍽️",
  },
  {
    id: 19,
    name: "Television",
    price: 799.99,
    icon: "📺",
  },
  {
    id: 20,
    name: "Vacuum Cleaner",
    price: 149.99,
    icon: "🧹",
  },
  {
    id: 21,
    name: "Iron",
    price: 29.99,
    icon: "🔌",
  },
  {
    id: 22,
    name: "Hair Dryer",
    price: 49.99,
    icon: "💇",
  },
  {
    id: 23,
    name: "Electric Toothbrush",
    price: 79.99,
    icon: "🪥",
  },
  {
    id: 24,
    name: "Shaver",
    price: 99.99,
    icon: "🪒",
  },
  {
    id: 25,
    name: "Perfume",
    price: 69.99,
    icon: "🌸",
  },
  {
    id: 26,
    name: "Makeup Kit",
    price: 49.99,
    icon: "💄",
  },
  {
    id: 27,
    name: "Nail Polish",
    price: 9.99,
    icon: "💅",
  },
  {
    id: 28,
    name: "Shampoo",
    price: 19.99,
    icon: "🧴",
  },
  {
    id: 29,
    name: "Conditioner",
    price: 19.99,
    icon: "🧴",
  },
  {
    id: 30,
    name: "Soap",
    price: 4.99,
    icon: "🧼",
  },
  {
    id: 31,
    name: "Toothpaste",
    price: 2.99,
    icon: "🪥",
  },
  {
    id: 32,
    name: "Toothbrush",
    price: 1.99,
    icon: "🪥",
  },
  {
    id: 33,
    name: "Towel",
    price: 9.99,
    icon: "🛁",
  },
  {
    id: 34,
    name: "Bathrobe",
    price: 29.99,
    icon: "🛁",
  },
  {
    id: 35,
    name: "Bed Linen",
    price: 39.99,
    icon: "🛏️",
  },
];

function generateEcommerceShoppingCart(totalRandom) {
  const shoppingCart = sampleData;
  let dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());

  if (totalRandom === false) {
    const currentDate = new Date();
    dataGenerator = new RandomValueGeneratorWithSeed(currentDate.toISOString().split("T")[0]);
  }

  const cartItems = [];
  const itemCount = dataGenerator.getNextValue(1, 10);
  for (let i = 0; i < itemCount; i++) {
    const product = sampleProducts[dataGenerator.getNextValue(0, sampleProducts.length - 1)];
    const quantity = dataGenerator.getNextValue(1, 5);
    cartItems.push({
      product,
      quantity,
      subtotal: Math.round(product.price * quantity * 100) / 100,
    });
  }

  // calculate shipping cost based on number and value of items
  if (cartItems.length > 0) {
    shoppingCart.shipping.cost = 0;
    const totalValue = cartItems.reduce((total, item) => total + item.subtotal, 0);
    shoppingCart.shipping.cost += (totalValue % 100) * 1.75;
    shoppingCart.shipping.cost += (cartItems.length % 3) * 10;
  }

  // Apply coupon
  if (dataGenerator.getNextValue(0, 100) < 40) {
    const coupon = sampleCoupons[dataGenerator.getNextValue(0, sampleCoupons.length - 1)];
    shoppingCart.coupons.push(coupon);
    if (coupon.type === "percentage") {
      shoppingCart.discount = shoppingCart.subtotal * coupon.value;
    } else if (coupon.type === "fixed") {
      shoppingCart.discount = coupon.value;
    } else if (coupon.type === "free_shipping") {
      shoppingCart.shipping.cost = 0;
    }
  }

  shoppingCart.shippingCost = shoppingCart.shipping.cost;

  shoppingCart.subtotal = cartItems.reduce((total, item) => total + item.subtotal, 0);
  shoppingCart.tax = shoppingCart.subtotal * shoppingCart.taxRate;
  shoppingCart.total = shoppingCart.subtotal + shoppingCart.tax + shoppingCart.shippingCost;
  shoppingCart.cartItems = cartItems;

  // apply discount
  shoppingCart.total -= shoppingCart.discount;

  if (shoppingCart.total < 0) {
    shoppingCart.total = 0;
  }

  // round to 2 decimal places
  shoppingCart.subtotal = Math.round(shoppingCart.subtotal * 100) / 100;
  shoppingCart.discount = Math.round(shoppingCart.discount * 100) / 100;
  shoppingCart.tax = Math.round(shoppingCart.tax * 100) / 100;
  shoppingCart.total = Math.round(shoppingCart.total * 100) / 100;
  shoppingCart.shippingCost = Math.round(shoppingCart.shippingCost * 100) / 100;
  shoppingCart.shipping.cost = Math.round(shoppingCart.shipping.cost * 100) / 100;

  return shoppingCart;
}

module.exports = {
  generateEcommerceShoppingCart,
};
