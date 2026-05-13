import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { ROOM_TYPES } from "../assets/shop/shopAssets";
import "./RoomPage.css";

const emptyInventory = {
  equippedRooms: {
    living_room: null,
    kitchen: null,
    bedroom: null,
    bathroom: null,
    dining_room: null,
  },
  ownedRooms: [],
};

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inventory, setInventory] = useState(emptyInventory);
  const [showChangePicker, setShowChangePicker] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const roomMeta = ROOM_TYPES[roomId];

  useEffect(() => {
    if (!roomMeta) {
      navigate("/my-home", { replace: true });
    }
  }, [navigate, roomMeta]);

  useEffect(() => {
    const loadInventory = async () => {
      if (!user) {
        setInventory(emptyInventory);
        return;
      }

      try {
        const response = await api.get("/api/shop/inventory");
        setInventory(response.data.inventory || emptyInventory);
      } catch {
        setInventory(emptyInventory);
      }
    };

    loadInventory();
  }, [user]);

  useEffect(() => {
    console.log("[RoomPage] roomId:", roomId);
    console.log("[RoomPage] inventory:", inventory);
    console.log("[RoomPage] equippedRooms:", inventory?.equippedRooms);
    console.log("[RoomPage] ownedRooms:", inventory?.ownedRooms);
  }, [inventory, roomId]);

  const equippedId = inventory?.equippedRooms?.[roomId];

  const ownedRoomItems = useMemo(
    () => (roomMeta?.items ?? []).filter((item) => (inventory?.ownedRooms ?? []).includes(item.id)),
    [inventory?.ownedRooms, roomMeta]
  );

  const displayId = equippedId ?? ownedRoomItems[0]?.id ?? null;

  const displayItem = useMemo(
    () => roomMeta?.items.find((item) => item.id === displayId),
    [displayId, roomMeta]
  );

  useEffect(() => {
    console.log("[RoomPage] ownedRoomItems for", roomId, ":", ownedRoomItems);
  }, [ownedRoomItems, roomId]);

  const handleEquipRoom = async (itemId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!itemId) return;

    try {
      await api.post("/api/shop/equip", {
        itemId,
        itemType: "room",
        roomType: roomId,
      });

      setInventory((prev) => ({
        ...prev,
        equippedRooms: {
          ...prev.equippedRooms,
          [roomId]: itemId,
        },
      }));

      setShowChangePicker(false);
      setSelectedRoom(null);
    } catch {
      // Ignore temporary server errors to keep UI responsive.
    }
  };

  if (!roomMeta) {
    return null;
  }

  return (
    <div className="room-page">
      <Navbar />

      <div className="room-display">
        {displayItem ? (
          <img src={displayItem.image} alt={displayItem.name} className="room-img" />
        ) : (
          <div className="room-empty">
            <p>🛒 You don't have this room yet!</p>
            <button type="button" onClick={() => navigate("/shop")}>
              Go to Shop ⭐
            </button>
          </div>
        )}
      </div>

      <div className="room-label-bar">
        <h2>
          {roomMeta.emoji} {roomMeta.label}
        </h2>
        {ownedRoomItems.length >= 1 ? (
          <button className="btn-change-room" type="button" onClick={() => setShowChangePicker(true)}>
            🔄 Change Room
          </button>
        ) : null}
        <button className="btn-back" type="button" onClick={() => navigate("/my-home")}>
          ← Back
        </button>
      </div>

      {showChangePicker && (
        <div className="modal-overlay">
          <div className="modal-card modal-large">
            <h3>🔄 Choose {roomMeta.label} Style</h3>
            <div className="room-shop-grid">
              {ownedRoomItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`room-shop-card ${selectedRoom === item.id ? "room-shop-selected" : ""}`}
                  onClick={() => setSelectedRoom(item.id)}
                >
                  <div className="room-shop-image-wrap">
                    <img src={item.image} alt={item.name} className="room-shop-img" />
                    {selectedRoom === item.id ? <div className="room-selected-badge">Selected</div> : null}
                  </div>
                  <div className="room-shop-name">{item.name}</div>
                </button>
              ))}
            </div>
            <div className="modal-buttons">
              <button
                className="btn-save"
                type="button"
                onClick={() => handleEquipRoom(selectedRoom)}
                disabled={!selectedRoom}
              >
                💾 Save
              </button>
              <button
                className="btn-cancel"
                type="button"
                onClick={() => {
                  setShowChangePicker(false);
                  setSelectedRoom(null);
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
            <p>Please login to save room changes.</p>
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

export default RoomPage;
