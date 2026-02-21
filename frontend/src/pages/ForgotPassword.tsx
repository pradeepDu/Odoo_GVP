import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "@/lib/api";
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
  NeoBrutalSuccess,
} from "@/components/ui/neo-brutual-card";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email);
      setSuccess(result.message);
      setEmail("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to send reset email";
      setError(msg);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <NeoBrutalCard>
        <NeoBrutalTitle>Reset Password</NeoBrutalTitle>
        <NeoBrutalSubtitle>
          {"Enter your email and we'll send a reset link"}
        </NeoBrutalSubtitle>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <NeoBrutalError>{error}</NeoBrutalError>}

          {success && (
            <NeoBrutalSuccess>
              <p className="font-black uppercase">Email sent!</p>
              <p className="mt-1">{success}</p>
              <p className="mt-2 text-xs">
                Check your inbox and spam folder. The link expires in 1 hour.
              </p>
            </NeoBrutalSuccess>
          )}

          <div>
            <NeoBrutalLabel htmlFor="email">Email Address</NeoBrutalLabel>
            <NeoBrutalInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER EMAIL"
              disabled={loading}
              required
            />
          </div>

          <NeoBrutalButton disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </NeoBrutalButton>

          <div className="text-center text-sm font-bold">
            <Link
              to="/login"
              className="text-black/60 underline underline-offset-4 hover:text-black transition-colors"
            >
              {"<- Back to Login"}
            </Link>
          </div>
        </form>
      </NeoBrutalCard>
    </AuthLayout>
  );
}
