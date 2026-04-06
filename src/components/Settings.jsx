import { useState, useEffect } from 'react';

export default function Settings({ onClose }) {
  const [gamerTag, setGamerTag] = useState('');
  const [startWithWindows, setStartWithWindows] = useState(false);
  const [rawgApiKey, setRawgApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await window.api.getSettings();
    if (settings.gamerTag) setGamerTag(settings.gamerTag);
    if (settings.rawgApiKey) setRawgApiKey(settings.rawgApiKey);
    const loginEnabled = await window.api.getLoginItem();
    setStartWithWindows(loginEnabled);
  };

  const handleStartupToggle = async () => {
    const next = !startWithWindows;
    setStartWithWindows(next);
    await window.api.setLoginItem(next);
  };

  const handleSave = async () => {
    await window.api.setSetting('gamerTag', gamerTag.trim());
    await window.api.setSetting('rawgApiKey', rawgApiKey.trim());
    setSaved(true);
    setTimeout(() => onClose(gamerTag.trim()), 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Settings</h2>

        <div className="form-group">
          <label>Gamer Tag</label>
          <input
            type="text"
            value={gamerTag}
            onChange={(e) => setGamerTag(e.target.value)}
            placeholder="Enter your gamer tag..."
            maxLength={30}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>RAWG API Key</label>
          <input
            type="text"
            value={rawgApiKey}
            onChange={(e) => setRawgApiKey(e.target.value)}
            placeholder="Enter your RAWG API key..."
          />
        </div>

        <div className="form-group">
          <label>Startup</label>
          <div className="toggle-row" onClick={handleStartupToggle}>
            <span className="toggle-label">Start with Windows</span>
            <div className={`toggle-switch ${startWithWindows ? 'on' : ''}`}>
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => onClose()}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
