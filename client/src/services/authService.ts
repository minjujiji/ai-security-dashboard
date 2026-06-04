import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const registerUser = async (userData: any) => {
  const response = await axios.post(
    `${API_URL}/register`,
    userData
  );

  console.log("response:", response)

  return response.data;
};

export const loginUser = async (userData: any) => {
  const response = await axios.post(
    `${API_URL}/login`,
    userData
  );

  return response.data;
};