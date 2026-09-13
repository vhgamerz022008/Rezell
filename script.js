const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".category-buttons button");
const cartSidebar = document.getElementById("cartSidebar");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const wishlistCount = document.getElementById("wishlist-count");
const cartCount = document.getElementById("cart-count");
const userInfo = document.getElementById("userInfo");
const loginLink = document.getElementById("loginLink");
const installButton = document.getElementById("installButton");

let installPrompt;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  if (installButton) installButton.hidden = false;
});

if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.error("Rezell offline support could not be enabled.", error);
    });
  });
}

let activeCategory = "all";
let searchText = "";

const imagePathMap = {
  "photos/cube.jpg": "photos/cube.jpg.jpeg",
  "photos/tape.jpg": "photos/tape.jpg.jpeg",
  "photos/phone stand.jpg": "photos/phone stand.jpg.jpeg",
  "photos/HeadphonesCarryingCase.jpg": "photos/HeadphonesCarryingCase.jpg.jpeg",
  "photos/silicon phone holder.jpg": "photos/silicon phone holder.jpg.jpeg",
  "photos/mobile charging wall holder.jpg": "photos/mobile charging wall holder.jpg.jpeg",
  "photos/Glass Water Bottle 400ml Leak Proof – BPA-Free for Gym & Travel.jpg": "photos/Glass Water Bottle 400ml Leak Proof – BPA-Free for Gym & Travel.jpg.jpeg",
  "photos/Wall Mounted Mobile Holder – 4 Pack Plastic Organizer.jpg": "photos/Wall Mounted Mobile Holder – 4 Pack Plastic Organizer.jpg.jpeg",
  "photos/65W 4-in-1 Fast Charging Cable – Durable Multi-Port Charger.jpg": "photos/65W 4-in-1 Fast Charging Cable – Durable Multi-Port Charger.jpg.jpeg",
  "photos/bookmark.jpg": "photos/bookmark.svg",
  "photos/coaster.jpg": "photos/coaster.svg",
  "//deodap.in/cdn/shop/products/6112kAbw9SL._SL1000__1.jpg?v=1737629662&width=1946": "//deodap.in/cdn/shop/products/6112kAbw9SL._SL1000__1.jpg?v=1737629662&width=1946"
};

function normalizeStoredItems(items) {
  return items.map((item) => ({ ...item, image: imagePathMap[item.image] || item.image }));
}

let cart = normalizeStoredItems(JSON.parse(localStorage.getItem("rezellCart")) || []);
let wishlist = normalizeStoredItems(JSON.parse(localStorage.getItem("rezellWishlist")) || []);

if (cart.length > 0) {
  localStorage.setItem("rezellCart", JSON.stringify(cart));
}
if (wishlist.length > 0) {
  localStorage.setItem("rezellWishlist", JSON.stringify(wishlist));
}

function getLoggedUser() {
  try {
    return JSON.parse(localStorage.getItem("rezellUser") || "null");
  } catch (error) {
    return null;
  }
}

function saveLoggedUser(user) {
  localStorage.setItem("rezellUser", JSON.stringify(user));
  updateAuthUI();
}

function recordRecentlyViewed(productId) {
  const product = PRODUCTS.find((item) => item.id === productId);
  if (!product) return;

  const viewed = JSON.parse(localStorage.getItem("rezellRecentlyViewed") || "[]");
  const filtered = viewed.filter((item) => item.id !== productId);
  filtered.unshift({ id: product.id, name: product.name, price: product.price, image: product.image });
  localStorage.setItem("rezellRecentlyViewed", JSON.stringify(filtered.slice(0, 6)));
}

function getRecentlyViewed() {
  return JSON.parse(localStorage.getItem("rezellRecentlyViewed") || "[]");
}

function saveOrder(order) {
  const orders = JSON.parse(localStorage.getItem("rezellOrders") || "[]");
  orders.unshift(order);
  localStorage.setItem("rezellOrders", JSON.stringify(orders));
}

function saveCart() {
  localStorage.setItem("rezellCart", JSON.stringify(cart));
  updateCounts();
  renderCart();
}

function saveWishlist() {
  localStorage.setItem("rezellWishlist", JSON.stringify(wishlist));
  updateCounts();
  renderWishlist();
}

function updateCounts() {
  if (cartCount) {
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }
  if (wishlistCount) {
    wishlistCount.textContent = wishlist.length;
  }
  updateAuthUI();
}

function updateAuthUI() {
  const user = getLoggedUser();
  if (userInfo) {
    userInfo.textContent = user ? `Hi, ${user.username || user.name || "there"}` : "";
  }
  if (loginLink) {
    if (user) {
      loginLink.textContent = "Account";
      loginLink.href = "account.html";
      loginLink.onclick = null;
    } else {
      loginLink.textContent = "Login";
      loginLink.href = "login.html";
      loginLink.onclick = null;
    }
  }
}

