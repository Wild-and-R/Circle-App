import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/register", {
        username,
        full_name: fullName || null,
        email,
        password,
      });

      dispatch(
        setCredentials({
          user: res.data.data.user,
          token: res.data.token,
        })
      );

      navigate("/home");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <Card className="w-full max-w-sm bg-[#1a1a1a] border-none shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <p className="text-green-500 font-semibold text-xl">circle</p>
          <CardTitle className="text-white text-lg">
            Create account Circle
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <p className="mb-4 text-sm text-red-500 text-center">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">
                Username *
              </Label>
              <Input
                className="bg-[#121212] border-[#2a2a2a] text-white focus:border-green-500"
                placeholder="Username (There is no changing username)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">
                Full Name
              </Label>
              <Input
                className="bg-[#121212] border-[#2a2a2a] text-white focus:border-green-500"
                placeholder="Full Name (optional)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">
                Email *
              </Label>
              <Input
                type="email (There is no changing email)"
                className="bg-[#121212] border-[#2a2a2a] text-white focus:border-green-500"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">
                Password *
              </Label>
              <Input
                type="password"
                className="bg-[#121212] border-[#2a2a2a] text-white focus:border-green-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold rounded-full"
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-green-500 hover:underline"
            >
              Login
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
