import { GoogleOneTap, SignIn } from "@clerk/nextjs";

// One Tap only works once Google is set up with your own OAuth credentials in Clerk
const oneTapEnabled = process.env.NEXT_PUBLIC_GOOGLE_ONE_TAP === "true";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Repwise</h1>
      <p className="mt-2 mb-8 text-muted">Log your workouts, set by set.</p>
      {oneTapEnabled && <GoogleOneTap />}
      <SignIn routing="hash" withSignUp />
    </main>
  );
}
