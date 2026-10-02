"""Maintainer tool: re-introduce ONE bug at a time into a lab's fixed solution to prove each check isolates its own bug.
Usage: python3 labs/tools/inject-single-bugs.py <week>   (weeks 0,1,2,4,5)  then, per injN folder:  node labs/week-<w>/check.mjs inj<N>
Expected: exactly check N fails. Delete the injN folders afterwards (they are git-ignored).
Week 1 needs Postgres (see labs/README.md)."""
import os, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))   # work from labs/ whatever the caller's cwd
WEEK = sys.argv[1] if len(sys.argv) > 1 else ""

# ===== weeks 2 and 5 =====
if WEEK in ("2", "5"):
    import os, sys
    def rd(p): return open(p).read()
    def put(d, name, s):
        os.makedirs(d, exist_ok=True); open(os.path.join(d, name), 'w').write(s)
    def rep(s, a, b):
        assert a in s, a[:60]; return s.replace(a, b, 1)
    
    # ---------- Week 2: fixed server + ONE bug re-introduced
    f = rd('week-2/fixed/server.mjs')
    m = {}
    m[1] = rep(rep(f, 'return salt.toString("hex") + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");', 'return pw;'),
               'function checkPassword(pw, stored) {', 'function checkPassword(pw, stored) { return pw === stored; }\nfunction _unused(pw, stored) {')
    m[2] = rep(rep(f, 'if (typeof claims.exp !== "number" || claims.exp < Math.floor(Date.now() / 1000)) return null;', ''),
               'return send(res, 200, { token: sign({ sub: user.id, iat: now, exp: now + 3600 }) });', 'return send(res, 200, { token: sign({ sub: user.id, iat: now }) });')
    m[3] = rep(rep(f, 'db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(String(body.email));',
                      'db.prepare(`SELECT * FROM users WHERE email = \'${body.email}\'`).get();'),
               'const ok = checkPassword(String(body.password), user ? user.password_hash : DUMMY);', 'const ok = !!user && checkPassword(String(body.password), user.password_hash);')
    m[4] = rep(f, 'WHERE id = ? AND user_id = ?").run(Number(m[1]), claims.sub);', 'WHERE id = ?").run(Number(m[1]));')
    m[5] = rep(rep(f, 'const SECRET = process.env.JWT_SECRET;', 'const SECRET = "supersecret123";'), 'if (!SECRET) throw new Error("JWT_SECRET is required");', '')
    for k, s in m.items(): put(f'week-2/inj{k}', 'server.mjs', s)
    
    # ---------- Week 5: fixed pipeline + ONE bug re-introduced
    f = rd('week-5/fixed/receptionist.mjs')
    m = {}
    m[1] = rep(f, 'const id = store.nextActionId++;\n        store.pending.push({ id, userId, kind: "cancel_booking", bookingId: call.input.id, used: false });   // "all" is not a thing a tool may ask for\n        pending.push(id);',
                  'for (const b of store.bookings) if (call.input.all || b.id === call.input.id) b.status = "cancelled";')
    m[2] = rep(f, 'function chunk(doc) {', 'function chunk(doc, size = 12) {\n  const w = doc.text.split(/\\s+/); const out = [];\n  for (let i = 0; i < w.length; i += size) out.push({ doc: doc.name, text: w.slice(i, i + size).join(" ") });\n  return out;\n}\nfunction _unusedChunk(doc) {')
    m[3] = rep(rep(f, 'if (!HAS_OFFSET.test(s) || Number.isNaN(Date.parse(s))) return', 'if (Number.isNaN(Date.parse(s))) return'), 'startsAt: new Date(s), used: false', 'startsAt: new Date(s), used: false')
    m[4] = rep(f, 'const recent = history.slice(-HISTORY_TURNS);', 'const recent = history;')
    m[5] = rep(f, 'const MIN_SCORE = 0.3;', 'const MIN_SCORE = 0;')
    for k, s in m.items():
        # the bug-5 mutant must still answer something for unknown questions: with MIN_SCORE 0 retrieve(...).filter(score>=0) keeps the best chunk
        put(f'week-5/inj{k}', 'receptionist.mjs', s)

