// frontend/src/components/avis/StarRating.jsx
// Sélecteur d'étoiles 1 à 5, cliquable.

export default function StarRating({ value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="Note" style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          disabled={disabled}
          onClick={() => onChange(n)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 26,
            lineHeight: 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: n <= value ? '#c98a2c' : '#d8d8d8',
            padding: 2,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
