"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Desk() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [mine, setMine] = useState([]);
  const [err, setErr] = useState("");

  async function loadMine(uid) {
    const { data } = await supabase
      .from("np_slips")
      .select("*")
      .eq("author_id", uid)
      .order("created_at", { ascending: false });
    setMine(data || []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (!u) router.replace("/login");
      else loadMine(u.id);
    });
  }, [router]);

  async function save(e) {
    e.preventDefault();
    setErr("");
    const { error } = await supabase.from("np_slips").insert({
      author_id: user.id,
      title: title.trim(),
      body: body.trim(),
      is_public: isPublic,
    });
    if (error) setErr(error.message);
    else {
      setTitle("");
      setBody("");
      loadMine(user.id);
    }
  }

  async function togglePublic(slip) {
    await supabase.from("np_slips").update({ is_public: !slip.is_public, updated_at: new Date().toISOString() }).eq("id", slip.id);
    loadMine(user.id);
  }

  async function remove(id) {
    await supabase.from("np_slips").delete().eq("id", id);
    loadMine(user.id);
  }

  if (!user) return null;

  return (
    <div className="wrap">
      <header className="mast">
        <div>
          <p className="kicker">Private drawer + public hooks</p>
          <h1 className="brand">
            Your <em>desk</em>
          </h1>
          <nav className="nav">
            <Link href="/">Board</Link>
            <Link href="/login">Account</Link>
          </nav>
        </div>
      </header>

      <form onSubmit={save} style={{ margin: "28px 0" }}>
        <input required maxLength={140} placeholder="Headline" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea required rows={7} maxLength={8000} placeholder="Copy for the compositor" value={body} onChange={(e) => setBody(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Mark public — it will appear on the board and may print next hour
        </label>
        <button type="submit">File the slip</button>
        {err && <p className="err">{err}</p>}
      </form>

      <div className="grid">
        {mine.map((s) => (
          <article className="slip" key={s.id}>
            <div className="kicker">{s.is_public ? "Public" : "Private"}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <div className="meta" style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={() => togglePublic(s)}>
                {s.is_public ? "Make private" : "Make public"}
              </button>
              <button type="button" onClick={() => remove(s.id)} style={{ background: "#6b2a18" }}>
                Destroy
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
