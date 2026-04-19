import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import {
  CAR_AUDIO,
  CARS,
  getTimeBackground,
  HOME_AUDIO,
  HOUSES,
  ROOM_CATEGORY_LIST,
} from "../assets/shop/shopAssets";
import "./MyHomePage.css";

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

const MyHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inventory, setInventory] = useState(emptyInventory);
  const [showHouseMenu, setShowHouseMenu] = useState(false);
  const [showChangeHouse, setShowChangeHouse] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [showCarMenu, setShowCarMenu] = useState(false);
  const [showChangeCar, setShowChangeCar] = useState(false);
  const [showNoCarModal, setShowNoCarModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);

  const bgImage = getTimeBackground();

  useEffect(() => {
    const loadInventory = async () => {
      if (!user) {
        setInventory(emptyInventory);
        return;
      }

      try {
        const response = await api.get("/shop/inventory");
        setInventory(response.data.inventory || emptyInventory);
      } catch {
        setInventory(emptyInventory);
      }
    };

    loadInventory();
  }, [user]);

  const playAudio = (type) => {
    const audio = new Audio(type === "home" ? HOME_AUDIO : CAR_AUDIO);
    audio.play().catch(() => {});
  };

  const playUISound = (type) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "room-select") {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }

    osc.onended = () => {
      ctx.close().catch(() => {});
    };
  };

  const ownedHouses = inventory.ownedHouses || [];
  const ownedCars = inventory.ownedCars || [];

  const equippedHouseImg = useMemo(() => {
    const houseId = inventory.equippedHouse || ownedHouses[0] || null;
    return HOUSES.find((item) => item.id === houseId)?.image || HOUSES[0]?.image;
  }, [inventory.equippedHouse, ownedHouses]);

  const equippedCarImg = useMemo(() => {
    const carId = inventory.equippedCar || inventory.ownedCars?.[0] || null;
    return CARS.find((item) => item.id === carId)?.image || CARS[0]?.image;
  }, [inventory.equippedCar, inventory.ownedCars]);

  const handleEquip = async (itemId, itemType) => {
    if (!itemId || !user) return;

    try {
      await api.post("/shop/equip", { itemId, itemType });
      if (itemType === "house") {
        setInventory((prev) => ({ ...prev, equippedHouse: itemId }));
        setShowChangeHouse(false);
        setSelectedHouse(null);
      }
      if (itemType === "car") {
        setInventory((prev) => ({ ...prev, equippedCar: itemId }));
        setShowChangeCar(false);
        setSelectedCar(null);
      }
    } catch {
      // Silently ignore server errors to keep interaction simple for kids.
    }
  };

  return (
    <div className="myhome-page">
      <Navbar />

      <div className="myhome-frame">
        <img src={bgImage} alt="background" className="myhome-bg" />

        <div className="myhome-scene">
          <div className="scene-col scene-left">
            <div className="scene-tree" />
          </div>

          <div className="scene-col scene-center">
            <div
              className="house-wrapper"
              onClick={() => {
                playAudio("home");
                if (!user) {
                  setShowLoginModal(true);
                  return;
                }
                setShowHouseMenu(true);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  playAudio("home");
                  if (!user) {
                    setShowLoginModal(true);
                    return;
                  }
                  setShowHouseMenu(true);
                }
              }}
            >
              <img src={equippedHouseImg} alt="Your House" className="house-img" />
              <div className="item-action-slot" />
            </div>
          </div>

          <div className="scene-col scene-right">
            <div className="car-wrapper">
              <img
                src={equippedCarImg}
                alt="Your Car"
                className="car-img"
                onClick={() => {
                  playAudio("car");
                  setShowCarMenu(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    playAudio("car");
                    setShowCarMenu(true);
                  }
                }}
              />
              <div className="item-action-slot" />
            </div>
          </div>
        </div>
      </div>

      {showHouseMenu && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>🏠 What would you like to do?</h3>
            <div className="house-menu-options">
              <button
                className="menu-option-btn"
                type="button"
                onClick={() => {
                  setShowHouseMenu(false);
                  setShowChangeHouse(true);
                }}
              >
                🔄 Change House
              </button>

              <button
                className="menu-option-btn"
                type="button"
                onClick={() => {
                  setShowHouseMenu(false);
                  setShowRoomPicker(true);
                }}
              >
                🚪 Visit a Room
              </button>
            </div>
            <button className="btn-cancel" type="button" onClick={() => setShowHouseMenu(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showChangeHouse && (
        <div className="modal-overlay">
          <div className="modal-card modal-large">
            <h3>🏠 Choose Your House</h3>

            {ownedHouses.length === 0 ? (
              <p className="empty-note">You do not own a house yet. Visit the shop first.</p>
            ) : (
              <div className="item-picker-grid">
                {ownedHouses.map((houseId) => {
                  const house = HOUSES.find((h) => h.id === houseId);
                  if (!house) return null;
                  return (
                    <button
                      key={houseId}
                      type="button"
                      className={`picker-item ${selectedHouse === houseId ? "picker-selected" : ""}`}
                      onClick={() => setSelectedHouse(houseId)}
                    >
                      <div className="picker-image-box">
                        <img src={house.image} alt={house.name} />
                      </div>
                      <span>{house.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="modal-buttons">
              <button
                className="btn-save"
                type="button"
                onClick={() => handleEquip(selectedHouse, "house")}
                disabled={!selectedHouse}
              >
                💾 Save
              </button>
              <button
                className="btn-cancel"
                type="button"
                onClick={() => {
                  setShowChangeHouse(false);
                  setSelectedHouse(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoomPicker && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>🚪 Which room would you like to visit?</h3>
            <div className="room-picker-grid">
              {ROOM_CATEGORY_LIST.map((room) => (
                <button
                  key={room.id}
                  className="room-pick-btn"
                  type="button"
                  onClick={() => {
                    playUISound("room-select");
                    setShowRoomPicker(false);
                    navigate(`/room/${room.id}`);
                  }}
                >
                  <span className="room-emoji">{room.emoji}</span>
                  <span className="room-label">{room.label}</span>
                </button>
              ))}
            </div>
            <button className="btn-cancel" type="button" onClick={() => setShowRoomPicker(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showCarMenu && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>🚗 What would you like to do?</h3>
            <div className="house-menu-options">
              <button
                className="menu-option-btn"
                type="button"
                onClick={() => {
                  setShowCarMenu(false);
                  if (!user) {
                    setShowLoginModal(true);
                    return;
                  }
                  if (ownedCars.length === 0) {
                    setShowNoCarModal(true);
                    return;
                  }
                  setShowChangeCar(true);
                }}
              >
                🔄 Change Car
              </button>
            </div>
            <button className="btn-cancel" type="button" onClick={() => setShowCarMenu(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showChangeCar && (
        <div className="modal-overlay">
          <div className="modal-card modal-large">
            <h3>🚗 Choose Your Car</h3>

            <div className="car-shop-grid">
              {ownedCars.map((carId) => {
                const car = CARS.find((c) => c.id === carId);
                if (!car) return null;
                return (
                  <button
                    key={carId}
                    type="button"
                    className={`car-shop-card ${selectedCar === carId ? "car-shop-selected" : ""}`}
                    onClick={() => setSelectedCar(carId)}
                  >
                    <div className="car-shop-image-wrap">
                      <img src={car.image} alt={car.name} className="car-shop-img" />
                      {selectedCar === carId ? <div className="car-selected-badge">Selected</div> : null}
                    </div>
                    <div className="car-shop-name">{car.name}</div>
                  </button>
                );
              })}
            </div>

            <div className="modal-buttons">
              <button
                className="btn-save"
                type="button"
                onClick={() => handleEquip(selectedCar, "car")}
                disabled={!selectedCar}
              >
                💾 Save
              </button>
              <button
                className="btn-cancel"
                type="button"
                onClick={() => {
                  setShowChangeCar(false);
                  setSelectedCar(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoCarModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>🚗 No cars yet</h3>
            <p>You do not own any cars yet. Visit the shop to buy one.</p>
            <div className="modal-buttons">
              <button
                className="btn-save"
                type="button"
                onClick={() => {
                  setShowNoCarModal(false);
                  navigate("/shop");
                }}
              >
                Go to Shop
              </button>
              <button className="btn-cancel" type="button" onClick={() => setShowNoCarModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>🔐 Login needed</h3>
            <p>Login to save and customize your home.</p>
            <div className="modal-buttons">
              <button className="btn-save" type="button" onClick={() => navigate("/login")}>
                Go to Login
              </button>
              <button className="btn-cancel" type="button" onClick={() => setShowLoginModal(false)}>
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyHomePage;