function renderProducts() {
  if (!productGrid) return;

  const filtered = PRODUCTS.filter((product) => {
    const categoryMatch = activeCategory === "all" || product.category === activeCategory;
    const searchMatch = product.name.toLowerCase().includes(searchText.toLowerCase());
    return categoryMatch && searchMatch;
  });

  if (filtered.length === 0) {
    productGrid.innerHTML = '<div class="empty-state"><h2>No Products Found</h2></div>';
    return;
  }

  productGrid.innerHTML = filtered.map((product) => `
    <div class="card">
      <img src="${product.image}" alt="${product.name}" onclick="openProduct('${product.id}')" />
      <div class="card-content">
        <div class="card-category">${product.category}</div>
        <h3>${product.name}</h3>
        <div class="price">₹${product.price}</div>
        <p>⭐ ${product.rating}</p>
        <div class="card-buttons">
          <button class="details-btn" onclick="openProduct('${product.id}')">View Details</button>
          <button class="buy-btn" onclick="buyProduct('${product.id}')">Buy Now</button>
        </div>
        <div class="card-buttons">
          <button class="secondary-btn" onclick="addToCart('${product.id}')">Add to Cart</button>
          <button class="secondary-btn" onclick="addToWishlist('${product.id}')">Wishlist</button>
        </div>
      </div>
    </div>
  `).join("");
}

function openProduct(id) {
  recordRecentlyViewed(id);
  window.location.href = `product.html?id=${id}`;
}

function buyProduct(id) {
  window.location.href = `checkout.html?productId=${id}`;
}

function addToCart(id) {
  const product = PRODUCTS.find((item) => item.id === id);
  if (!product) return;

  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  }

  saveCart();
  if (cartSidebar) {
    cartSidebar.classList.add("active");
  }
}

function addToWishlist(id) {
  const product = PRODUCTS.find((item) => item.id === id);
  if (!product) return;

  const exists = wishlist.some((item) => item.id === id);
  if (!exists) {
    wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image });
    saveWishlist();
  }
}

function toggleCart() {
  if (cartSidebar) {
    cartSidebar.classList.toggle("active");
    renderCart();
  }
}

