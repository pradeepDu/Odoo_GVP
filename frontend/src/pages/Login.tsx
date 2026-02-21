import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { showApiError } from "@/lib/toast";
import { AuthLayout } from "@/components/auth-layout";
import {
  NeoBrutalCard,
  NeoBrutalTitle,
  NeoBrutalSubtitle,
  NeoBrutalLabel,
  NeoBrutalInput,
  NeoBrutalButton,
  NeoBrutalError,
} from "@/components/ui/neo-brutual-card";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <NeoBrutalCard>
        <NeoBrutalTitle>FleetFlow</NeoBrutalTitle>
        <NeoBrutalSubtitle>Sign in to your account</NeoBrutalSubtitle>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <NeoBrutalError>{error}</NeoBrutalError>}

          <div>
            <NeoBrutalLabel htmlFor="email">Email</NeoBrutalLabel>
            <NeoBrutalInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER EMAIL"
              required
            />
          </div>

          <div>
            <NeoBrutalLabel htmlFor="password">Password</NeoBrutalLabel>
            <NeoBrutalInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER PASSWORD"
              required
            />
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-bold text-black/60 underline underline-offset-4 hover:text-black transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <NeoBrutalButton disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </NeoBrutalButton>

          <div className="text-center text-sm font-bold text-black/60">
            {"Don't have an account? "}
            <Link
              to="/register"
              className="text-black underline underline-offset-4 hover:text-black/70"
            >
              Create Account
            </Link>
          </div>
        </form>
      </NeoBrutalCard>
    </AuthLayout>
  );
}
