function AiPromptPanel({ prompt, onCopy, copyFeedback }) {
  return (
    <div className="ai-prompt-section">
      <h3>Generar tarea con ayuda de IA</h3>
      <p>Copiar este prompt y pegarlo en tu IA externa para obtener un JSON listo para importar.</p>
      <textarea className="import-textarea" value={prompt} readOnly rows={10} />
      <div className="import-actions">
        <button className="task-button" type="button" onClick={onCopy}>
          Copiar prompt
        </button>
        {copyFeedback && <div className="import-feedback success">{copyFeedback}</div>}
      </div>
    </div>
  );
}

export default AiPromptPanel;
