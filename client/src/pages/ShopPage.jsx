import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import useProgress from "../hooks/useProgress";
import api from "../lib/api";
import { CARS, HOUSES, ROOM_CATEGORY_LIST, ROOM_TYPES } from "../assets/shop/shopAssets";
import "./ShopPage.css";

const CATEGORIES = [
  { id: "house", label: "Home", emoji: "🏠" },
  { id: "room", label: "Room", emoji: "🚪" },
  { id: "car", label: "Car", emoji: "🚗" },
];

const emptyInventory = {
  equippedHouse: null,
  equippedCar: null,
  equippedRooms: {
    living_room: null,
    kitchen: null,
    bedroom: null,
    bathroom: null,
    dining_room: null,
  },
  ownedHouses: [],
  ownedCars: [],
  ownedRooms: [],
};

const ShopPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getGuestStars } = useProgress();

  const [activeCategory, setActiveCategory] = useState("house");
  const [activeRoom, setActiveRoom] = useState(ROOM_CATEGORY_LIST[0].id);
  const [totalStars, setTotalStars] = useState(0);
  const [inventory, setInventory] = useState(emptyInventory);

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showPoorModal, setShowPoorModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [pendingMeta, setPendingMeta] = useState(null);

  const playUISound = (type) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "buy") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.24);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.36);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
    }

    osc.onended = () => {
      ctx.close().catch(() => {});
    };
  };

  useEffect(() => {
    const loadInventory = async () => {
      if (!user) {
        setTotalStars(getGuestStars());
        setInventory(emptyInventory);
        return;
      }

      try {
        const response = await api.get("/shop/inventory");
        setTotalStars(response.data.totalStars || 0);
        setInventory(response.data.inventory || emptyInventory);
      } catch {
        setTotalStars(user.totalStars || 0);
        setInventory(emptyInventory);
      }
    };

    loadInventory();
  }, [getGuestStars, user]);

  const ownedItems = useMemo(
    () => [...inventory.ownedHouses, ...inventory.ownedCars, ...inventory.ownedRooms],
    [inventory.ownedCars, inventory.ownedHouses, inventory.ownedRooms]
  );

  const getActiveItems = () => {
    if (activeCategory === "house") return HOUSES;
    if (activeCategory === "car") return CARS;
    if (activeCategory === "room") return ROOM_TYPES[activeRoom]?.items ?? [];
    return [];
  };

  const handleBuy = (item) => {
    const itemType = activeCategory;

    if (!user) {
      setPendingItem(item);
      setPendingMeta({ itemType });
      setShowLoginModal(true);
      return;
    }

    if (totalStars < item.price) {
      setPendingItem(item);
      setPendingMeta({ itemType });
      setShowPoorModal(true);
      return;
    }

    setPendingItem(item);
    setPendingMeta({ itemType });
    setShowBuyModal(true);
  };

  const confirmBuy = async () => {
    if (!pendingItem || !pendingMeta?.itemType) return;

    const itemType = pendingMeta.itemType;

    try {
      const response = await api.post("/shop/buy", {
        itemId: pendingItem.id,
        itemType,
        price: pendingItem.price,
      });

      const updateField =
        itemType === "house" ? "ownedHouses" : itemType === "car" ? "ownedCars" : "ownedRooms";

      setInventory((prev) => ({
        ...prev,
        [updateField]: [...prev[updateField], pendingItem.id],
      }));

      playUISound("buy");

      setTotalStars(response.data.newStarBalance || Math.max(0, totalStars - pendingItem.price));
      setShowBuyModal(false);
      setPendingItem(null);
      setPendingMeta(null);
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === "NOT_ENOUGH_STARS") {
        setShowBuyModal(false);
        setShowPoorModal(true);
      }
    }
  };

  return (
    <div className="shop-page">
      <Navbar />

      <div className="shop-header">
        <h1 className="shop-title">⭐ Star Shop</h1>
        <div className="shop-star-balance">⭐ {totalStars} Stars</div>
        <button className="btn-my-home" type="button" onClick={() => navigate("/my-home")}>
          🏠 My Home
        </button>
      </div>

      <div className="shop-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`cat-tab ${activeCategory === cat.id ? "cat-active" : ""}`}
            onClick={() => {
              setActiveCategory(cat.id);
              if (cat.id !== "room") {
                setActiveRoom(ROOM_CATEGORY_LIST[0].id);
              }
            }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {activeCategory === "room" && (
        <div className="shop-room-tabs">
          {ROOM_CATEGORY_LIST.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`room-tab ${activeRoom === room.id ? "room-tab-active" : ""}`}
              onClick={() => setActiveRoom(room.id)}
            >
              {room.emoji} {room.label}
            </button>
          ))}
        </div>
      )}

      <div className="shop-grid">
        {getActiveItems().map((item) => {
          const isOwned = ownedItems.includes(item.id);
          return (
            <div key={item.id} className={`shop-card ${isOwned ? "card-owned" : ""}`}>
              <div className="card-img-wrapper">
                <img src={item.image} alt={item.name} className="card-img" />
                {isOwned ? <div className="owned-badge">✅ Owned</div> : null}
              </div>
              <div className="card-info">
                <p className="card-name">{item.name}</p>
                <div className="card-price">⭐ {item.price}</div>
              </div>
              <button
                type="button"
                className={`btn-buy ${isOwned ? "btn-owned" : totalStars < item.price ? "btn-poor" : ""}`}
                onClick={() => handleBuy(item)}
                disabled={isOwned}
              >
                {isOwned ? "✅ Owned" : `Buy ⭐${item.price}`}
              </button>
            </div>
          );
        })}
      </div>

      {showPoorModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-emoji">😢</div>
            <h3>Not enough stars!</h3>
            <p>
              You need <strong>⭐ {pendingItem?.price}</strong> stars
              <br />
              but only have <strong>⭐ {totalStars}</strong>
            </p>
            <p className="modal-hint">Play games to earn more stars! 🎮</p>
            <div className="modal-buttons">
              <button className="btn-play-games" type="button" onClick={() => navigate("/")}>
                🎮 Play Games
              </button>
              <button
                className="btn-close-modal"
                type="button"
                onClick={() => {
                  setShowPoorModal(false);
                  setPendingItem(null);
                  setPendingMeta(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showBuyModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <img src={pendingItem?.image} className="modal-item-img" alt={pendingItem?.name || "item"} />
            <h3>Buy {pendingItem?.name}?</h3>
            <p>
              This costs <strong>⭐ {pendingItem?.price}</strong> stars
            </p>
            <div className="modal-buttons">
              <button className="btn-confirm-buy" type="button" onClick={confirmBuy}>
                ✅ Buy it!
              </button>
              <button
                className="btn-cancel"
                type="button"
                onClick={() => {
                  setShowBuyModal(false);
                  setPendingItem(null);
                  setPendingMeta(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>🔐 Login needed</h3>
            <p>You can browse the shop as a guest, but buying items requires an account.</p>
            <div className="modal-buttons">
              <button className="btn-confirm-buy" type="button" onClick={() => navigate("/login")}>
                Go to Login
              </button>
              <button
                className="btn-cancel"
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setPendingItem(null);
                  setPendingMeta(null);
                }}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
