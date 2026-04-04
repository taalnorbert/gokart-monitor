import { useState } from 'react';
import type { KartStyle } from '../../types';
import './Legend.css';

interface LegendProps {
  kartStyles: Map<string, KartStyle>;
}

export const Legend: React.FC<LegendProps> = ({ kartStyles }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const groupColors = Array.from(kartStyles.entries()).slice(0, 8);

  return (
    <section className="legend">
      <button 
        className="legend__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="legend__toggle-icon">{isExpanded ? '-' : '+'}</span>
        <span className="legend__toggle-title">Útmutató - Hogyan értelmezd az adatokat</span>
      </button>
      
      {isExpanded && (
      <div className="legend__sections">
        <div className="legend__section">
          <h4 className="legend__section-title">Táblázat oszlopok</h4>
          <dl className="legend__list">
            <div className="legend__item">
              <dt className="legend__term">Poz.</dt>
              <dd className="legend__definition">Aktuális pozíció a versenyben</dd>
            </div>
            <div className="legend__item">
              <dt className="legend__term">Kart</dt>
              <dd className="legend__definition">A gokart száma (színe a csoportot jelzi)</dd>
            </div>
            <div className="legend__item">
              <dt className="legend__term">Név</dt>
              <dd className="legend__definition">A versenyző neve</dd>
            </div>
            <div className="legend__item">
              <dt className="legend__term">S1, S2, S3</dt>
              <dd className="legend__definition">Szektoridők - a pálya 3 részre van osztva</dd>
            </div>
            <div className="legend__item">
              <dt className="legend__term">Körök</dt>
              <dd className="legend__definition">Megtett körök száma</dd>
            </div>
            <div className="legend__item">
              <dt className="legend__term">Utolsó</dt>
              <dd className="legend__definition">Az utolsó befejezett kör ideje</dd>
            </div>
            <div className="legend__item">
              <dt className="legend__term">Legjobb</dt>
              <dd className="legend__definition">A versenyző legjobb körideje</dd>
            </div>
          </dl>
        </div>

        <div className="legend__section">
          <h4 className="legend__section-title">Időszínek jelentése</h4>
          <div className="legend__colors">
            <div className="legend__color-item">
              <span className="legend__color-sample legend__color-sample--purple"></span>
              <span className="legend__color-text">
                <strong>Lila/Magenta</strong> - Pálya legjobb idő (overall best)
              </span>
            </div>
            <div className="legend__color-item">
              <span className="legend__color-sample legend__color-sample--green"></span>
              <span className="legend__color-text">
                <strong>Zöld</strong> - Személyes legjobb idő (personal best)
              </span>
            </div>
            <div className="legend__color-item">
              <span className="legend__color-sample legend__color-sample--yellow"></span>
              <span className="legend__color-text">
                <strong>Sárga</strong> - Javuló idő az előzőhöz képest
              </span>
            </div>
            <div className="legend__color-item">
              <span className="legend__color-sample legend__color-sample--white"></span>
              <span className="legend__color-text">
                <strong>Fehér</strong> - Normál idő
              </span>
            </div>
            <div className="legend__color-item">
              <span className="legend__color-sample legend__color-sample--red"></span>
              <span className="legend__color-text">
                <strong>Piros</strong> - Lassabb idő vagy büntetés
              </span>
            </div>
          </div>
        </div>

        <div className="legend__section">
          <h4 className="legend__section-title">Státusz jelzések</h4>
          <div className="legend__colors">
            <div className="legend__color-item">
              <span className="legend__status-sample legend__status-sample--pit">PIT</span>
              <span className="legend__color-text">A versenyző a boxban van</span>
            </div>
            <div className="legend__color-item">
              <span className="legend__status-sample legend__status-sample--out">OUT</span>
              <span className="legend__color-text">Kiesett a versenyből</span>
            </div>
            <div className="legend__color-item">
              <span className="legend__status-sample legend__status-sample--fin">FIN</span>
              <span className="legend__color-text">Befejezte a versenyt</span>
            </div>
          </div>
        </div>

        {groupColors.length > 0 && (
          <div className="legend__section">
            <h4 className="legend__section-title">Kart csoportok</h4>
            <p className="legend__description">
              A kartok színe a csoportot vagy kategóriát jelzi. Azonos színű kartok egy csoportba tartoznak.
            </p>
            <div className="legend__kart-groups">
              {groupColors.map(([className, style]) => (
                <span 
                  key={className}
                  className="legend__kart-sample"
                  style={{
                    backgroundColor: style.borderBottomColor,
                    color: style.color
                  }}
                >
                  {className.replace('tn', '')}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="legend__section">
          <h4 className="legend__section-title">Verseny lámpák</h4>
          <div className="legend__colors">
            <div className="legend__color-item">
              <span className="legend__light legend__light--green">●</span>
              <span className="legend__color-text">
                <strong>Zöld</strong> - Verseny folyamatban, szabad a pálya
              </span>
            </div>
            <div className="legend__color-item">
              <span className="legend__light legend__light--yellow">●</span>
              <span className="legend__color-text">
                <strong>Sárga</strong> - Figyelmeztetés, óvatosan
              </span>
            </div>
            <div className="legend__color-item">
              <span className="legend__light legend__light--red">●</span>
              <span className="legend__color-text">
                <strong>Piros</strong> - Verseny megállítva
              </span>
            </div>
          </div>
        </div>

        <div className="legend__section">
          <h4 className="legend__section-title">Kart Rangsor jelzések</h4>
          <div className="legend__colors">
            <div className="legend__color-item">
              <span className="legend__kart-active-sample"></span>
              <span className="legend__color-text">
                <strong>Kék háttér</strong> - A kart jelenleg aktív a pályán
              </span>
            </div>
          </div>
        </div>

        <div className="legend__section legend__section--tips">
          <h4 className="legend__section-title">Tippek</h4>
          <ul className="legend__tips">
            <li>A <strong>Kart Rangsor</strong> megmutatja melyik gokart a leggyorsabb a pályán</li>
            <li>Kattints egy kartra a rangsorban a részletes statisztikákért</li>
            <li>A szektoridők segítenek megérteni hol nyerhetsz vagy veszíthetsz időt</li>
            <li>Figyeld a villogó sorokat - friss pozícióváltást jeleznek</li>
          </ul>
        </div>
      </div>
      )}
    </section>
  );
};
