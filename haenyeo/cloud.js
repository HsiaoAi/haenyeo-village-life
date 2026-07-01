/* ============================================================================
   Cloud save — Supabase + Google login (OPTIONAL).

   This whole module no-ops until you paste your project's URL + anon key below.
   Until then the game runs exactly as before on localStorage (Tier 0).

   SETUP (see the checklist in the chat / README): create a Supabase project,
   run the `saves` table SQL, enable the Google auth provider, add this site's
   URL to the auth redirect allow-list, then paste the two values here.

   The anon (public) key is SAFE to ship in client code — Row Level Security on
   the `saves` table is what actually protects each player's data.
   ========================================================================== */
const SUPABASE_URL      = '';   // ← e.g. 'https://abcdefgh.supabase.co'
const SUPABASE_ANON_KEY = '';   // ← e.g. 'eyJhbGciOi...'  (anon/public key)

const CLOUD_ON = !!(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
let sb = null, cloudUser = null;

/* ---- title-screen status/buttons ---- */
function cloudStatus(txt, signedIn){
  const s  = document.getElementById('cloudStatus');
  const bi = document.getElementById('cloudSignIn');
  const bo = document.getElementById('cloudSignOut');
  if(s)  s.textContent = txt || '';
  if(bi) bi.style.display = (CLOUD_ON && !signedIn) ? '' : 'none';
  if(bo) bo.style.display = (CLOUD_ON &&  signedIn) ? '' : 'none';
}

/* ---- remote read / write against the per-user `saves` row ---- */
async function cloudPull(){
  if(!sb || !cloudUser) return null;
  const { data, error } = await sb.from('saves').select('data').eq('user_id', cloudUser.id).maybeSingle();
  if(error){ console.warn('[cloud] pull failed', error.message); return null; }
  return data ? data.data : null;   // the stored {v,t,G} payload
}
async function cloudPush(payload){   // called by game.js saveGame() — best effort
  if(!sb || !cloudUser || !payload) return;
  const { error } = await sb.from('saves')
    .upsert({ user_id: cloudUser.id, data: payload, updated_at: new Date().toISOString() });
  if(error) console.warn('[cloud] push failed', error.message);
}

/* ---- on sign-in: reconcile remote vs local by timestamp (last-write-wins) ---- */
async function onSignedIn(user){
  cloudUser = user;
  cloudStatus('Synced · ' + (user.email || 'Google account'), true);
  const remote = await cloudPull();
  let local = null;
  try{ local = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); }catch(e){}
  const rt = (remote && remote.t) || 0, lt = (local && local.t) || 0;
  if(remote && rt >= lt){
    // cloud is newer (or equal): adopt it locally and into the running game
    if(typeof applySave === 'function' && applySave(remote)){
      try{ localStorage.setItem(SAVE_KEY, JSON.stringify(remote)); }catch(e){}
      if(typeof _started !== 'undefined' && _started && typeof syncHud === 'function') syncHud();
      if(typeof toast === 'function') toast('☁️ Cloud save loaded');
    }
  } else if(local){
    // local is newer, or the cloud has nothing yet: seed the cloud from local
    cloudPush(local);
  }
}

function signInWithGoogle(){
  if(!sb) return;
  sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: location.href.split('#')[0] } });
}
function signOutCloud(){ if(sb) sb.auth.signOut(); }

function initCloud(){
  if(!CLOUD_ON){ cloudStatus('Cloud save: not configured', false); return; }
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const bi = document.getElementById('cloudSignIn'); if(bi) bi.onclick = signInWithGoogle;
  const bo = document.getElementById('cloudSignOut'); if(bo) bo.onclick = signOutCloud;
  sb.auth.onAuthStateChange((_evt, session) => {
    if(session && session.user) onSignedIn(session.user);
    else { cloudUser = null; cloudStatus('Not signed in', false); }
  });
  sb.auth.getSession().then(({ data }) => {
    if(data.session && data.session.user) onSignedIn(data.session.user);
    else cloudStatus('Not signed in', false);
  });
}
window.addEventListener('load', initCloud);
