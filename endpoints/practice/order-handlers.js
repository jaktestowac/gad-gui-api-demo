// Restaurant Order Handlers (V1)
const {
  HTTP_OK,
  HTTP_NOT_FOUND,
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_SERVER_ERROR,
} = require("../../helpers/response.helpers");
const { isUndefined } = require("../../helpers/compare.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");

// Generate unique 6-character alphanumeric ID
function generateOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// --- Mock Data ---
let restaurants = [
  {
    id: 1,
    name: "Pasta Palace",
    cuisine: "Italian",
    location: "Downtown",
    description: "Best pasta in town!",
    image: "🍝",
  },
  {
    id: 2,
    name: "Sushi Central",
    cuisine: "Japanese",
    location: "Uptown",
    description: "Fresh sushi and sashimi.",
    image: "🍣",
  },
  {
    id: 3,
    name: "Burger Barn",
    cuisine: "American",
    location: "Midtown",
    description: "Juicy burgers and fries.",
    image: "🍔",
  },
  {
    id: 4,
    name: "Curry Corner",
    cuisine: "Indian",
    location: "Eastside",
    description: "Spicy curries and naan.",
    image: "🍛",
  },
  {
    id: 5,
    name: "Taco Tower",
    cuisine: "Mexican",
    location: "Westside",
    description: "Tacos, burritos, and more!",
    image: "🌮",
  },
];
let items = [
  { id: 1, restaurantId: 1, name: "Spaghetti Carbonara", price: 14.5 },
  { id: 2, restaurantId: 1, name: "Lasagna", price: 13.0 },
  { id: 3, restaurantId: 2, name: "Salmon Nigiri", price: 3.5 },
  { id: 4, restaurantId: 2, name: "Tuna Roll", price: 5.0 },
  { id: 5, restaurantId: 3, name: "Classic Burger", price: 9.0 },
  { id: 6, restaurantId: 3, name: "Cheese Fries", price: 4.5 },
  { id: 7, restaurantId: 4, name: "Chicken Tikka Masala", price: 12.0 },
  { id: 8, restaurantId: 4, name: "Garlic Naan", price: 2.5 },
  { id: 9, restaurantId: 5, name: "Beef Taco", price: 3.0 },
  { id: 10, restaurantId: 5, name: "Chicken Burrito", price: 7.0 },
  { id: 11, restaurantId: 1, name: "Penne Arrabbiata", price: 12.0 },
  { id: 12, restaurantId: 2, name: "Eel Avocado Roll", price: 6.0 },
  { id: 13, restaurantId: 3, name: "BBQ Bacon Burger", price: 10.0 },
  { id: 14, restaurantId: 4, name: "Paneer Butter Masala", price: 11.0 },
  { id: 15, restaurantId: 5, name: "Fish Tacos", price: 4.5 },
  { id: 16, restaurantId: 1, name: "Fettuccine Alfredo", price: 13.5 },
  { id: 17, restaurantId: 2, name: "Spicy Tuna Roll", price: 5.5 },
  { id: 18, restaurantId: 3, name: "Veggie Burger", price: 8.0 },
  { id: 19, restaurantId: 4, name: "Lamb Vindaloo", price: 14.0 },
  { id: 20, restaurantId: 5, name: "Chili Con Carne", price: 6.0 },
  { id: 21, restaurantId: 1, name: "Ravioli di Ricotta", price: 15.0 },
  { id: 22, restaurantId: 2, name: "California Roll", price: 4.0 },
  { id: 23, restaurantId: 3, name: "Mushroom Swiss Burger", price: 9.5 },
  { id: 24, restaurantId: 4, name: "Vegetable Biryani", price: 10.0 },
  { id: 25, restaurantId: 5, name: "Quesadilla", price: 5.0 },
  { id: 26, restaurantId: 1, name: "Gnocchi al Pesto", price: 14.0 },
  { id: 27, restaurantId: 2, name: "Tempura Udon", price: 7.0 },
];
let reviews = [
  { id: 1, restaurantId: 1, user: "Alice", rating: 5, comment: "Amazing pasta!" },
  { id: 2, restaurantId: 2, user: "Bob", rating: 4, comment: "Very fresh fish." },
  { id: 3, restaurantId: 3, user: "Charlie", rating: 5, comment: "Best burger I've had." },
  { id: 4, restaurantId: 4, user: "Dana", rating: 4, comment: "Great curry, a bit spicy." },
  { id: 5, restaurantId: 5, user: "Eve", rating: 5, comment: "Tacos are delicious!" },
  { id: 6, restaurantId: 1, user: "Frank", rating: 4, comment: "Nice ambiance." },
  { id: 7, restaurantId: 2, user: "Grace", rating: 5, comment: "Loved the rolls." },
  { id: 8, restaurantId: 3, user: "Hank", rating: 3, comment: "Burger was okay." },
  { id: 9, restaurantId: 4, user: "Ivy", rating: 5, comment: "Best naan ever!" },
  { id: 10, restaurantId: 5, user: "Jack", rating: 4, comment: "Burrito was tasty." },
  { id: 11, restaurantId: 1, user: "Liam", rating: 5, comment: "Loved the ravioli!" },
  { id: 12, restaurantId: 2, user: "Mia", rating: 4, comment: "California roll was fresh." },
  { id: 13, restaurantId: 3, user: "Noah", rating: 5, comment: "Mushroom Swiss burger is a must-try." },
  { id: 14, restaurantId: 4, user: "Olivia", rating: 4, comment: "Vegetable biryani was flavorful." },
  { id: 15, restaurantId: 5, user: "Liam", rating: 5, comment: "Quesadilla was cheesy and good." },
  { id: 16, restaurantId: 1, user: "Emma", rating: 5, comment: "Gnocchi al pesto was heavenly." },
  { id: 17, restaurantId: 2, user: "Oliver", rating: 5, comment: "Tempura udon was crispy and delicious." },
  { id: 18, restaurantId: 3, user: "Ava", rating: 4, comment: "Veggie burger was tasty." },
  { id: 19, restaurantId: 4, user: "Sophia", rating: 5, comment: "Lamb vindaloo was spicy and rich." },
  { id: 20, restaurantId: 5, user: "James", rating: 4, comment: "Chili con carne was hearty." },
  { id: 21, restaurantId: 1, user: "Isabella", rating: 5, comment: "Ravioli di ricotta was perfect." },
  { id: 22, restaurantId: 2, user: "Lucas", rating: 3, comment: "California roll was average." },
  { id: 23, restaurantId: 3, user: "Mason", rating: 2, comment: "Mushroom Swiss burger was bland." },
  { id: 24, restaurantId: 4, user: "Amelia", rating: 3, comment: "Vegetable biryani was okay." },
  { id: 25, restaurantId: 5, user: "Ethan", rating: 4, comment: "Quesadilla was good but could be better." },
  { id: 26, restaurantId: 1, user: "Charlotte", rating: 3, comment: "Gnocchi al pesto was too oily." },
  { id: 27, restaurantId: 2, user: "Aiden", rating: 2, comment: "Tempura udon was soggy." },
  { id: 28, restaurantId: 3, user: "Harper", rating: 4, comment: "Veggie burger was decent." },
  { id: 29, restaurantId: 4, user: "Ella", rating: 3, comment: "Lamb vindaloo was too spicy." },
  { id: 30, restaurantId: 5, user: "Alexander", rating: 4, comment: "Chili con carne was flavorful." },
];
let orders = [
  {
    id: 1,
    orderId: "ORD001",
    restaurantId: 1,
    customerName: "Alice",
    items: [{ name: "Spaghetti Carbonara", quantity: 2 }],
    notes: "No cheese",
    status: "pending",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    orderId: "ORD002",
    restaurantId: 2,
    customerName: "Bob",
    items: [
      { name: "Salmon Nigiri", quantity: 8 },
      { name: "Tuna Roll", quantity: 2 },
    ],
    notes: "Extra wasabi",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    orderId: "ORD003",
    restaurantId: 3,
    customerName: "Charlie",
    items: [
      { name: "Classic Burger", quantity: 1 },
      { name: "Cheese Fries", quantity: 1 },
    ],
    notes: "",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    orderId: "ORD004",
    restaurantId: 4,
    customerName: "Dana",
    items: [
      { name: "Chicken Tikka Masala", quantity: 1 },
      { name: "Garlic Naan", quantity: 2 },
    ],
    notes: "Mild spice",
    status: "completed",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 5,
    orderId: "ORD005",
    restaurantId: 5,
    customerName: "Eve",
    items: [
      { name: "Beef Taco", quantity: 3 },
      { name: "Chicken Burrito", quantity: 1 },
    ],
    notes: "",
    status: "pending",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];
let nextOrderId = 6;
let nextRestaurantId = 6;
let nextItemId = 28;
let nextReviewId = 31;

const orderV1 = {
  getAll: (req, res) => {
    res.status(HTTP_OK).json(orders);
  },

  getCount: (req, res) => {
    res.status(HTTP_OK).json({ count: orders.length });
  },

  getByStatus: (req, res) => {
    const { status } = req.query;
    const filtered = orders.filter((o) => o.status === status);
    res.status(HTTP_OK).json(filtered);
  },

  getByRestaurant: (req, res) => {
    const { restaurantId } = req.query;
    const filtered = orders.filter((o) => o.restaurantId == restaurantId);
    res.status(HTTP_OK).json(filtered);
  },

  getStats: (req, res) => {
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      completed: orders.filter((o) => o.status === "completed").length,
      byRestaurant: {},
    };
    restaurants.forEach((r) => {
      stats.byRestaurant[r.id] = orders.filter((o) => o.restaurantId == r.id).length;
    });
    res.status(HTTP_OK).json(stats);
  },

  create: (req, res) => {
    const { customerName, items, notes, restaurantId } = req.body;
    if (isUndefined(customerName) || !Array.isArray(items) || items.length === 0 || isUndefined(restaurantId)) {
      return res
        .status(HTTP_BAD_REQUEST)
        .send(formatErrorResponse("Customer name, restaurant ID, and at least one item are required"));
    }

    // Generate unique 6-character order ID
    let orderId;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      orderId = generateOrderId();
      attempts++;
    } while (orders.some((order) => order.orderId === orderId) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Failed to generate unique order ID"));
    }

    const newOrder = {
      id: nextOrderId++,
      orderId: orderId,
      customerName,
      items,
      notes: notes || "",
      restaurantId: Number(restaurantId),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    res.status(HTTP_OK).json(newOrder);
  },

  update: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid order ID provided"));
    }

    const idx = orders.findIndex((o) => o.id == id);
    if (idx === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found"));
    }
    const { customerName, items, notes, status } = req.body;
    orders[idx] = {
      ...orders[idx],
      customerName: customerName || orders[idx].customerName,
      items: items || orders[idx].items,
      notes: notes !== undefined ? notes : orders[idx].notes,
      status: status || orders[idx].status,
    };
    res.status(HTTP_OK).json(orders[idx]);
  },

  delete: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid order ID provided"));
    }

    const idx = orders.findIndex((o) => o.id == id);
    if (idx === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found"));
    }
    orders.splice(idx, 1);
    res.status(HTTP_OK).json({ message: "Order deleted" });
  },

  // Test endpoint that returns 500 error
  createWithError: (req, res) => {
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Test error: Order creation failed"));
  },

  // Test endpoint that returns 500 error
  getWithError: (req, res) => {
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Test error: Failed to fetch orders"));
  },
  getPendingCount: (req, res) => {
    const count = orders.filter((o) => o.status === "pending").length;
    res.status(HTTP_OK).json({ pendingCount: count });
  },
  getCompletedCount: (req, res) => {
    const count = orders.filter((o) => o.status === "completed").length;
    res.status(HTTP_OK).json({ completedCount: count });
  },

  getOne: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid order ID provided"));
    }

    const order = orders.find((o) => o.id == id);
    if (!order) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Order not found"));
    res.status(HTTP_OK).json(order);
  },
};

