import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ChatBot from "../components/ChatBot";

const CATEGORY_ICONS = {
  "Milk Tea": "🥛", "Fruit Tea": "🍓", "Classic Tea": "🍵", "Brewed Tea": "🍵",
  "Slush": "🧊", "Seasonal": "🌸", "Coffee": "☕",
};
