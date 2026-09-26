"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErr(error.message);
      else setMsg("Account created. If confirmations are on, check your inbox, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
      else router.push("/desk");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <div className="wrap">
      <header className="mast">
        <div>
          <p className="kicker">Composing room pass</p>
          <h1 className="brand">
            Sign <em>in</em>
          </h1>
          <nav className="nav">
            <Link href="/">Board</Link>
            <Link href="/desk">Desk</Link>
          </nav>
        </div>
      </header>

      {user ? (
        <section className="edition">
          <p>You are in as {user.email}.</p>
          <button onClick={signOut}>Sign out</button>
        </section>
      ) : (
        <form onSubmit={submit} style={{ marginTop: 28 }}>
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required minLength={6} placeholder="Password (6+)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit">{mode === "signup" ? "Create account" : "Enter"}</button>
            <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} style={{ background: "transparent", color: "var(--ink)", border: "1px solid var(--rule)" }}>
              {mode === "signup" ? "Have a pass?" : "Need a pass?"}
            </button>
          </div>
          {err && <p className="err">{err}</p>}
          {msg && <p className="ok">{msg}</p>}
        </form>
      )}
    </div>
  );
}