const restaurantV1 = {
  getAll: (req, res) => res.status(HTTP_OK).json(restaurants),

  getCount: (req, res) => {
    res.status(HTTP_OK).json({ count: restaurants.length });
  },

  getByCuisine: (req, res) => {
    const { cuisine } = req.query;
    const filtered = restaurants.filter((r) => r.cuisine.toLowerCase() === cuisine.toLowerCase());
    res.status(HTTP_OK).json(filtered);
  },

  getByLocation: (req, res) => {
    const { location } = req.query;
    const filtered = restaurants.filter((r) => r.location.toLowerCase() === location.toLowerCase());
    res.status(HTTP_OK).json(filtered);
  },

  getStats: (req, res) => {
    const stats = {
      total: restaurants.length,
      byCuisine: {},
      byLocation: {},
    };
    restaurants.forEach((r) => {
      stats.byCuisine[r.cuisine] = (stats.byCuisine[r.cuisine] || 0) + 1;
      stats.byLocation[r.location] = (stats.byLocation[r.location] || 0) + 1;
    });
    res.status(HTTP_OK).json(stats);
  },

  getOne: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid restaurant ID provided"));
    }

    const r = restaurants.find((r) => r.id == id);
    if (!r) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Restaurant not found"));
    res.status(HTTP_OK).json(r);
  },

  create: (req, res) => {
    const { name, cuisine, location, description, image } = req.body;
    if (!name || !cuisine) return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Name and cuisine required"));
    const newR = { id: nextRestaurantId++, name, cuisine, location, description, image };
    restaurants.push(newR);
    res.status(HTTP_OK).json(newR);
  },

  update: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid restaurant ID provided"));
    }

    const idx = restaurants.findIndex((r) => r.id == id);
    if (idx === -1) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Restaurant not found"));
    const { name, cuisine, location, description, image } = req.body;
    restaurants[idx] = {
      ...restaurants[idx],
      name: name || restaurants[idx].name,
      cuisine: cuisine || restaurants[idx].cuisine,
      location: location || restaurants[idx].location,
      description: description || restaurants[idx].description,
      image: image || restaurants[idx].image,
    };
    res.status(HTTP_OK).json(restaurants[idx]);
  },

  delete: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid restaurant ID provided"));
    }

    const idx = restaurants.findIndex((r) => r.id == id);
    if (idx === -1) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Restaurant not found"));
    restaurants.splice(idx, 1);
    res.status(HTTP_OK).json({ message: "Restaurant deleted" });
  },

  // Test endpoint that returns 500 error
  getWithError: (req, res) => {
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Test error: Failed to fetch restaurants"));
  },
  getFirst: (req, res) => {
    if (restaurants.length === 0) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("No restaurants."));
    res.status(HTTP_OK).json(restaurants[0]);
  },

  // Get restaurants with highest average ratings
  getFeatured: (req, res) => {
    const restaurantsWithRatings = restaurants.map((r) => {
      const restaurantReviews = reviews.filter((rev) => rev.restaurantId === r.id);
      const avgRating =
        restaurantReviews.length > 0
          ? restaurantReviews.reduce((sum, rev) => sum + rev.rating, 0) / restaurantReviews.length
          : 0;
      return { ...r, averageRating: avgRating, reviewCount: restaurantReviews.length };
    });
    const featured = restaurantsWithRatings
      .filter((r) => r.reviewCount > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 3);
    res.status(HTTP_OK).json(featured);
  },

  // Get restaurants with most orders
  getBusy: (req, res) => {
    const restaurantsWithOrders = restaurants.map((r) => {
      const restaurantOrders = orders.filter((o) => o.restaurantId === r.id);
      return { ...r, orderCount: restaurantOrders.length };
    });
    const busy = restaurantsWithOrders.sort((a, b) => b.orderCount - a.orderCount).slice(0, 3);
    res.status(HTTP_OK).json(busy);
  },

  // Get restaurants with highest average item prices
  getExpensive: (req, res) => {
    const restaurantsWithPrices = restaurants.map((r) => {
      const restaurantItems = items.filter((i) => i.restaurantId === r.id);
      const avgPrice =
        restaurantItems.length > 0
          ? restaurantItems.reduce((sum, item) => sum + item.price, 0) / restaurantItems.length
          : 0;
      return { ...r, averagePrice: avgPrice, itemCount: restaurantItems.length };
    });
    const expensive = restaurantsWithPrices
      .filter((r) => r.itemCount > 0)
      .sort((a, b) => b.averagePrice - a.averagePrice)
      .slice(0, 3);
    res.status(HTTP_OK).json(expensive);
  },

  // Get restaurants with lowest average item prices
  getCheap: (req, res) => {
    const restaurantsWithPrices = restaurants.map((r) => {
      const restaurantItems = items.filter((i) => i.restaurantId === r.id);
      const avgPrice =
        restaurantItems.length > 0
          ? restaurantItems.reduce((sum, item) => sum + item.price, 0) / restaurantItems.length
          : 0;
      return { ...r, averagePrice: avgPrice, itemCount: restaurantItems.length };
    });
    const cheap = restaurantsWithPrices
      .filter((r) => r.itemCount > 0)
      .sort((a, b) => a.averagePrice - b.averagePrice)
      .slice(0, 3);
    res.status(HTTP_OK).json(cheap);
  },

  // Get restaurants with recent orders (last 24 hours)
  getRecent: (req, res) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const restaurantsWithRecentOrders = restaurants.map((r) => {
      const recentOrders = orders.filter((o) => o.restaurantId === r.id && new Date(o.createdAt) > oneDayAgo);
      return { ...r, recentOrderCount: recentOrders.length };
    });
    const recent = restaurantsWithRecentOrders
      .filter((r) => r.recentOrderCount > 0)
      .sort((a, b) => b.recentOrderCount - a.recentOrderCount);
    res.status(HTTP_OK).json(recent);
  },

  // Get restaurants with most menu items
  getPopularItems: (req, res) => {
    const restaurantsWithItems = restaurants.map((r) => {
      const restaurantItems = items.filter((i) => i.restaurantId === r.id);
      return { ...r, itemCount: restaurantItems.length };
    });
    const popularItems = restaurantsWithItems.sort((a, b) => b.itemCount - a.itemCount).slice(0, 3);
    res.status(HTTP_OK).json(popularItems);
  },

  // Get restaurants that have both orders and reviews
  getActive: (req, res) => {
    const activeRestaurants = restaurants.filter((r) => {
      const hasOrders = orders.some((o) => o.restaurantId === r.id);
      const hasReviews = reviews.some((rev) => rev.restaurantId === r.id);
      return hasOrders && hasReviews;
    });
    res.status(HTTP_OK).json(activeRestaurants);
  },

  // Get restaurants with recent reviews (last 7 days)
  getTrending: (req, res) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const restaurantsWithRecentReviews = restaurants.map((r) => {
      const recentReviews = reviews.filter(
        (rev) => rev.restaurantId === r.id && new Date(rev.createdAt || Date.now()) > sevenDaysAgo
      );
      return { ...r, recentReviewCount: recentReviews.length };
    });
    const trending = restaurantsWithRecentReviews
      .filter((r) => r.recentReviewCount > 0)
      .sort((a, b) => b.recentReviewCount - a.recentReviewCount);
    res.status(HTTP_OK).json(trending);
  },

  // Get restaurants with no recent orders
  getQuiet: (req, res) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const quietRestaurants = restaurants.filter((r) => {
      const recentOrders = orders.filter((o) => o.restaurantId === r.id && new Date(o.createdAt) > oneDayAgo);
      return recentOrders.length === 0;
    });
    res.status(HTTP_OK).json(quietRestaurants);
  },

  // Get restaurant performance summary
  getSummary: (req, res) => {
    const summary = restaurants.map((r) => {
      const restaurantOrders = orders.filter((o) => o.restaurantId === r.id);
      const restaurantReviews = reviews.filter((rev) => rev.restaurantId === r.id);
      const restaurantItems = items.filter((i) => i.restaurantId === r.id);

      const avgRating =
        restaurantReviews.length > 0
          ? restaurantReviews.reduce((sum, rev) => sum + rev.rating, 0) / restaurantReviews.length
          : 0;
      const avgPrice =
        restaurantItems.length > 0
          ? restaurantItems.reduce((sum, item) => sum + item.price, 0) / restaurantItems.length
          : 0;

      return {
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        location: r.location,
        orderCount: restaurantOrders.length,
        reviewCount: restaurantReviews.length,
        itemCount: restaurantItems.length,
        averageRating: avgRating,
        averagePrice: avgPrice,
        isActive: restaurantOrders.length > 0 && restaurantReviews.length > 0,
      };
    });
    res.status(HTTP_OK).json(summary);
  },
};