function renderCart() {
  if (!cartItems || !cartTotal) return;

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
    cartTotal.textContent = "0";
    return;
  }

  let total = 0;
  cartItems.innerHTML = cart.map((item) => {
    total += item.price * item.quantity;
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <h4>${item.name}</h4>
          <p>₹${item.price}</p>
          <div class="qty-controls">
            <button onclick="changeQty('${item.id}', -1)">−</button>
            <span>${item.quantity}</span>
            <button onclick="changeQty('${item.id}', 1)">+</button>
          </div>
          <button class="remove-btn" onclick="removeItem('${item.id}')">Remove</button>
        </div>
      </div>
    `;
  }).join("");

  cartTotal.textContent = total;
}

function changeQty(id, value) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  item.quantity += value;
  if (item.quantity <= 0) {
    cart = cart.filter((entry) => entry.id !== id);
  }

  saveCart();
}

function removeItem(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
}

function renderWishlist() {
  const wishlistList = document.getElementById("wishlistList");
  if (!wishlistList) return;

  if (wishlist.length === 0) {
    wishlistList.innerHTML = '<div class="empty-state">Your wishlist is empty.</div>';
    return;
  }

  wishlistList.innerHTML = wishlist.map((item) => `
    <div class="wishlist-card">
      <img src="${item.image}" alt="${item.name}" />
      <div>
        <h3>${item.name}</h3>
        <p>₹${item.price}</p>
        <div class="card-buttons">
          <button class="action-btn" onclick="addToCart('${item.id}')">Add to Cart</button>
          <button class="secondary-btn" onclick="removeFromWishlist('${item.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
}

function removeFromWishlist(id) {
  wishlist = wishlist.filter((item) => item.id !== id);
  saveWishlist();
}

function getProductReviews(id) {
  const savedReviews = JSON.parse(localStorage.getItem("rezellReviews") || "{}");
  return savedReviews[id] || [];
}

function saveProductReview(id, review) {
  const savedReviews = JSON.parse(localStorage.getItem("rezellReviews") || "{}");
  const existing = savedReviews[id] || [];
  existing.unshift(review);
  savedReviews[id] = existing;
  localStorage.setItem("rezellReviews", JSON.stringify(savedReviews));
}

function renderProductDetails() {
  const productContainer = document.getElementById("productContainer");
  const relatedProducts = document.getElementById("relatedProducts");
  if (!productContainer) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const product = PRODUCTS.find((item) => item.id === id);

  if (product) {
    recordRecentlyViewed(product.id);
  }

  if (!product) {
    productContainer.innerHTML = '<div class="empty-state"><h2>Product not found.</h2></div>';
    return;
  }

  const reviews = getProductReviews(product.id);
  const related = PRODUCTS.filter((item) => item.id !== product.id).slice(0, 4);

  productContainer.innerHTML = `
    <div class="product-page">
      <div>
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <div class="product-info">
        <h1>${product.name}</h1>
        <div class="rating">⭐ ${product.rating}/5</div>
        <div class="price">₹${product.price}</div>
        <div class="stock">${product.stock}</div>
        <p>${product.description}</p>
        <h3>Features</h3>
        <ul>${product.features.map((feature) => `<li>${feature}</li>`).join("")}</ul>
        <h3>Specifications</h3>
        <table class="spec-table">
          ${Object.entries(product.specifications).map(([key, value]) => `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`).join("")}
        </table>
        <div class="product-actions">
          <button class="action-btn" onclick="addToCart('${product.id}')">Add to Cart</button>
          <button class="secondary-btn" onclick="addToWishlist('${product.id}')">Save to Wishlist</button>
          <button class="buy-btn" onclick="buyProduct('${product.id}')">Buy Now</button>
        </div>
      </div>
    </div>
    <div class="review-card">
      <h2>Customer Reviews</h2>
      <form id="reviewForm">
        <input id="reviewName" placeholder="Your name" required />
        <select id="reviewRating">
          <option value="5">5 Star</option>
          <option value="4">4 Star</option>
          <option value="3">3 Star</option>
          <option value="2">2 Star</option>
          <option value="1">1 Star</option>
        </select>
        <textarea id="reviewComment" rows="4" placeholder="Share your experience" required></textarea>
        <button class="action-btn" type="submit">Submit Review</button>
      </form>
      <div class="review-list">
        ${reviews.length > 0 ? reviews.map((review) => `
          <div class="review-item">
            <strong>${review.name}</strong>
            <p>⭐ ${review.rating}/5</p>
            <p>${review.comment}</p>
          </div>
        `).join("") : '<div class="empty-state">No reviews yet. Be the first to share your experience.</div>'}
      </div>
    </div>
  `;

  if (relatedProducts) {
    relatedProducts.innerHTML = related.map((item) => `
      <div class="related-card" onclick="openProduct('${item.id}')">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <h3>${item.name}</h3>
          <p>₹${item.price}</p>
        </div>
      </div>
    `).join("");
  }

  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("reviewName").value.trim();
      const rating = document.getElementById("reviewRating").value;
      const comment = document.getElementById("reviewComment").value.trim();
      if (!name || !comment) return;
      saveProductReview(product.id, { name, rating, comment });
      renderProductDetails();
    });
  }
}

