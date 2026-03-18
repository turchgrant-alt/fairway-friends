import { useState } from "react";
import { Navigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface AuthPageProps {
  defaultTab?: "signin" | "signup";
}

export default function AuthPage({ defaultTab = "signin" }: AuthPageProps) {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  if (user) {
    return <Navigate to="/home" replace />;
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(signInEmail.trim(), signInPassword);
      toast({
        title: "Signed in",
        description: "Your Fairway Friends account is ready.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not sign in",
        description: error instanceof Error ? error.message : "Try your credentials again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signUp(signUpEmail.trim(), signUpPassword, signUpUsername.trim());
      toast({
        title: "Account created",
        description: "Your Fairway Friends profile is ready. Sign in if email confirmation is required.",
      });
      setActiveTab("signin");
      setSignInEmail(signUpEmail.trim());
      setSignInPassword(signUpPassword);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not create account",
        description: error instanceof Error ? error.message : "Try a different email or username.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--golfer-mist))_0%,hsl(var(--golfer-cream))_18rem,hsl(var(--background))_60rem)]">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.45),_transparent_28%),linear-gradient(180deg,rgba(9,28,20,0.96)_0%,rgba(16,44,31,0.88)_55%,transparent_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.1fr)_28rem] lg:items-center">
          <div className="text-white">
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-white/62">⛳ Fairway Friends</p>
            <h1 className="mt-5 max-w-3xl text-4xl leading-tight sm:text-5xl">
              Save your rankings, keep your course history, and compare with friends.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
              Supabase now powers authentication and persistent rankings while the live course catalog stays local and
              fast.
            </p>
          </div>

          <Card className="rounded-[28px] border-[hsl(var(--golfer-line))] bg-white shadow-[0_32px_90px_-55px_rgba(12,25,19,0.45)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl text-[hsl(var(--golfer-deep))]">Welcome back</CardTitle>
              <CardDescription className="text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.76]">
                Create an account or sign in to persist your rankings and share them with friends.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")}>
                <TabsList className="grid w-full grid-cols-2 rounded-full bg-[hsl(var(--golfer-cream))] p-1">
                  <TabsTrigger value="signin" className="rounded-full">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-full">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6">
                  <form className="space-y-4" onSubmit={handleSignIn}>
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        autoComplete="email"
                        value={signInEmail}
                        onChange={(event) => setSignInEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        autoComplete="current-password"
                        value={signInPassword}
                        onChange={(event) => setSignInPassword(event.target.value)}
                        placeholder="Your password"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-full bg-[hsl(var(--golfer-deep))] text-white hover:bg-[hsl(var(--golfer-deep))]/95"
                      disabled={isSubmitting || loading}
                    >
                      {isSubmitting && activeTab === "signin" ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form className="space-y-4" onSubmit={handleSignUp}>
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">Username</Label>
                      <Input
                        id="signup-username"
                        type="text"
                        autoComplete="username"
                        value={signUpUsername}
                        onChange={(event) => setSignUpUsername(event.target.value)}
                        placeholder="pick a username"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        value={signUpEmail}
                        onChange={(event) => setSignUpEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        value={signUpPassword}
                        onChange={(event) => setSignUpPassword(event.target.value)}
                        placeholder="Create a password"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-full bg-[hsl(var(--golfer-deep))] text-white hover:bg-[hsl(var(--golfer-deep))]/95"
                      disabled={isSubmitting || loading}
                    >
                      {isSubmitting && activeTab === "signup" ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
