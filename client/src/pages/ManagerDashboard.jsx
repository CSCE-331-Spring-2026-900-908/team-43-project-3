import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const TABS = ["Menu", "Inventory", "Employees", "Reports"];