const itemV1 = {
  getAll: (req, res) => {
    const { restaurantId } = req.query;
    if (restaurantId) {
      res.status(HTTP_OK).json(items.filter((i) => i.restaurantId == restaurantId));
    } else {
      res.status(HTTP_OK).json(items);
    }
  },

  getCount: (req, res) => {
    const { restaurantId } = req.query;
    let count = items.length;
    if (restaurantId) {
      count = items.filter((i) => i.restaurantId == restaurantId).length;
    }
    res.status(HTTP_OK).json({ count });
  },

  getByPriceRange: (req, res) => {
    const { min, max } = req.query;
    const minPrice = parseFloat(min) || 0;
    const maxPrice = parseFloat(max) || Infinity;
    const filtered = items.filter((i) => i.price >= minPrice && i.price <= maxPrice);
    res.status(HTTP_OK).json(filtered);
  },

  getStats: (req, res) => {
    const stats = {
      total: items.length,
      averagePrice: items.reduce((sum, i) => sum + i.price, 0) / items.length,
      byRestaurant: {},
    };
    restaurants.forEach((r) => {
      const restaurantItems = items.filter((i) => i.restaurantId == r.id);
      stats.byRestaurant[r.id] = {
        count: restaurantItems.length,
        averagePrice:
          restaurantItems.length > 0
            ? restaurantItems.reduce((sum, i) => sum + i.price, 0) / restaurantItems.length
            : 0,
      };
    });
    res.status(HTTP_OK).json(stats);
  },

  getOne: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid menu item ID provided"));
    }

    const i = items.find((i) => i.id == id);
    if (!i) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
    res.status(HTTP_OK).json(i);
  },

  create: (req, res) => {
    const { restaurantId, name, price } = req.body;
    if (!restaurantId || !name || !price)
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("restaurantId, name, price required"));
    const newI = { id: nextItemId++, restaurantId, name, price };
    items.push(newI);
    res.status(HTTP_OK).json(newI);
  },

  update: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid menu item ID provided"));
    }

    const idx = items.findIndex((i) => i.id == id);
    if (idx === -1) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
    const { name, price } = req.body;
    items[idx] = { ...items[idx], name: name || items[idx].name, price: price || items[idx].price };
    res.status(HTTP_OK).json(items[idx]);
  },

  delete: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid menu item ID provided"));
    }

    const idx = items.findIndex((i) => i.id == id);
    if (idx === -1) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
    items.splice(idx, 1);
    res.status(HTTP_OK).json({ message: "Item deleted" });
  },

  // Test endpoint that returns 500 error
  getWithError: (req, res) => {
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Test error: Failed to fetch items"));
  },
  getAveragePrice: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid menu item ID provided"));
    }

    const item = items.find((i) => i.id === Number(id));
    if (!item) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Item not found"));
    }
    res.status(HTTP_OK).json({ averagePrice: item.price });
  },
};

