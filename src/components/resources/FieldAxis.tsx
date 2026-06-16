interface FieldAxisProps {
  earliest: string;
  evolves: string;
  latest: string;
}

/**
 * The "earliest → latest" rule strip beneath the masthead. Two thin rules
 * flanking a gold "evolves" label.
 */
export function FieldAxis({ earliest, evolves, latest }: FieldAxisProps) {
  return (
    <div className="fg-axis">
      <span className="fg-label fg-label--soft">{earliest}</span>
      <span className="fg-axis__line" />
      <span className="fg-label fg-label--gold">{evolves} &rarr;</span>
      <span className="fg-axis__line" />
      <span className="fg-label fg-label--soft">{latest}</span>
    </div>
  );
}
