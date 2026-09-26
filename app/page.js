"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

function hourLabel(key) {
  if (!key) return "this hour";
  const [d, h] = key.split("T");
  return `${d} · ${h}:00 UTC`;
}

export default function Home() {
  const [edition, setEdition] = useState(null);
  const [slips, setSlips] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    (async () => {
      await supabase.rpc("np_roll_hour");
      const { data: hour } = await supabase
        .from("np_hours")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setEdition(hour);
      const { data: publicSlips } = await supabase
        .from("np_slips")
        .select("id,title,body,created_at,author_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(24);
      setSlips(publicSlips || []);
    })();

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="wrap">
      <header className="mast">
        <div>
          <p className="kicker">Vol. I · printed on the hour</p>
          <h1 className="brand">
            The Night <em>Press</em>
          </h1>
          <nav className="nav">
            <Link href="/">Board</Link>
            <Link href="/desk">Desk</Link>
            <Link href="/login">{user ? "Account" : "Sign in"}</Link>
          </nav>
        </div>
        <div className="mast-meta">
          Composing room · London
          <br />
          Public slips stay on the wall
        </div>
      </header>

      <section className="edition">
        <div className="kicker">This hour · {hourLabel(edition?.hour_key)}</div>
        <h2>{edition?.headline || "Warming the plates…"}</h2>
        <p>{edition?.blurb || "The compositor is choosing a public slip for the next run."}</p>
      </section>

      <h2 style={{ fontFamily: "Fraunces, serif", marginBottom: 8 }}>On the board</h2>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Anything marked public is pinned here. Private copy stays in your desk.
      </p>
      <div className="grid">
        {slips.map((s, i) => (
          <article className="slip" key={s.id} style={{ animationDelay: `${i * 40}ms` }}>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <div className="meta">{new Date(s.created_at).toLocaleString()}</div>
          </article>
        ))}
        {!slips.length && (
          <article className="slip">
            <h3>Empty hooks</h3>
            <p>No public slips yet. Sign in, write something, and mark it public.</p>
          </article>
        )}
      </div>
    </div>
  );
}
