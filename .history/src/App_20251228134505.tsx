import { useEffect, useState } from 'react'
import { parseApexMessage, KartData } from './utils/apexParser'
import './App.css'

function App() {
  const [standings, setStandings] = useState<KartData[]>([]);
  const [status, setStatus] = useState('Kapcsolódás...');

  useEffect(() => {
    // A port (8533) változhat pályánként, SlovakiaRingnél érdemes csekkolni a DevToolst!
    const socket = new WebSocket('wss://www.apex-timing.com:8533/');

    socket.onopen = () => {
      setStatus('Élő kapcsolat');
      // Az Apexnek gyakran kell egy init üzenet
      socket.send('init'); 
    };

    socket.onmessage = (event) => {
      const msg = event.data as string;
      
      if (msg.startsWith('grid||')) {
        const parsedData = parseApexMessage(msg);
        if (parsedData.length > 0) {
          setStandings(parsedData);
          // TODO: Itt fogjuk meghívni a mentést az adatbázisba
        }
      }
    };

    socket.onclose = () => setStatus('Kapcsolat megszakadt');
    socket.onerror = () => setStatus('Hiba a kapcsolatban');

    return () => socket.close();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Gokart Live Monitor</h1>
      <p>Állapot: <strong>{status}</strong></p>
      
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Kart #</th>
            <th>Versenyző</th>
            <th>Utolsó kör</th>
            <th>Legjobb kör</th>
            <th>Körök száma</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((kart) => (
            <tr key={kart.kartNo}>
              <td>{kart.kartNo}</td>
              <td>{kart.driver}</td>
              <td>{kart.lastLap}</td>
              <td style={{ fontWeight: 'bold', color: 'green' }}>{kart.bestLap}</td>
              <td>{kart.laps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
