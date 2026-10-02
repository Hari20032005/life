"""Generates single-fix mutants of broken/App.jsx (mut1..mut5) to prove each check isolates ONE bug.
Run from labs/week-3:  python3 single-fix-mutants.py && for n in 1 2 3 4 5; do node check.mjs mut$n; done; rm -rf mut* .build-mut*
Expected: in mutN output only check N passes."""
import os, re, shutil
src=open('broken/App.jsx').read()
def w(n, s):
    os.makedirs(f'mut{n}', exist_ok=True); open(f'mut{n}/App.jsx','w').write(s)
def rep(s, a, b):
    assert a in s, a; return s.replace(a, b)
# 1: stable effect dependency only
s=rep(src,'const filters = { status: "booked" };','const status = "booked";'); s=rep(s,'"/api/bookings?status=" + filters.status','"/api/bookings?status=" + status'); s=rep(s,'}, [filters]);','}, [status]);'); w(1,s)
# 2: stable keys only
w(2, rep(src,'key={i}','key={b.id}'))
# 3: restore session only
w(3, rep(src,'  async function cancel(id)','  useEffect(() => { fetch("/api/me", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((u) => u && setUser(u)); }, []);\n\n  async function cancel(id)'))
# 4: validation only
s=rep(src,'    await fetch("/api/bookings", { method: "POST"','    if (!name.trim()) { setMessage(""); setErr("Please enter your name"); return; }\n    await fetch("/api/bookings", { method: "POST"'); s=rep(s,'const [message, setMessage] = useState("");','const [message, setMessage] = useState("");\n  const [err, setErr] = useState("");'); s=rep(s,'<p role="status">{message}</p>','{err && <p role="alert">{err}</p>}<p role="status">{message}</p>'); w(4,s)
# 5: explicit time zone only
w(5, rep(src,'new Date(booking.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })','new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(new Date(booking.startsAt))'))
