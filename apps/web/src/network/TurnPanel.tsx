import { useId } from 'react';
import { translate } from '../i18n/translate';

export function TurnPanel({
  open,
  endpoint,
  onEndpoint,
  manual,
  onManual,
  url,
  onUrl,
  username,
  onUsername,
  password,
  onPassword,
  relayOnly,
  onRelayOnly,
  disabled,
  testing,
  status,
  onTest,
}: {
  open: boolean;
  endpoint: string;
  onEndpoint: (value: string) => void;
  manual: boolean;
  onManual: (value: boolean) => void;
  url: string;
  onUrl: (value: string) => void;
  username: string;
  onUsername: (value: string) => void;
  password: string;
  onPassword: (value: string) => void;
  relayOnly: boolean;
  onRelayOnly: (value: boolean) => void;
  disabled: boolean;
  testing: boolean;
  status: string;
  onTest: () => void;
}) {
  const helpId = useId();
  return (
    <details className="advanced turn-panel" open={open || undefined}>
      <summary>{translate('Serveur TURN · héberger une partie')}</summary>
      <p id={helpId}>
        {translate(
          'Renseignez un serveur TURN existant. Le relais transporte les échanges ; gardez le jeu ouvert pour héberger la partie.',
        )}
      </p>
      <fieldset disabled={disabled || testing}>
        <legend>{translate('Configuration du relais')}</legend>
        <label className="field">
          {translate('Méthode de configuration')}
          <select
            value={manual ? 'manual' : 'service'}
            onChange={(e) => onManual(e.target.value === 'manual')}
          >
            <option value="manual">{translate('Saisie manuelle')}</option>
            <option value="service">{translate('Service d’identifiants temporaires')}</option>
          </select>
        </label>
        {manual ? (
          <>
            <label className="field">
              {translate('Adresse TURN')}
              <input
                aria-describedby={helpId}
                value={url}
                onChange={(e) => onUrl(e.target.value)}
                placeholder="turn:turn.example.com:3478, turns:turn.example.com:5349?transport=tcp"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
            <label className="field">
              {translate('Identifiant TURN')}
              <input
                value={username}
                onChange={(e) => onUsername(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
            <label className="field">
              {translate('Mot de passe TURN')}
              <input
                type="password"
                value={password}
                onChange={(e) => onPassword(e.target.value)}
                autoComplete="off"
              />
            </label>
            <p className="setup-note">
              {translate(
                'Les identifiants restent dans cet onglet et ne sont pas inclus dans l’invitation. Les invités devront saisir leurs paramètres TURN. Après fermeture, renseignez-les à nouveau.',
              )}
            </p>
          </>
        ) : (
          <>
            <label className="field">
              {translate('URL du service TURN')}
              <input
                type="url"
                value={endpoint}
                onChange={(e) => onEndpoint(e.target.value)}
                placeholder="https://turn.example.com/credentials"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
            <p className="setup-note">
              {translate(
                'Cette URL publique est incluse dans le lien d’invitation : chaque invité reçoit ses identifiants temporaires. Aucune clé API à saisir ici.',
              )}
            </p>
          </>
        )}
        <label className="toggle">
          <input
            type="checkbox"
            checked={relayOnly}
            onChange={(e) => onRelayOnly(e.target.checked)}
          />
          {translate('Faire passer toutes les connexions par TURN')}
        </label>
        <button type="button" className="secondary" onClick={onTest}>
          {translate('Tester le serveur TURN')}
        </button>
      </fieldset>
      <p role="status" aria-live="polite" className="turn-test-status">
        {testing ? translate('Test du relais…') : translate(status)}
      </p>
      <details>
        <summary>{translate('Installer mon propre serveur TURN')}</summary>
        <p>
          {translate(
            'Le kit Coturn du dépôt fournit le relais, un service d’identifiants temporaires et la configuration HTTPS pour un serveur Linux avec une IP publique.',
          )}
        </p>
        <a
          className="secondary"
          href="https://github.com/Virtuel21/money-tour/blob/main/docs/TURN.md"
          target="_blank"
          rel="noreferrer"
        >
          {translate('Ouvrir le guide d’installation')}
        </a>
      </details>
    </details>
  );
}
