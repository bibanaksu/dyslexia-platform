// frontend/src/components/StartAssessment.jsx
// This is the "cinematic" page shown AFTER child info is filled.
// "Start Now" → /adventure  (the quest map)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap');

  *{margin:0;padding:0;box-sizing:border-box;}

  .sa-root{position:fixed;inset:0;width:100vw;height:100vh;overflow:hidden;font-family:'Nunito',sans-serif;display:flex;align-items:center;justify-content:center;}

  .sa-bg{position:absolute;inset:0;z-index:1;}
  .sa-bg img{width:100%;height:100%;object-fit:cover;object-position:center;display:block;opacity:0;transition:opacity 1s ease;}
  .sa-root.loaded .sa-bg img{opacity:1;}

  .sa-vignette{position:absolute;inset:0;z-index:2;background:linear-gradient(to top,rgba(5,20,8,0.75) 0%,rgba(5,20,8,0.15) 40%,transparent 65%),linear-gradient(to bottom,rgba(5,20,8,0.25) 0%,transparent 30%);pointer-events:none;}

  .sa-particles{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden;}
  .particle{position:absolute;border-radius:50%;opacity:0;animation:particleDrift linear infinite;}
  .sa-root.loaded .particle{opacity:1;}
  .p1{width:6px;height:6px;background:#ffd97a;left:8%;bottom:-10px;animation-duration:8s;animation-delay:0s;}
  .p2{width:4px;height:4px;background:#a8e6a0;left:18%;bottom:-10px;animation-duration:10s;animation-delay:1.5s;}
  .p3{width:7px;height:7px;background:#ffd97a;left:30%;bottom:-10px;animation-duration:7s;animation-delay:0.8s;}
  .p4{width:3px;height:3px;background:#ffffff;left:45%;bottom:-10px;animation-duration:11s;animation-delay:2.2s;}
  .p5{width:5px;height:5px;background:#ffd97a;left:60%;bottom:-10px;animation-duration:9s;animation-delay:0.3s;}
  .p6{width:4px;height:4px;background:#a8e6a0;left:72%;bottom:-10px;animation-duration:8s;animation-delay:1.8s;}
  .p7{width:6px;height:6px;background:#ffffff;left:85%;bottom:-10px;animation-duration:10s;animation-delay:0.6s;}
  .p8{width:3px;height:3px;background:#ffd97a;left:92%;bottom:-10px;animation-duration:7s;animation-delay:3s;}

  @keyframes particleDrift{0%{transform:translateY(0) rotate(0deg);opacity:0;}10%{opacity:0.8;}90%{opacity:0.6;}100%{transform:translateY(-100vh) rotate(360deg);opacity:0;}}

  .sa-sparks{position:absolute;inset:0;z-index:4;pointer-events:none;}
  .spark{position:absolute;color:#ffd97a;font-size:1.1rem;opacity:0;animation:sparkFloat ease-in-out infinite;text-shadow:0 0 8px #ffd97a,0 0 20px rgba(255,217,122,0.5);}
  .sa-root.loaded .spark{opacity:1;}
  .sk1{bottom:42%;left:12%;animation-duration:3.2s;animation-delay:0s;}
  .sk2{bottom:52%;right:14%;animation-duration:4s;animation-delay:0.7s;}
  .sk3{bottom:35%;left:8%;animation-duration:2.8s;animation-delay:1.3s;}
  .sk4{bottom:48%;left:50%;animation-duration:3.6s;animation-delay:0.4s;}
  .sk5{bottom:38%;right:9%;animation-duration:3s;animation-delay:2s;}
  @keyframes sparkFloat{0%,100%{transform:translateY(0) scale(1) rotate(0deg);opacity:0.4;}50%{transform:translateY(-18px) scale(1.3) rotate(15deg);opacity:1;}}

  .sa-content{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;gap:1rem;width:100%;margin-top:189px;opacity:0;transform:translateY(40px);transition:opacity 0.8s ease 0.4s,transform 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.4s;}
  .sa-root.loaded .sa-content{opacity:1;transform:translateY(0);}

  .sa-btn{position:relative;display:inline-flex;align-items:center;gap:0.6rem;padding:1.05rem 2.8rem;font-family:'Baloo 2',cursive;font-size:clamp(1.15rem,2.5vw,1.45rem);font-weight:800;letter-spacing:0.05em;color:#2c3e2c;background:linear-gradient(135deg,#f5d742 0%,#e8b84b 50%,#d4a017 100%);border:2.5px solid rgba(255,245,200,0.5);border-radius:60px;cursor:pointer;outline:none;box-shadow:0 8px 30px rgba(0,0,0,0.4),0 0 25px rgba(255,215,0,0.5);transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s ease;overflow:hidden;}
  .sa-btn::before{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);transform:skewX(-20deg);transition:left 0.5s ease;}
  .sa-btn:hover::before{left:160%;}
  .sa-btn:hover{transform:translateY(-4px) scale(1.03);background:linear-gradient(135deg,#ffea6e 0%,#f5c542 50%,#e5b020 100%);box-shadow:0 16px 40px rgba(0,0,0,0.5),0 0 35px rgba(255,215,0,0.7);}
  .sa-btn:active{transform:translateY(1px) scale(0.98);}
  .btn-arrow{font-size:1.1em;display:inline-block;transition:transform 0.3s ease;}
  .sa-btn:hover .btn-arrow{transform:translateX(6px);}

  .sa-subtext{font-family:'Nunito',sans-serif;font-size:clamp(0.9rem,2vw,1.05rem);font-weight:600;color:rgba(255,255,255,0.85);text-shadow:0 2px 12px rgba(0,0,0,0.6);letter-spacing:0.03em;}

  @media(max-width:768px){.sa-content{margin-top:150px;}.sa-btn{padding:0.95rem 2.2rem;}.sk4,.sk5{display:none;}}
  @media(max-width:480px){.sa-content{margin-top:120px;}.sa-btn{padding:0.85rem 1.9rem;}}
`;

const StartAssessment = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Guard: if no child info, redirect back to form
    const info = localStorage.getItem('child_info');
    if (!info) { navigate('/child-info'); return; }
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, [navigate]);

  // "Start Now" → quest map
  const handleStart = () => navigate('/adventure');

  return (
    <>
      <style>{styles}</style>
      <div className={`sa-root${loaded ? ' loaded' : ''}`}>
        <div className="sa-bg">
          <img
            src="/assets/start1.png"
            alt="Forest Adventure"
            loading="eager"
            decoding="async"
            width="1920"
            height="1080"
            onLoad={() => setLoaded(true)}
            onError={(e) => { e.target.style.opacity = 0; setLoaded(true); }}
          />
        </div>
        <div className="sa-vignette" />
        <div className="sa-particles">
          {['p1','p2','p3','p4','p5','p6','p7','p8'].map(c => <span key={c} className={`particle ${c}`} />)}
        </div>
        <div className="sa-sparks">
          {['sk1','sk2','sk3','sk4','sk5'].map(c => <span key={c} className={`spark ${c}`}>✦</span>)}
        </div>
        <div className="sa-content">
          <button className="sa-btn" onClick={handleStart}>
            <span>Start Now</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default StartAssessment;