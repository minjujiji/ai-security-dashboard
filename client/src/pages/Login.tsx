import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const navigate = useNavigate();
  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      const response = await loginUser({
        email,
        password,
      });

      localStorage.setItem(
        "token",
        response.token
       );

       navigate("/dashboard");

      console.log(response);

      alert("Login successful");
    } catch (error) {
      console.error(error);

      alert("Login failed");
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />
        </div>

        <div>
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </div>

        <button type="submit">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;