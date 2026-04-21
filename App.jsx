import { useMemo, useState } from 'react';

const commonWords = [
  'password',
  'admin',
  'welcome',
  'qwerty',
  'letmein',
  'iloveyou',
  'dragon',
  'monkey',
  'abc123',
  'football',
  'baseball',
  'pokemon',
];

const wordBank = [
  'river',
  'planet',
  'silver',
  'rocket',
  'garden',
  'thunder',
  'mango',
  'cactus',
  'lantern',
  'falcon',
  'nebula',
  'marble',
  'forest',
  'tiger',
  'ocean',
  'sunset',
  'violet',
  'comet',
  'breeze',
  'castle',
  'pepper',
  'puzzle',
  'anchor',
  'meadow',
];

function getStrengthLabel(score) {
  if (score >= 85) return 'Strong';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Fair';
  if (score > 0) return 'Weak';
  return 'Very Weak';
}

function evaluatePassword(password) {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      feedback: ['Start typing a password to see feedback.'],
      checks: [],
    };
  }

  let score = 0;
  const feedback = [];
  const checks = [];
  const lowered = password.toLowerCase();

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(password);
  const hasSpace = /\s/.test(password);
  const repeatedChars = /(.)\1{2,}/.test(password);
  const repeatedChunk = /(..+).+\1/.test(lowered);
  const sequencePattern =
    /(012|123|234|345|456|567|678|789|abc|bcd|cde|def|qwerty|asdf)/i.test(
      password
    );
  const commonWordUsed = commonWords.some((word) => lowered.includes(word));
  const uniqueRatio = new Set(password).size / password.length;

  checks.push({ label: 'At least 12 characters', passed: password.length >= 12 });
  checks.push({ label: 'Contains lowercase letter', passed: hasLower });
  checks.push({ label: 'Contains uppercase letter', passed: hasUpper });
  checks.push({ label: 'Contains a number', passed: hasNumber });
  checks.push({ label: 'Contains a symbol', passed: hasSymbol || hasSpace });

  if (password.length >= 16) score += 35;
  else if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else {
    score += 5;
    feedback.push('Use at least 12 characters; 14 to 18 is even better.');
  }

  if (hasLower) score += 10;
  else feedback.push('Add lowercase letters.');

  if (hasUpper) score += 10;
  else feedback.push('Add uppercase letters.');

  if (hasNumber) score += 10;
  else feedback.push('Add numbers.');

  if (hasSymbol || hasSpace) score += 10;
  else feedback.push('Add symbols or use a multi-word passphrase.');

  if (uniqueRatio >= 0.7 && password.length >= 10) {
    score += 10;
  } else {
    feedback.push('Avoid too many repeated characters.');
  }

  if (repeatedChars) {
    score -= 15;
    feedback.push('Avoid repeated characters like aaa or 111.');
  }

  if (repeatedChunk) {
    score -= 10;
    feedback.push('Avoid repeating the same chunk more than once.');
  }

  if (sequencePattern) {
    score -= 20;
    feedback.push('Avoid easy sequences like 123, abc, or qwerty.');
  }

  if (commonWordUsed) {
    score -= 25;
    feedback.push('Avoid common words or predictable substitutions.');
  }

  if (password.length >= 20 && (hasSymbol || hasSpace)) {
    score += 10;
  }

  score = Math.max(0, Math.min(100, score));

  if (feedback.length === 0) {
    feedback.push('Nice — this password is long and hard to guess.');
  }

  return {
    score,
    label: getStrengthLabel(score),
    feedback: [...new Set(feedback)],
    checks,
  };
}

function generateRandomPassword(length, options) {
  let chars = '';
  if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.numbers) chars += '0123456789';
  if (options.symbols) chars += '!@#$%^&*()_+-=[]{};:,.?/';

  if (!chars) return '';

  let result = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * chars.length);
    result += chars[index];
  }
  return result;
}

function pickRandomWord() {
  const index = Math.floor(Math.random() * wordBank.length);
  return wordBank[index];
}

function generatePassphrase(wordCount = 4) {
  const separators = ['-', '.', '_', ' '];
  const separator = separators[Math.floor(Math.random() * separators.length)];
  const words = [];

  for (let i = 0; i < wordCount; i += 1) {
    let word = pickRandomWord();
    if (i === 0) {
      word = word[0].toUpperCase() + word.slice(1);
    }
    words.push(word);
  }

  const number = Math.floor(Math.random() * 90 + 10);
  return `${words.join(separator)}!${number}`;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString();
}

