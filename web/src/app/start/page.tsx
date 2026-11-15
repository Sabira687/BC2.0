import { StartForm } from "@/components/StartForm";

export const metadata = { title: "Start" };

export default function StartPage() {
  return (
    <>
      <div className="kicker">00 / About you · one minute</div>
      <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 3.75rem)", textTransform: "uppercase" }}>Let&apos;s make your items</h1>
      <p className="muted" style={{ maxWidth: 680 }}>
        Your answers pick the examples, the order of lessons and how your AI talks to you. No account.
      </p>
      <StartForm />
    </>
  );
}
