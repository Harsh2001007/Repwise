import { GoogleOneTap, SignIn } from "@clerk/nextjs";

// One Tap only works once Google is set up with your own OAuth credentials in Clerk
const oneTapEnabled = process.env.NEXT_PUBLIC_GOOGLE_ONE_TAP === "true";

const BACKGROUND_IMAGE = "https://i.pinimg.com/736x/71/db/70/71db70b3b8da3102b59f565a56d7f20d.jpg";

export default function LoginPage() {
  return (
    <div
      className="flex flex-1 flex-col bg-black bg-cover bg-center"
      style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }}
    >
      {/* dark layer keeps the title readable over any part of the photo */}
      <main className="flex flex-1 flex-col items-center justify-center bg-black/60 px-4 py-12 text-white">
        <h1 className="text-4xl font-bold tracking-tight">Repwise</h1>
        <p className="mt-2 mb-8 text-white/70">Log your workouts, set by set.</p>
        {oneTapEnabled && <GoogleOneTap />}
        <SignIn routing="hash" withSignUp />
      </main>
    </div>
  );
}
