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

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/login", { email, password });

      dispatch(
        setCredentials({
          user: res.data.data.user,
          token: res.data.token,
        })
      );

      navigate("/home");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
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
            Login to Circle
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
                Email *
              </Label>
              <Input
                className="bg-[#121212] border-[#2a2a2a] text-white focus:border-green-500"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-muted-foreground text-xs">
                  Password *
                </Label>
              </div>

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
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-green-500 hover:underline"
            >
              Create account
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