function setupCheckoutPage() {
  const checkoutSummary = document.getElementById("checkoutSummary");
  const checkoutForm = document.getElementById("checkoutForm");
  const successBox = document.getElementById("orderSuccess");
  if (!checkoutSummary || !checkoutForm) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("productId");
  const items = productId ? [PRODUCTS.find((item) => item.id === productId)].filter(Boolean) : cart;

  if (items.length === 0) {
    checkoutSummary.innerHTML = '<div class="empty-state">Your cart is empty. Add a product to continue.</div>';
    return;
  }

  let total = 0;
  checkoutSummary.innerHTML = items.map((item) => {
    const quantity = item.quantity || 1;
    total += item.price * quantity;
    return `<div class="summary-item"><span>${item.name} × ${quantity}</span><strong>₹${item.price * quantity}</strong></div>`;
  }).join("") + `<div class="summary-item"><span>Total</span><strong>₹${total}</strong></div>`;

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const order = {
      id: `ORD-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      total: total,
      items: items.map((item) => ({ id: item.id, name: item.name, price: item.price })),
      status: "Order placed",
      tracking: "Preparing shipment"
    };
    saveOrder(order);
    successBox.innerHTML = '<div class="success-msg">Thank you! Your order has been placed successfully. We will contact you shortly.</div>';
    cart = [];
    saveCart();
    checkoutForm.reset();
  });
}

function setupLoginPage() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!username || !email || !password) return;

    const user = {
      name: username,
      username,
      email,
      phone: "",
      addresses: [],
      password
    };
    saveLoggedUser(user);
    window.location.href = "account.html";
  });
}

function renderAccountPage() {
  const accountContent = document.getElementById("accountContent");
  if (!accountContent) return;

  const user = getLoggedUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const orders = JSON.parse(localStorage.getItem("rezellOrders") || "[]");
  const recent = getRecentlyViewed();
  const addresses = user.addresses || [];

  accountContent.innerHTML = `
    <div class="account-grid">
      <div class="account-card">
        <h2>Profile</h2>
        <p><strong>Username:</strong> ${user.username || user.name}</p>
        <button class="secondary-btn" id="logoutBtn" type="button">Logout</button>
        <p><strong>Email:</strong> ${user.email}</p>
        <form id="profileForm">
          <input id="profileName" value="${user.name || user.username}" placeholder="Full name" required />
          <input id="profileUsername" value="${user.username || user.name}" placeholder="Username" required />
          <input id="profileEmail" value="${user.email}" placeholder="Email" required />
          <input id="profilePhone" value="${user.phone || ""}" placeholder="Phone number" />
          <button class="action-btn" type="submit">Save Profile</button>
        </form>
      </div>
      <div class="account-card">
        <h2>Saved Addresses</h2>
        <form id="addressForm">
          <input id="addressLine" placeholder="House / Apartment / Street" required />
          <input id="addressCity" placeholder="City" required />
          <input id="addressState" placeholder="State" required />
          <button class="action-btn" type="submit">Add Address</button>
        </form>
        <div class="address-list">
          ${addresses.length > 0 ? addresses.map((address, index) => `
            <div class="address-item">
              <strong>${address.line}</strong>
              <p>${address.city}, ${address.state}</p>
              <button class="secondary-btn" onclick="removeAddress(${index})">Remove</button>
            </div>
          `).join("") : '<div class="empty-state">No saved addresses yet.</div>'}
        </div>
      </div>
    </div>

    <div class="account-card">
      <h2>Order History & Tracking</h2>
      ${orders.length > 0 ? orders.map((order) => `
        <div class="order-card">
          <div class="order-head">
            <div>
              <strong>${order.id}</strong>
              <p>${order.date}</p>
            </div>
            <span class="status-pill">${order.status}</span>
          </div>
          <div class="tracking-steps">
            ${["Order placed", "Packed", "Shipped", "Out for delivery", "Delivered"].map((step) => `
              <div class="step ${step === order.status ? "active" : ""}">${step}</div>
            `).join("")}
          </div>
          <p>${order.tracking}</p>
          <div class="summary-box">
            ${order.items.map((item) => `<div class="summary-item"><span>${item.name}</span><strong>₹${item.price}</strong></div>`).join("")}
            <div class="summary-item"><span>Total</span><strong>₹${order.total}</strong></div>
          </div>
        </div>
      `).join("") : '<div class="empty-state">No orders yet. Your recent purchases will appear here.</div>'}
    </div>

    <div class="account-card">
      <h2>Recently Viewed</h2>
      <div class="related-grid">
        ${recent.length > 0 ? recent.map((item) => `
          <div class="related-card" onclick="openProduct('${item.id}')">
            <img src="${item.image}" alt="${item.name}" />
            <div>
              <h3>${item.name}</h3>
              <p>₹${item.price}</p>
            </div>
          </div>
        `).join("") : '<div class="empty-state">You have not viewed any products yet.</div>'}
      </div>
    </div>
  `;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("rezellUser");
      updateAuthUI();
      window.location.href = "index.html";
    });
  }

  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const updatedUser = {
        ...user,
        name: document.getElementById("profileName").value.trim(),
        username: document.getElementById("profileUsername").value.trim(),
        email: document.getElementById("profileEmail").value.trim(),
        phone: document.getElementById("profilePhone").value.trim()
      };
      saveLoggedUser(updatedUser);
      renderAccountPage();
    });
  }

  const addressForm = document.getElementById("addressForm");
  if (addressForm) {
    addressForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const line = document.getElementById("addressLine").value.trim();
      const city = document.getElementById("addressCity").value.trim();
      const state = document.getElementById("addressState").value.trim();
      if (!line || !city || !state) return;
      const updatedUser = { ...user, addresses: [...(user.addresses || []), { line, city, state }] };
      saveLoggedUser(updatedUser);
      renderAccountPage();
    });
  }
}

function removeAddress(index) {
  const user = getLoggedUser();
  if (!user) return;
  user.addresses = (user.addresses || []).filter((_, i) => i !== index);
  saveLoggedUser(user);
  renderAccountPage();
}

function initPage() {
  updateAuthUI();
  updateCounts();
  renderProducts();
  renderProductDetails();
  renderWishlist();
  renderCart();
  renderAccountPage();

  if (searchInput) {
    searchInput.addEventListener("keyup", (event) => {
      searchText = event.target.value;
      renderProducts();
    });
  }

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      categoryButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      activeCategory = button.dataset.category;
      renderProducts();
    });
  });

  setupCheckoutPage();
  setupLoginPage();
}

document.addEventListener("DOMContentLoaded", initPage);