import type { ReactNode } from 'react';

type Variant = 'default' | 'narrow' | 'form';

const layoutClass: Record<Variant, string> = {
  default: 'layout',
  narrow: 'layout layout--narrow',
  form: 'layout layout--form',
};

export function PageShell({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return <div className={layoutClass[variant]}>{children}</div>;
}