export default function App() {
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('random');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);

  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [showFakeAttack, setShowFakeAttack] = useState(false);
  const [simulationTitle, setSimulationTitle] = useState('');
  const [simulationMessage, setSimulationMessage] = useState('');
  const [simulationTips, setSimulationTips] = useState([]);
  const [attackLog, setAttackLog] = useState([]);
  const [terminalLines, setTerminalLines] = useState([
    'PS C:\\Demo> waiting for simulation event...',
  ]);
  const [keyloggerTriggered, setKeyloggerTriggered] = useState(false);

  const result = useMemo(() => evaluatePassword(password), [password]);
  const noCharsetSelected = !Object.values(options).some(Boolean);
  const showFixNow = password.length > 0 && result.score < 40;

  function handleOptionChange(key) {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function addLogEntries(entries) {
    const stamped = entries.map((event) => ({
      time: getCurrentTime(),
      event,
    }));
    setAttackLog((prev) => [...stamped, ...prev]);
  }

  function showSimulation(title, message, tips, logs, terminal) {
    setSimulationTitle(title);
    setSimulationMessage(message);
    setSimulationTips(tips);
    setShowFakeAttack(true);

    addLogEntries(logs);
    setTerminalLines(terminal);
  }

  // Jonathan Suo
  // Simulation #1: Hidden Malicious Code
  // This section handles the fake attack triggered by the Generate button.
  function runFakeGenerateAttack() {
    showSimulation(
      'Fake Attack from Generate!',
      'Be careful when clicking buttons. Even normal-looking buttons can hide unsafe behavior.',
      [
        {
          heading: 'How to know',
          text: 'A button causes something unexpected like a popup, redirect, automatic download, or any action you did not ask for.',
        },
        {
          heading: 'How to avoid',
          text: 'Use trusted websites only, avoid suspicious downloads, and keep your browser and device security updated.',
        },
      ],
      [
        'Generate button triggered the fake attack demo',
        'Pretend background task was blocked',
        'No real system changes were made',
      ],
      [
        'PS C:\\Demo> Start-FakeAttack',
        '[SIMULATION] Pretending to create a startup task...',
        '[SIMULATION] Blocked. This is only a demo.',
        'PS C:\\Demo> no real action was taken',
      ]
    );
  }

  // Extra/shared simulation feature
  // This section handles the fake attack triggered by the Copy Password button.
  function runFakeCopyAttack() {
    showSimulation(
      'Fake Attack from Copy!',
      'Be careful when copying sensitive information. Copied data can be valuable to attackers.',
      [
        {
          heading: 'How to know',
          text: 'Sensitive copied data may be at risk if a device is infected or if suspicious software is monitoring clipboard activity.',
        },
        {
          heading: 'How to avoid',
          text: 'Use password managers when possible, avoid untrusted software, and keep endpoint security tools running.',
        },
      ],
      [
        'Copy button triggered fake attack demo',
        'Pretend data transfer was stopped',
        'No real data was sent anywhere',
      ],
      [
        'PS C:\\Demo> Start-FakeCopyAttack',
        '[SIMULATION] Pretending to watch copied data...',
        '[SIMULATION] Stopped. Demo only.',
        'PS C:\\Demo> no real action was taken',
      ]
    );
  }

  // Vincent Borrelli
  // Simulation #2: Malicious Ad
  // This section handles the fake attack triggered by the demo advertisement.
  function runFakeAdAttack() {
    showSimulation(
      'Fake Attack from Ad!',
      'Be careful when clicking ads. Some ads can look real while hiding unsafe behavior.',
      [
        {
          heading: 'How to know',
          text: 'An ad looks suspicious, promises a free fix or download, or sends you to an unexpected page.',
        },
        {
          heading: 'How to avoid',
          text: 'Avoid suspicious ads, use browser protections or ad blockers, and only download software from trusted sources.',
        },
      ],
      [
        'Demo ad triggered the fake attack demo',
        'Pretend ad-based threat was blocked',
        'No real download or redirect happened',
      ],
      [
        'PS C:\\Demo> Start-FakeAdAttack',
        '[SIMULATION] Pretending to load a bad ad...',
        '[SIMULATION] Blocked. Demo only.',
        'PS C:\\Demo> no real action was taken',
      ]
    );
  }

  // Joseph Hilte
  // Simulation #3: Keylogger
  // This section handles the fake keylogger alert triggered while typing.
  function runFakeKeyloggerAttack() {
    showSimulation(
      'Fake Keylogger Alert!',
      'Even when typing, not every website is safe. Attackers may try to capture what users enter.',
      [
        {
          heading: 'How to know',
          text: 'A site feels suspicious, asks for sensitive information unexpectedly, or behaves strangely while you type.',
        },
        {
          heading: 'How to avoid',
          text: 'Only enter passwords on trusted websites, keep browsers updated, and use security tools that can detect suspicious behavior.',
        },
      ],
      [
        'Typing in the password box triggered the fake attack demo',
        'Pretend keylogging attempt was detected',
        'No real keystrokes were recorded',
      ],
      [
        'PS C:\\Demo> Start-FakeKeylogger',
        '[SIMULATION] Pretending to watch keyboard input...',
        '[SIMULATION] Blocked. Demo only.',
        'PS C:\\Demo> no real action was taken',
      ]
    );
  }

  // Tony Arrington
  // Simulation #4: Fake Security Alert / Fix Now
  // This section handles the fake attack triggered by the Fix Now button.
  function runFakeFixNowAttack() {
    showSimulation(
      'Fake Attack from Fix Now!',
      'Be careful with urgent warning buttons. Even helpful-looking alerts can be fake.',
      [
        {
          heading: 'How to know',
          text: 'A warning tries to scare you, rushes you to click immediately, or claims your device is already infected.',
        },
        {
          heading: 'How to avoid',
          text: 'Slow down, read the message carefully, and only trust security alerts from known and verified software.',
        },
      ],
      [
        'Weak password warning triggered the fake attack demo',
        'User clicked the fake Fix Now button',
        'Pretend harmful action was blocked',
        'No real download or install happened',
      ],
      [
        'PS C:\\Demo> Start-FakeFixNowAttack',
        '[SIMULATION] Pretending to run a fake fix...',
        '[SIMULATION] Blocked. Demo only.',
        'PS C:\\Demo> no real action was taken',
      ]
    );
  }

  // Joseph Hilte
  // This function watches typing in the password field and triggers the keylogger simulation.
  function handlePasswordChange(event) {
    const value = event.target.value;
    setPassword(value);
    setCopied(false);

    if (value.length === 0) {
      setKeyloggerTriggered(false);
      return;
    }

    if (simulationEnabled && value.length >= 3 && !keyloggerTriggered) {
      runFakeKeyloggerAttack();
      setKeyloggerTriggered(true);
    }
  }

  function handleGenerate() {
    if (mode === 'random' && noCharsetSelected) return;

    const nextPassword =
      mode === 'passphrase'
        ? generatePassphrase(4)
        : generateRandomPassword(length, options);

    setPassword(nextPassword);
    setCopied(false);
    setKeyloggerTriggered(false);

    if (simulationEnabled) {
      runFakeGenerateAttack();
    }
  }

  async function handleCopy() {
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);

      if (simulationEnabled) {
        runFakeCopyAttack();
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }

  function clearSimulation() {
    setShowFakeAttack(false);
    setSimulationTitle('');
    setSimulationMessage('');
    setSimulationTips([]);
    setAttackLog([]);
    setTerminalLines(['PS C:\\Demo> waiting for simulation event...']);
  }

  function handleAdKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      runFakeAdAttack();
    }
  }

  return (
    <div className="page">
      <div className="container">
        <header className="hero">
          <p className="eyebrow">Password Strength Web App</p>
          <h1>PasswordPilot</h1>
          <p className="subtitle">
            Check password strength live, see what is weak, and generate stronger
            passwords or passphrases.
          </p>
        </header>

        <section className="card">
          <div className="simulation-header">
            <h2 className="section-title">Cyber Simulation Mode</h2>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={simulationEnabled}
                onChange={() => setSimulationEnabled((prev) => !prev)}
              />
              <span>Enable separate fake attack demos</span>
            </label>
          </div>

          <p className="small-text">
            Demo only. This app does not run real malware or real terminal
            commands. It only simulates attack events inside the page.
          </p>
        </section>

        {/* Vincent Borrelli
            Demo advertisement section used to simulate a malicious ad click. */}
        <section className="card">
          <h2>Demo Advertisement</h2>
          <div
            className="fake-ad"
            onClick={runFakeAdAttack}
            onKeyDown={handleAdKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Demo ad simulation"
          >
            <p className="ad-badge">Demo Ad Simulation</p>
            <h3>Free Security Booster Pro</h3>
            <p>
              Speed up your device, remove threats, and boost protection with
              one quick download. This is a fake ad used only for class demo
              purposes.
            </p>
            <button
              type="button"
              className="primary-btn ad-btn"
              onClick={(event) => {
                event.stopPropagation();
                runFakeAdAttack();
              }}
            >
              Download Now
            </button>
          </div>
        </section>

        {showFakeAttack && (
          <section className="card fake-attack-box">
            <h2>{simulationTitle}</h2>
            <p>{simulationMessage}</p>

            {simulationTips.length > 0 && (
              <div className="tips-box">
                <h3>How to know / How to avoid</h3>
                <ul className="tips-list">
                  {simulationTips.map((tip, index) => (
                    <li key={index}>
                      <strong>{tip.heading}:</strong> {tip.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button className="secondary-btn" onClick={clearSimulation}>
              Clear Simulation
            </button>
          </section>
        )}

        <section className="card">
          <label className="label" htmlFor="password-input">
            Enter a password
          </label>

          {/* Joseph Hilte
              Password input field tied to the fake keylogger simulation. */}
          <input
            id="password-input"
            type="text"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Try typing a password..."
            className="password-input"
          />

          <div className="meter-row">
            <div className="meter">
              <div
                className={`meter-fill ${result.label
                  .toLowerCase()
                  .replace(' ', '-')}`}
                style={{ width: `${result.score}%` }}
              />
            </div>

            <span className="score-label">
              {result.label} ({result.score}/100)
            </span>
          </div>

          <div className="actions">
            <button onClick={handleCopy} className="secondary-btn">
              {copied ? 'Copied!' : 'Copy Password'}
            </button>
          </div>

          {/* Tony Arrington
              Weak password warning section that displays the fake Fix Now attack button. */}
          {showFixNow && (
            <div className="weak-warning-box">
              <h3>Weak Password Detected</h3>
              <p>
                This password scored low, so the app is showing a fake urgent
                action prompt for demonstration purposes.
              </p>
              <button className="danger-btn" onClick={runFakeFixNowAttack}>
                Fix Now
              </button>
            </div>
          )}
        </section>

        <section className="grid">
          <div className="card">
            <h2>Why it got this score</h2>

            <ul className="check-list">
              {result.checks.map((item) => (
                <li key={item.label} className={item.passed ? 'passed' : 'failed'}>
                  <span>{item.passed ? '✓' : '✗'}</span>
                  {item.label}
                </li>
              ))}
            </ul>

            <h3>Suggestions</h3>
            <ul className="feedback-list">
              {result.feedback.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Generate a stronger password</h2>

            <div className="mode-toggle">
              <button
                className={mode === 'random' ? 'toggle active' : 'toggle'}
                onClick={() => setMode('random')}
              >
                Random Password
              </button>

              <button
                className={mode === 'passphrase' ? 'toggle active' : 'toggle'}
                onClick={() => setMode('passphrase')}
              >
                Passphrase
              </button>
            </div>

            {mode === 'random' && (
              <>
                <label className="label" htmlFor="length-input">
                  Length
                </label>

                <input
                  id="length-input"
                  type="range"
                  min="8"
                  max="32"
                  value={length}
                  onChange={(event) => setLength(Number(event.target.value))}
                />

                <p className="small-text">{length} characters</p>

                <div className="options">
                  {Object.keys(options).map((key) => (
                    <label key={key} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={options[key]}
                        onChange={() => handleOptionChange(key)}
                      />
                      <span>{key[0].toUpperCase() + key.slice(1)}</span>
                    </label>
                  ))}
                </div>

                {noCharsetSelected && (
                  <p className="small-text error-text">
                    Select at least one character type.
                  </p>
                )}
              </>
            )}

            {mode === 'passphrase' && (
              <p className="small-text">
                Passphrases are easier to remember and can still be strong when
                they are long and unpredictable.
              </p>
            )}

            <button
              onClick={handleGenerate}
              className="primary-btn"
              disabled={mode === 'random' && noCharsetSelected}
            >
              Generate
            </button>
          </div>
        </section>

        <section className="card">
          <h2>Simulation Log</h2>
          {attackLog.length === 0 ? (
            <p className="small-text">No simulation events yet.</p>
          ) : (
            <ul className="log-list">
              {attackLog.map((item, index) => (
                <li key={`${item.time}-${index}`}>
                  <strong>{item.time}</strong> — {item.event}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Fake Terminal Output</h2>
          <div className="terminal-box">
            {terminalLines.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}