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
  NeoBrutalSelect,
  NeoBrutalButton,
  NeoBrutalError,
  NeoBrutalHelperText,
} from "@/components/ui/neo-brutual-card";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("DISPATCHER");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name, role);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
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
        <NeoBrutalSubtitle>Create your account</NeoBrutalSubtitle>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <NeoBrutalError>{error}</NeoBrutalError>}

          <div>
            <NeoBrutalLabel htmlFor="name">Full Name</NeoBrutalLabel>
            <NeoBrutalInput
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ENTER FULL NAME"
              required
            />
          </div>

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
            <div className="relative">
              <NeoBrutalInput
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ENTER PASSWORD"
                minLength={6}
                required
                className="pr-20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black uppercase text-black/50 hover:text-black transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <NeoBrutalHelperText>Minimum 6 characters</NeoBrutalHelperText>
          </div>

          <div>
            <NeoBrutalLabel htmlFor="confirmPassword">
              Confirm Password
            </NeoBrutalLabel>
            <NeoBrutalInput
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="CONFIRM PASSWORD"
              required
            />
          </div>

          <div>
            <NeoBrutalLabel htmlFor="role">Role</NeoBrutalLabel>
            <NeoBrutalSelect
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="DISPATCHER">Dispatcher</option>
              <option value="FLEET_MANAGER">Fleet Manager</option>
              <option value="SAFETY_OFFICER">Safety Officer</option>
              <option value="FINANCIAL_ANALYST">Financial Analyst</option>
            </NeoBrutalSelect>
            <NeoBrutalHelperText>
              Select your role in the organization
            </NeoBrutalHelperText>
          </div>

          <NeoBrutalButton disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </NeoBrutalButton>

          <div className="text-center text-sm font-bold text-black/60">
            {"Already have an account? "}
            <Link
              to="/login"
              className="text-black underline underline-offset-4 hover:text-black/70"
            >
              Sign In
            </Link>
          </div>
        </form>
      </NeoBrutalCard>
    </AuthLayout>
  );
}
