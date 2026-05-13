import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'md', label = 'Loading…' }: LoadingSpinnerProps) {
  return (
    <div className={`${styles.container} ${styles[size]}`} role="status" aria-label={label}>
      <div className={styles.ring} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