const reviewV1 = {
  getAll: (req, res) => {
    const { restaurantId } = req.query;
    if (restaurantId) {
      res.status(HTTP_OK).json(reviews.filter((r) => r.restaurantId == restaurantId));
    } else {
      res.status(HTTP_OK).json(reviews);
    }
  },

  getCount: (req, res) => {
    const { restaurantId } = req.query;
    let count = reviews.length;
    if (restaurantId) {
      count = reviews.filter((r) => r.restaurantId == restaurantId).length;
    }
    res.status(HTTP_OK).json({ count });
  },

  getByRating: (req, res) => {
    const { rating } = req.query;
    const ratingNum = parseInt(rating);
    const filtered = reviews.filter((r) => r.rating === ratingNum);
    res.status(HTTP_OK).json(filtered);
  },

  getStats: (req, res) => {
    const stats = {
      total: reviews.length,
      averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
      byRestaurant: {},
    };
    restaurants.forEach((r) => {
      const restaurantReviews = reviews.filter((rev) => rev.restaurantId == r.id);
      stats.byRestaurant[r.id] = {
        count: restaurantReviews.length,
        averageRating:
          restaurantReviews.length > 0
            ? restaurantReviews.reduce((sum, rev) => sum + rev.rating, 0) / restaurantReviews.length
            : 0,
      };
    });
    res.status(HTTP_OK).json(stats);
  },

  getOne: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid review ID provided"));
    }

    const r = reviews.find((r) => r.id == id);
    if (!r) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Review not found"));
    res.status(HTTP_OK).json(r);
  },

  create: (req, res) => {
    const { restaurantId, user, rating, comment } = req.body;
    if (!restaurantId || !user || !rating)
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("restaurantId, user, rating required"));
    const newR = { id: nextReviewId++, restaurantId, user, rating, comment };
    reviews.push(newR);
    res.status(HTTP_OK).json(newR);
  },

  update: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid review ID provided"));
    }

    const idx = reviews.findIndex((r) => r.id == id);
    if (idx === -1) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Review not found"));
    const { rating, comment } = req.body;
    reviews[idx] = { ...reviews[idx], rating: rating || reviews[idx].rating, comment: comment || reviews[idx].comment };
    res.status(HTTP_OK).json(reviews[idx]);
  },

  delete: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid review ID provided"));
    }

    const idx = reviews.findIndex((r) => r.id == id);
    if (idx === -1) return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Review not found"));
    reviews.splice(idx, 1);
    res.status(HTTP_OK).json({ message: "Review deleted" });
  },

  // Test endpoint that returns 500 error
  getWithError: (req, res) => {
    res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Test error: Failed to fetch reviews"));
  },
  getAverageRating: (req, res, id) => {
    // Handle undefined or invalid ID - more realistic error scenario
    if (id === undefined || id === null || id === "undefined" || id === "null") {
      return res.status(HTTP_INTERNAL_SERVER_ERROR).send(formatErrorResponse("Invalid review ID provided"));
    }

    const review = reviews.find((r) => r.id === Number(id));
    if (!review) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Review not found"));
    }
    res.status(HTTP_OK).json({ averageRating: review.rating });
  },
};

module.exports = { orderV1, restaurantV1, itemV1, reviewV1 };
