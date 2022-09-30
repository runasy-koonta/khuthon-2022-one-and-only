import React, {useRef, useState} from 'react';

import './App.css';
import Game from "./Game";

function App() {
  const [gameStatus, setGameStatus] = useState<'LOGIN' | 'INGAME'>('LOGIN');
  const [nickname, setNickname] = useState<string>('');
  const iptNickname = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    setNickname(iptNickname.current!.value);
    setGameStatus('INGAME');
  }

  if (gameStatus === 'LOGIN') {
    return (
      <div className={"LoginPage"}>
        <div className={"LogoArea"}>CoUniv</div>
        <div className={"LoginWrapper"}>
          <input ref={iptNickname} className={"input"} defaultValue={`익명 ${Math.floor(Math.random() * 10000)}`} /><br />
          <button className={"button"} onClick={handleLogin}>JOIN</button>
        </div>
      </div>
    );
  } else {
    return <Game nickname={nickname} />
  }
}

export default App;
