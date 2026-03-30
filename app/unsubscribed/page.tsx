import Link from "next/link";

export default function UnsubscribedPage({
  searchParams,
}: {
  searchParams: { status?: "success" | "error" };
}) {
  const status = searchParams?.status;
  const isSuccess = status === "success";

  const message = isSuccess
    ? "You've been unsubscribed"
    : "Something went wrong";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#ffffff",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "520px",
          width: "100%",
          textAlign: "center",
          background: "#f9fafb",
          color: "#1a1a1a",
          borderRadius: "12px",
          padding: "3rem 2rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "9999px",
            margin: "0 auto 1.25rem",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#DC2626",
            fontSize: "28px",
            fontWeight: 700,
          }}
        >
          {isSuccess ? "✓" : "!"}
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: "0.75rem",
          }}
        >
          {message}
        </h1>

        <p style={{ color: "#555555", lineHeight: 1.6 }}>
          {isSuccess ? "You will no longer receive emails from RegPulss." : "Please return to the homepage and try again."}
        </p>

        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: "2rem",
            padding: "0.75rem 2rem",
            background: "#DC2626",
            color: "#ffffff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to homepage
        </Link>
      </section>
    </main>
  );
}

