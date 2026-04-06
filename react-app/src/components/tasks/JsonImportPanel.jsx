function JsonImportPanel({ importText, onImportTextChange, onImport, importFeedback }) {
  return (
    <div className="import-section">
      <h3>Importar tareas desde JSON</h3>
      <p>Pega aquí el JSON de tareas para añadirlas automáticamente.</p>
      <textarea
        className="import-textarea"
        value={importText}
        onChange={(event) => onImportTextChange(event.target.value)}
        placeholder='Ejemplo: [{ "text": "Estudiar React", "priority": "alta", "dueDate": "2026-04-10", "notes": "Repasar hooks", "estimatedMinutes": 90, "remainingMinutes": 90, "subs": [{ "text": "Leer docs" }] } ]'
        rows={8}
      />
      <div className="import-actions">
        <button className="task-button" type="button" onClick={onImport}>
          Importar JSON
        </button>
        {importFeedback && <div className={`import-feedback ${importFeedback.type}`}>{importFeedback.message}</div>}
      </div>
      <div className="import-template">
        <strong>Ejemplo mínimo válido:</strong>
        <pre>{`[
  {
    "text": "Escribir informe",
    "priority": "normal",
    "dueDate": "2026-04-12",
    "notes": "Incluir resultados y conclusiones.",
    "estimatedMinutes": 120,
    "remainingMinutes": 120,
    "subs": [
      { "text": "Buscar datos" },
      { "text": "Escribir borrador" }
    ]
  }
]`}</pre>
      </div>
    </div>
  );
}

export default JsonImportPanel;
