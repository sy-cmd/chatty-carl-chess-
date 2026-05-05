import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading = false, fullWidth = false, disabled, className = '', children, ...rest }, ref) => {
    const cls = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      loading ? styles.loading : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={cls} disabled={disabled || loading} aria-busy={loading} {...rest}>
        {loading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : null}
        <span className={loading ? styles.hiddenLabel : undefined}>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
