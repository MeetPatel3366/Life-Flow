import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:4000";

export const useSocket = () => {
  const { user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      
      if (user._id) {
        socket.emit("join", user._id);
      }
      if (user.role === "hospital" && user.hospitalId) {
        socket.emit("joinHospital", user.hospitalId);
      }
      if (user.role === "admin") {
        socket.emit("joinAdmin");
      }
    });

    socket.on("newNotification", (data) => {
      toast(data.message, {
        icon: '🔔',
        duration: 5000,
      });
    });

    const handleEmergencyAlert = (data, title) => {
      toast.error(`${title}: ${data.bloodGroup} Blood Units!`, {
        duration: 10000,
        icon: '🚨',
        style: {
          background: '#dc2626',
          color: '#fff',
          fontWeight: 'bold',
          border: '2px solid #fff',
          padding: '16px',
        }
      });
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, context.currentTime);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
      } catch (e) {
        console.error("Audio beep failed", e);
      }
    };

    socket.on("emergency_request_created", (data) => handleEmergencyAlert(data, "EMERGENCY REQUEST"));
    socket.on("emergency_transfer_created", (data) => handleEmergencyAlert(data, "EMERGENCY TRANSFER"));
    socket.on("emergency_donor_alert", (data) => handleEmergencyAlert(data, "EMERGENCY DONOR ALERT"));
    socket.on("emergency:no-donor-found", (data) => handleEmergencyAlert(data, "NO COMPATIBLE DONOR FOUND"));

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  return socketRef.current;
};