# ===== weeks 0 and 1 =====
if WEEK in ("0", "1"):
    import os, shutil
    def rd(p): return open(p).read()
    def rep(s, a, b):
        assert a in s, a[:70]; return s.replace(a, b, 1)
    def mk(week, n, files):
        d=f'week-{week}/inj{n}'; shutil.rmtree(d, ignore_errors=True); shutil.copytree(f'week-{week}/fixed', d)
        for rel, s in files.items():
            os.makedirs(os.path.dirname(os.path.join(d, rel)) or d, exist_ok=True); open(os.path.join(d, rel),'w').write(s)
    
    # ---- Week 0
    html=rd('week-0/fixed/index.html'); css=rd('week-0/fixed/styles/main.css'); js=rd('week-0/fixed/js/app.js')
    mk(0,1,{'index.html': rep(html,'images/hero.svg','image/Hero.svg')})
    mk(0,2,{'styles/main.css': '#actions button { background: grey; color: white; }\n'+css})
    mk(0,3,{'styles/main.css': rep(css,'.card { width: 100%; max-width: 400px;','.card { width: 400px;')})
    mk(0,4,{'index.html': rep(html,'<label for="email">Email</label> ','Email ')})
    silent=rep(js,'    if (!res.ok) throw new Error(`HTTP ${res.status}`);\n','')
    silent=silent[:silent.index('  } catch (e) {')]+'  } catch (e) {}\n}\n'+silent[silent.index('function render()'):]
    mk(0,5,{'js/app.js': silent})
    dbl=rep(js,'function render() {\n  list.replaceChildren();','function render() {\n  list.replaceChildren();\n  document.querySelector("#add").addEventListener("click", () => addProject());')
    dbl=rep(dbl,'// attached once, outside render()\ndocument.querySelector("#add").addEventListener("click", () => {\n  projects = [...projects, { name: "New project " + (projects.length + 1) }];\n  render();\n});','function addProject() {\n  projects = [...projects, { name: "New project " + (projects.length + 1) }];\n  render();\n}')
    mk(0,6,{'js/app.js': dbl})
    
    # ---- Week 1
    srv=rd('week-1/fixed/server.mjs'); mig=rd('week-1/fixed/migrations/002_fix_schema.sql')
    mk(1,1,{'server.mjs': rep(srv,'pool.query("SELECT id, name FROM customers WHERE name ILIKE $1 ORDER BY id", [`%${q}%`])','pool.query(`SELECT id, name FROM customers WHERE name ILIKE \'%${q}%\' ORDER BY id`)')})
    mk(1,2,{'server.mjs': rep(srv,'const booking = await getBooking(','const booking = getBooking(')})
    mk(1,3,{'server.mjs': rep(srv,'if (e.code === "23503") return send(res, 400, { error: "Unknown customer, service or staff" });','if (e.code === "23503") return send(res, 200, { error: "Unknown customer, service or staff" });')})
    fk_start=mig.index('-- Fix 1'); fk_end=mig.index('-- Fix 2')
    mk(1,4,{'migrations/002_fix_schema.sql': mig[:fk_start]+mig[fk_end:]})
    mk(1,5,{'server.mjs': rep(srv,'const r = await pool.query("SELECT id, customer_id, service_id, status FROM bookings ORDER BY id");        // pool.query releases for us\n        return send(res, 200, r.rows);','const client = await pool.connect();\n        const r = await client.query("SELECT id, customer_id, service_id, status FROM bookings ORDER BY id");\n        return send(res, 200, r.rows);')})
    mk(1,6,{'migrations/002_fix_schema.sql': mig[:mig.index('-- Fix 2')], 'server.mjs': rep(srv,'SUM(s.price)::int','SUM(s.price::int)::int')})
    mk(1,7,{'server.mjs': rep(rep(srv,'WHERE b.status <> \'cancelled\'\n          GROUP BY s.id, s.name','JOIN staff_hours h ON h.staff_id = b.staff_id\n          WHERE b.status <> \'cancelled\'\n          GROUP BY s.id, s.name, h.weekday'),'x','x')})

# ===== week 4 (config audit: also tries realistic PARTIAL fixes: empty value, trailing slash, half-configured volume) =====
if WEEK == "4":
    import os, shutil, re
    def rd(p): return open(p).read()
    def rep(s, a, b):
        assert a in s, a[:70]; return s.replace(a, b, 1)
    def mk(name, files):
        d=f'week-4/{name}'; shutil.rmtree(d, ignore_errors=True); shutil.copytree('week-4/fixed', d)
        for rel, s in files.items(): open(os.path.join(d, rel),'w').write(s)
    comp=rd('week-4/fixed/docker-compose.yml'); env=rd('week-4/fixed/.env.production'); dns=rd('week-4/fixed/dns-zone.txt')
    mk('inj1a',{'.env.production': re.sub(r'^JWT_SECRET=.*\n?','',env,flags=re.M)})
    mk('inj1b',{'.env.production': re.sub(r'^JWT_SECRET=.*$','JWT_SECRET=',env,flags=re.M)})
    mk('inj2a',{'docker-compose.yml': rep(comp,'    volumes:\n      - pgdata:/var/lib/postgresql/data\n','')})
    mk('inj2b',{'docker-compose.yml': rep(comp,'volumes:\n  pgdata:\n','')})
    mk('inj3a',{'dns-zone.txt': rep(dns,'app     300   A     203.0.113.10','app     300   A     198.51.100.7')})
    mk('inj3b',{'dns-zone.txt': rep(dns,'api     300   A     203.0.113.10','api     300   A     198.51.100.7')})
    mk('inj3c',{'dns-zone.txt': rep(dns,'app     300   A     203.0.113.10\n','')})
    mk('inj4a',{'.env.production': rep(env,'WEB_ORIGIN=https://app.example.com','WEB_ORIGIN=http://localhost:3000')})
    mk('inj4b',{'.env.production': rep(env,'WEB_ORIGIN=https://app.example.com','WEB_ORIGIN=https://app.example.com/')})
    mk('inj4c',{'.env.production': rep(env,'WEB_ORIGIN=https://app.example.com','WEB_ORIGIN=http://app.example.com')})
    mk('inj5a',{'docker-compose.yml': rep(comp,'  web:\n    image: ghcr.io/acme/booking-web:latest\n    environment:\n      API_INTERNAL_URL: http://api:4000\n    ports: ["127.0.0.1:3000:3000"]\n    logging: *default-logging','  web:\n    image: ghcr.io/acme/booking-web:latest\n    environment:\n      API_INTERNAL_URL: http://api:4000\n    ports: ["127.0.0.1:3000:3000"]')})
    mk('inj5b',{'docker-compose.yml': rep(comp,'    max-file: "5"\n','')})
